"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  ArrowUpRight,
  QrCode,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

import { getTokenBalance, getNativeBalance } from "@/utils/token-sync"
import { isPrivateKeyConfigured } from "@/app/lib/wallet-utils"
import { sendAdminReward, sendTransaction } from "@/app/actions/blockchain-actions"
import { transferTokenFromPool } from "@/app/actions/token-transfer-actions"

// Supported cryptocurrencies with their respective networks and contract addresses
const SUPPORTED_CRYPTOS = [
  {
    id: "ETH",
    name: "Ethereum",
    symbol: "ETH",
    icon: "🔷",
    decimals: 18,
    network: "ethereum",
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/demo",
    explorer: "https://etherscan.io",
    isMainnet: true,
  },
  {
    id: "BTC",
    name: "Bitcoin",
    symbol: "BTC",
    icon: "₿",
    decimals: 8,
    network: "bitcoin",
    rpcUrl: "https://btc.getblock.io/mainnet/",
    explorer: "https://www.blockchain.com/explorer",
    isMainnet: true,
  },
  {
    id: "BNB",
    name: "Binance Coin",
    symbol: "BNB",
    icon: "🟡",
    decimals: 18,
    network: "bsc",
    rpcUrl: "https://bsc-dataseed.binance.org/",
    explorer: "https://bscscan.com",
    isMainnet: true,
  },
  {
    id: "SOL",
    name: "Solana",
    symbol: "SOL",
    icon: "🟣",
    decimals: 9,
    network: "solana",
    rpcUrl: "https://api.mainnet-beta.solana.com",
    explorer: "https://explorer.solana.com",
    isMainnet: true,
  },
  {
    id: "MATIC",
    name: "Polygon",
    symbol: "MATIC",
    icon: "🟪",
    decimals: 18,
    network: "polygon",
    rpcUrl: "https://polygon-rpc.com",
    explorer: "https://polygonscan.com",
    isMainnet: true,
  },
  {
    id: "USDT",
    name: "Tether",
    symbol: "USDT",
    icon: "💵",
    decimals: 6,
    network: "ethereum",
    contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/demo",
    explorer: "https://etherscan.io",
    isMainnet: true,
  },
  {
    id: "USDC",
    name: "USD Coin",
    symbol: "USDC",
    icon: "💲",
    decimals: 6,
    network: "ethereum",
    contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/demo",
    explorer: "https://etherscan.io",
    isMainnet: true,
  },
  {
    id: "DAI",
    name: "Dai Stablecoin",
    symbol: "DAI",
    icon: "🔶",
    decimals: 18,
    network: "ethereum",
    contractAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/demo",
    explorer: "https://etherscan.io",
    isMainnet: true,
  },
]

// ERC20 Token ABI for token operations
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
]

// Local storage keys
const ADMIN_WALLET_BALANCES_KEY = "adminWalletBalances"
const ADMIN_WALLET_SETTINGS_KEY = "adminWalletSettings"

// Network status interface
interface NetworkStatus {
  connected: boolean
  latency: number | null
  blockHeight: number | null
  error: string | null
  lastChecked: Date
}

export default function AdminWallet() {
  const [adminWalletAddress, setAdminWalletAddress] = useState(
    process.env.ADMIN_WALLET || "0x5E6c692142915ECB0ab39deBcfB38609216D61B8",
  )
  const [balances, setBalances] = useState<Record<string, string>>({})
  const [selectedCrypto, setSelectedCrypto] = useState("ETH")
  const [fundAmount, setFundAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [poolAddress, setPoolAddress] = useState(process.env.LIQUIDITY_POOL_ADDRESS || "")
  const [poolBalances, setPoolBalances] = useState<Record<string, string>>({})
  const [networkStatus, setNetworkStatus] = useState<Record<string, NetworkStatus>>({})
  const [sendAddress, setSendAddress] = useState("")
  const [sendAmount, setSendAmount] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [activeTab, setActiveTab] = useState("balances")
  const [receiveAddresses, setReceiveAddresses] = useState<Record<string, string>>({})
  const [selectedReceiveCrypto, setSelectedReceiveCrypto] = useState("ETH")
  const [showReceiveDialog, setShowReceiveDialog] = useState(false)
  const [transactionHistory, setTransactionHistory] = useState<any[]>([])
  const [checkingNetworks, setCheckingNetworks] = useState(false)
  const { toast } = useToast()
  const [connectionFailed, setConnectionFailed] = useState(false)

  // Load saved settings and balances on component mount
  useEffect(() => {
    // Check for required environment variables
    if (!isPrivateKeyConfigured()) {
      setApiError(
        "WARNING: Private key not properly configured. Transactions will fail until you add your private key to the PRIVATE_KEY environment variable.",
      )
    }

    // Load saved balances from localStorage
    const loadSavedBalances = () => {
      try {
        const savedBalances = localStorage.getItem(ADMIN_WALLET_BALANCES_KEY)
        if (savedBalances) {
          setBalances(JSON.parse(savedBalances))
        }
      } catch (e) {
        console.error("Error parsing saved balances:", e)
      }
    }

    // Load saved settings from localStorage
    const loadSavedSettings = () => {
      try {
        const savedSettings = localStorage.getItem(ADMIN_WALLET_SETTINGS_KEY)
        if (savedSettings) {
          const { poolAddress: savedPoolAddress, activeTab: savedActiveTab } = JSON.parse(savedSettings)
          if (savedPoolAddress) {
            setPoolAddress(savedPoolAddress)
            // Don't automatically fetch pool balances on load to avoid connection errors
          }
          if (savedActiveTab) {
            setActiveTab(savedActiveTab)
          }
        }
      } catch (e) {
        console.error("Error parsing saved settings:", e)
      }
    }

    // Load transaction history
    const loadTransactionHistory = () => {
      try {
        const savedHistory = localStorage.getItem("transactionHistory")
        if (savedHistory) {
          setTransactionHistory(JSON.parse(savedHistory))
        }
      } catch (e) {
        console.error("Error parsing transaction history:", e)
      }
    }

    loadSavedBalances()
    loadSavedSettings()
    loadTransactionHistory()

    // Check network connectivity with error handling
    try {
      checkNetworkConnectivity().catch((err) => {
        console.error("Network connectivity check failed:", err)
        // Don't show error to user, just log it
      })
    } catch (error) {
      console.error("Error during network connectivity check:", error)
    }

    // Generate receive addresses
    try {
      generateReceiveAddresses()
    } catch (error) {
      console.error("Error generating receive addresses:", error)
    }

    // Fetch admin wallet balance with error handling
    if (adminWalletAddress) {
      fetchAdminBalance().catch((err) => {
        console.error("Initial balance fetch failed:", err)
        setApiError(`Failed to load initial balances: ${err.message}`)
      })
    }

    // Save settings when component unmounts
    return () => {
      saveSettings()
    }
  }, [])

  // Save active tab when it changes
  useEffect(() => {
    saveSettings()
  }, [activeTab])

  // Save transaction history when it changes
  useEffect(() => {
    if (transactionHistory.length > 0) {
      localStorage.setItem("transactionHistory", JSON.stringify(transactionHistory))
    }
  }, [transactionHistory])

  // Listen for balance updates from other components
  useEffect(() => {
    const handleBalanceUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.balances) {
        // Merge with existing balances
        setBalances((prev) => ({
          ...prev,
          ...event.detail.balances,
        }))
      }
    }

    // Add event listener
    window.addEventListener("wallet-balances-updated", handleBalanceUpdate as EventListener)

    // Clean up
    return () => {
      window.removeEventListener("wallet-balances-updated", handleBalanceUpdate as EventListener)
    }
  }, [])

  const resetWallet = async () => {
    // Don't clear balances immediately
    setFundAmount("")
    setApiError(null)
    setSuccess(null)
    setSendAddress("")
    setSendAmount("")

    // Fetch admin wallet balance
    if (adminWalletAddress) {
      await fetchAdminBalance()
    }
  }

  const checkNetworkConnectivity = async () => {
    setCheckingNetworks(true)
    const statusUpdates: Record<string, NetworkStatus> = {}

    // Get unique networks from supported cryptos
    const uniqueNetworks = [...new Set(SUPPORTED_CRYPTOS.map((crypto) => crypto.network))]

    // Check each network's connectivity
    for (const network of uniqueNetworks) {
      const crypto = SUPPORTED_CRYPTOS.find((c) => c.network === network)
      if (!crypto) continue

      statusUpdates[network] = {
        connected: false,
        latency: null,
        blockHeight: null,
        error: null,
        lastChecked: new Date(),
      }

      try {
        const startTime = Date.now()

        if (network === "ethereum" || network === "bsc" || network === "polygon") {
          // For EVM-compatible chains
          try {
            const provider = new ethers.JsonRpcProvider(crypto.rpcUrl, undefined, {
              staticNetwork: true,
              timeout: 10000, // 10 second timeout for network checks
              polling: false,
              batchStallTime: 0,
            })

            const blockNumber = await provider.getBlockNumber()

            const endTime = Date.now()
            const latency = endTime - startTime

            statusUpdates[network] = {
              connected: true,
              latency,
              blockHeight: blockNumber,
              error: null,
              lastChecked: new Date(),
            }
          } catch (error) {
            console.warn(`Failed to connect to ${network}:`, error.message)
            statusUpdates[network] = {
              connected: false,
              latency: null,
              blockHeight: null,
              error: `Connection failed: ${error.message}`,
              lastChecked: new Date(),
            }
          }
        } else if (network === "bitcoin") {
          // For Bitcoin, we'd use a Bitcoin-specific library
          // This is a placeholder - in a real app, you'd use a Bitcoin-specific library
          await new Promise((resolve) => setTimeout(resolve, 500))

          const endTime = Date.now()
          const latency = endTime - startTime

          statusUpdates[network] = {
            connected: true,
            latency,
            blockHeight: 800000, // Placeholder value
            error: null,
            lastChecked: new Date(),
          }
        } else if (network === "solana") {
          // For Solana, we'd use a Solana-specific library
          // This is a placeholder - in a real app, you'd use @solana/web3.js
          await new Promise((resolve) => setTimeout(resolve, 300))

          const endTime = Date.now()
          const latency = endTime - startTime

          statusUpdates[network] = {
            connected: true,
            latency,
            blockHeight: 200000000, // Placeholder value
            error: null,
            lastChecked: new Date(),
          }
        }
      } catch (error) {
        console.error(`Error connecting to ${network}:`, error)
        statusUpdates[network] = {
          connected: false,
          latency: null,
          blockHeight: null,
          error: error.message,
          lastChecked: new Date(),
        }
      }
    }

    setNetworkStatus(statusUpdates)
    setCheckingNetworks(false)
    return statusUpdates
  }

  const generateReceiveAddresses = async () => {
    const addresses: Record<string, string> = {}

    for (const crypto of SUPPORTED_CRYPTOS) {
      if (crypto.network === "ethereum" || crypto.network === "bsc" || crypto.network === "polygon") {
        // For EVM chains, use the admin wallet address
        addresses[crypto.id] = adminWalletAddress
      } else if (crypto.network === "bitcoin") {
        // For Bitcoin, we would need to generate or fetch a real Bitcoin address
        // This would require integration with a Bitcoin wallet service
        try {
          // This is a placeholder for real Bitcoin address generation
          // In a real implementation, you would use a Bitcoin wallet service API
          addresses[crypto.id] = adminWalletAddress
        } catch (error) {
          console.error("Error generating Bitcoin address:", error)
          addresses[crypto.id] = ""
        }
      } else if (crypto.network === "solana") {
        // For Solana, we would need to generate or fetch a real Solana address
        // This would require integration with a Solana wallet service
        try {
          // This is a placeholder for real Solana address generation
          // In a real implementation, you would use a Solana wallet service API
          addresses[crypto.id] = adminWalletAddress
        } catch (error) {
          console.error("Error generating Solana address:", error)
          addresses[crypto.id] = ""
        }
      }
    }

    setReceiveAddresses(addresses)
  }

  const fetchAdminBalance = async () => {
    if (!adminWalletAddress) return

    setBalanceLoading(true)
    setApiError(null)
    setConnectionFailed(false) // Reset connection failed state

    // Don't clear existing balances while loading
    const newBalances = { ...balances }

    try {
      // Fetch balances for each cryptocurrency
      for (const crypto of SUPPORTED_CRYPTOS) {
        try {
          if (crypto.network === "ethereum" || crypto.network === "bsc" || crypto.network === "polygon") {
            // Create provider with better error handling and timeout
            const provider = new ethers.JsonRpcProvider(crypto.rpcUrl, undefined, {
              staticNetwork: true,
              timeout: 30000, // 30 second timeout
              polling: false,
              batchStallTime: 0,
            })

            // Test the connection before proceeding
            try {
              await provider.getBlockNumber()
              console.log(`Successfully connected to ${crypto.network} network`)
            } catch (connectionError) {
              console.error(`Failed to connect to ${crypto.network} network:`, connectionError)
              throw new Error(`Error connecting to ${crypto.network}: ${connectionError.message}`)
            }

            if (crypto.contractAddress) {
              // For ERC20 tokens
              const { formatted } = await getTokenBalance(crypto.contractAddress, adminWalletAddress, provider)
              newBalances[crypto.id] = formatted
            } else {
              // For native tokens (ETH, BNB, MATIC)
              const { formatted } = await getNativeBalance(adminWalletAddress, provider)
              newBalances[crypto.id] = formatted
            }
          } else if (crypto.network === "bitcoin") {
            // For Bitcoin, we need to use a Bitcoin-specific API
            // This would require a real Bitcoin API integration
            // For now, we'll use mock data
            newBalances[crypto.id] = newBalances[crypto.id] || "0"
          } else if (crypto.network === "solana") {
            // For Solana, we need to use a Solana-specific API
            // This would require a real Solana API integration
            // For now, we'll use mock data
            newBalances[crypto.id] = newBalances[crypto.id] || "0"
          }
        } catch (error) {
          console.error(`Error fetching ${crypto.id} balance:`, error)
          // Don't reset balance to 0 if we already have a value
          if (!newBalances[crypto.id]) {
            newBalances[crypto.id] = "0"
          }
        }
      }

      setBalances(newBalances)

      // Save balances to localStorage
      localStorage.setItem(ADMIN_WALLET_BALANCES_KEY, JSON.stringify(newBalances))

      // Broadcast balance update to other components
      window.dispatchEvent(
        new CustomEvent("wallet-balances-updated", {
          detail: { balances: newBalances },
        }),
      )
    } catch (error) {
      console.error("Error fetching admin balances:", error)
      setApiError(`Failed to fetch admin wallet balances: ${error.message}`)
      setConnectionFailed(true) // Set connection failed state
    } finally {
      setBalanceLoading(false)
    }
  }

  const fetchPoolBalances = async (address: string) => {
    if (!address) return

    setLoading(true)
    setApiError(null)

    try {
      const newPoolBalances: Record<string, string> = {}

      // Fetch pool balances for each cryptocurrency
      for (const crypto of SUPPORTED_CRYPTOS) {
        try {
          if (crypto.network === "ethereum" || crypto.network === "bsc" || crypto.network === "polygon") {
            const provider = new ethers.JsonRpcProvider(crypto.rpcUrl)

            if (crypto.contractAddress) {
              // For ERC20 tokens
              const tokenContract = new ethers.Contract(crypto.contractAddress, ERC20_ABI, provider)
              try {
                const balance = await tokenContract.balanceOf(address)
                const formattedBalance = ethers.formatUnits(balance, crypto.decimals)
                newPoolBalances[crypto.id] = formattedBalance
                console.log(`Fetched ${crypto.id} balance:`, {
                  raw: balance.toString(),
                  formatted: formattedBalance,
                  decimals: crypto.decimals,
                })
              } catch (error) {
                console.error(`Error fetching ${crypto.id} balance:`, error)
                newPoolBalances[crypto.id] = "0"
              }
            } else {
              // For native tokens (ETH, BNB, MATIC)
              const balance = await provider.getBalance(address)
              newPoolBalances[crypto.id] = ethers.formatEther(balance)
            }
          } else {
            // For non-EVM chains, we'd use chain-specific libraries
            // This is a placeholder
            newPoolBalances[crypto.id] = "0"
          }
        } catch (error) {
          console.error(`Error fetching pool ${crypto.id} balance:`, error)
          newPoolBalances[crypto.id] = "0"
        }
      }

      setPoolBalances(newPoolBalances)
    } catch (error) {
      console.error("Error fetching pool balances:", error)
      setApiError("Failed to fetch pool balances. Please check the address and try again.")
    } finally {
      setLoading(false)
    }
  }

  const fundAdminWallet = async () => {
    if (!adminWalletAddress || !fundAmount) {
      setApiError("Please fill in all required fields")
      return
    }

    setLoading(true)
    setApiError(null)
    setSuccess(null)

    try {
      const crypto = SUPPORTED_CRYPTOS.find((c) => c.id === selectedCrypto)

      if (!crypto) {
        throw new Error("Selected cryptocurrency not found")
      }

      // Check if we're on mainnet for this crypto
      if (!crypto.isMainnet) {
        throw new Error(
          `Warning: You are not on the mainnet for ${crypto.name}. Please switch to mainnet before proceeding.`,
        )
      }

      console.log(`Starting fund operation: ${selectedCrypto}, amount: ${fundAmount}`)

      // For token transfers (USDC, DAI, USDT), use the transferTokenFromPool function
      if (selectedCrypto === "USDC" || selectedCrypto === "DAI" || selectedCrypto === "USDT") {
        console.log(`Using transferTokenFromPool for ${selectedCrypto}`)

        // Call the server action to transfer tokens from the pool
        const result = await transferTokenFromPool(selectedCrypto, fundAmount)
        console.log(`${selectedCrypto} transfer result:`, result)

        if (!result.success) {
          throw new Error(result.error || `Failed to transfer ${selectedCrypto}`)
        }

        // Get the appropriate block explorer URL
        const explorerUrl = result.explorerUrl || `https://etherscan.io/tx/${result.txHash}`

        // Add to transaction history
        const newTransaction = {
          id: Date.now(),
          type: "Fund",
          asset: selectedCrypto,
          amount: fundAmount,
          from: "Liquidity Pool",
          to: adminWalletAddress,
          txHash: result.txHash,
          explorerUrl,
          timestamp: new Date().toISOString(),
          status: "Completed",
        }

        setTransactionHistory([newTransaction, ...transactionHistory])

        // Update admin balance
        await fetchAdminBalance()

        // Show success message with explorer link
        const successMessage = `Successfully funded admin wallet with ${fundAmount} ${selectedCrypto} using the transferTokens function. Transaction hash: ${result.txHash}`
        setSuccess(successMessage)

        toast({
          title: "Transaction Successful",
          description: (
            <div>
              Successfully funded admin wallet with {fundAmount} {selectedCrypto}
              <div className="mt-2">
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                  View on blockchain explorer
                </a>
              </div>
            </div>
          ),
          variant: "success",
        })
      } else {
        // For ETH, try multiple methods with enhanced error handling
        console.log(`Attempting to fund with ${fundAmount} ETH`)

        // Get environment variables
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL
        if (!rpcUrl) {
          throw new Error("RPC URL not configured in environment variables")
        }

        const liquidityPoolAddress = process.env.LIQUIDITY_POOL_ADDRESS || poolAddress
        if (!liquidityPoolAddress) {
          throw new Error("Liquidity pool address not configured")
        }

        // Create provider and signer for direct contract interaction
        const provider = new ethers.JsonRpcProvider(rpcUrl)

        // We can't access the private key directly in the client component
        // Instead, we'll use the server action but with more detailed logging

        console.log(`Using server action sendAdminReward with amount: ${fundAmount}`)
        console.log(`Admin wallet: ${adminWalletAddress}`)
        console.log(`Pool address: ${liquidityPoolAddress}`)

        // Try the server action with detailed error handling
        const result = await sendAdminReward(fundAmount)
        console.log("Server action result:", result)

        if (!result.success) {
          // If the server action failed, provide more detailed error information
          console.error("Server action failed:", result.error)

          // Check if it's a revert error and provide more specific guidance
          if (result.error && result.error.includes("reverted")) {
            throw new Error(
              `Transaction reverted: The contract rejected the transaction. This could be because:
              1. Your wallet doesn't have permission to call this function
              2. The function doesn't exist on the contract
              3. The contract has internal checks that failed
              
              Try checking the contract permissions or using a different function.`,
            )
          }

          throw new Error(result.error || "Failed to fund admin wallet")
        }

        // Get the appropriate block explorer URL
        let explorerUrl = result.explorerUrl || ""
        if (!explorerUrl && crypto.explorer) {
          explorerUrl = `${crypto.explorer}/tx/${result.txHash}`
        }

        // Add to transaction history
        const newTransaction = {
          id: Date.now(),
          type: "Fund",
          asset: crypto.id,
          amount: fundAmount,
          from: poolAddress,
          to: adminWalletAddress,
          txHash: result.txHash,
          explorerUrl,
          timestamp: new Date().toISOString(),
          status: "Completed",
        }

        setTransactionHistory([newTransaction, ...transactionHistory])

        // Update admin balance
        await fetchAdminBalance()

        // Update pool balance
        await fetchPoolBalances(poolAddress)

        // Show success message with explorer link
        const successMessage = `Successfully funded admin wallet with ${fundAmount} ${selectedCrypto} from liquidity pool. Transaction hash: ${result.txHash}`
        setSuccess(successMessage)

        toast({
          title: "Transaction Successful",
          description: (
            <div>
              Successfully funded admin wallet with {fundAmount} {selectedCrypto}
              {explorerUrl && (
                <div className="mt-2">
                  <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                    View on blockchain explorer
                  </a>
                </div>
              )}
            </div>
          ),
          variant: "success",
        })
      }

      // Clear input
      setFundAmount("")
    } catch (error: any) {
      console.error("Error funding admin wallet:", error)

      // Provide more helpful error messages
      if (error.message.includes("insufficient funds")) {
        setApiError(
          "Insufficient ETH for gas fees. Your wallet needs more ETH to pay for transaction fees. " +
            "Please add ETH to your wallet before trying again.",
        )
      } else if (error.message.includes("private key")) {
        setApiError("Private key not configured. Please check your server environment variables.")
      } else if (error.message.includes("Insufficient") && error.message.includes("balance")) {
        // Handle insufficient token balance error with more details
        setApiError(error.message)

        // Refresh pool balances to show accurate data
        if (poolAddress) {
          fetchPoolBalances(poolAddress)
        }
      } else if (error.message.includes("reverted")) {
        setApiError(
          "Transaction reverted: The contract rejected the transaction. This could be because:\n" +
            "1. Your wallet doesn't have permission to call this function\n" +
            "2. The function doesn't exist on the contract\n" +
            "3. The contract has internal checks that failed\n\n" +
            "Try checking the contract permissions or using a different function.",
        )
      } else {
        setApiError(`Failed to fund admin wallet: ${error.message}`)
      }

      toast({
        title: "Transaction Failed",
        description: error.message.includes("insufficient funds")
          ? "Insufficient ETH for gas fees. Please add ETH to your wallet."
          : `Failed to fund admin wallet: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendTransaction = async () => {
    if (!adminWalletAddress || !sendAddress || !sendAmount) {
      setApiError("Please fill in all required fields")
      return
    }

    setIsSending(true)
    setApiError(null)
    setSuccess(null)

    try {
      const crypto = SUPPORTED_CRYPTOS.find((c) => c.id === selectedCrypto)

      if (!crypto) {
        throw new Error("Selected cryptocurrency not found")
      }

      // Check if we're on mainnet for this crypto
      if (!crypto.isMainnet) {
        throw new Error(
          `Warning: You are not on the mainnet for ${crypto.name}. Please switch to mainnet before proceeding.`,
        )
      }

      // Use our server action to send the transaction
      const result = await sendTransaction(
        sendAddress,
        sendAmount,
        selectedCrypto,
        crypto.contractAddress,
        crypto.decimals,
      )

      if (!result.success) {
        throw new Error(result.error || "Failed to send transaction")
      }

      // Get the appropriate block explorer URL
      let explorerUrl = result.explorerUrl || ""
      if (!explorerUrl && crypto.explorer) {
        explorerUrl = `${crypto.explorer}/tx/${result.txHash}`
      }

      // Add to transaction history
      const newTransaction = {
        id: Date.now(),
        type: "Send",
        asset: crypto.id,
        amount: sendAmount,
        from: adminWalletAddress,
        to: sendAddress,
        txHash: result.txHash,
        explorerUrl,
        timestamp: new Date().toISOString(),
        status: "Completed",
      }

      setTransactionHistory([newTransaction, ...transactionHistory])

      // Update admin balance
      await fetchAdminBalance()

      // Show success message with explorer link
      const successMessage = `Successfully sent ${sendAmount} ${selectedCrypto} to ${sendAddress}. Transaction hash: ${result.txHash}`
      setSuccess(successMessage)

      toast({
        title: "Transaction Successful",
        description: (
          <div>
            Successfully sent {sendAmount} {selectedCrypto}
            {explorerUrl && (
              <div className="mt-2">
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                  View on blockchain explorer
                </a>
              </div>
            )}
          </div>
        ),
        variant: "success",
      })

      // Clear inputs
      setSendAddress("")
      setSendAmount("")
    } catch (error: any) {
      console.error("Error sending transaction:", error)
      setApiError(`Failed to send transaction: ${error.message}`)

      toast({
        title: "Transaction Failed",
        description: `Failed to send transaction: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      toast({
        title: "Copied to Clipboard",
        description: "Address copied to clipboard",
      })
    } catch (error) {
      console.error("Error copying to clipboard:", error)
    }
  }

  // Calculate USD value for a cryptocurrency balance
  const getUsdValue = (cryptoId: string, balance: string) => {
    // Mock price data for demo purposes
    const prices: Record<string, number> = {
      ETH: 3000,
      BTC: 40000,
      BNB: 300,
      SOL: 100,
      MATIC: 0.8,
      USDT: 1,
      USDC: 1,
      DAI: 1,
    }

    const price = prices[cryptoId] || 0
    return Number(balance) * price
  }

  const getExplorerUrl = (network: string, type: "address" | "tx", value: string) => {
    const crypto = SUPPORTED_CRYPTOS.find((c) => c.network === network)
    if (!crypto || !crypto.explorer) return ""

    return `${crypto.explorer}/${type}/${value}`
  }

  // Save settings to localStorage
  const saveSettings = () => {
    try {
      const settings = {
        poolAddress,
        activeTab,
      }
      localStorage.setItem(ADMIN_WALLET_SETTINGS_KEY, JSON.JSON.stringify(settings))
    } catch (error) {
      console.error("Error saving settings:", error)
    }
  }

  // Get network status color based on latency
  const getNetworkStatusColor = (status: NetworkStatus | undefined) => {
    if (!status || !status.connected) return "bg-red-500"
    if (status.latency === null) return "bg-yellow-500"
    if (status.latency < 300) return "bg-green-500"
    if (status.latency < 1000) return "bg-yellow-500"
    return "bg-red-500"
  }

  // Format time ago
  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + " years ago"

    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + " months ago"

    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + " days ago"

    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + " hours ago"

    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + " minutes ago"

    return Math.floor(seconds) + " seconds ago"
  }

  return (
    <div className="space-y-6">
      {connectionFailed ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Connection Error</CardTitle>
            <CardDescription className="text-zinc-400">Unable to connect to Ethereum network</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-md bg-red-900/50 border border-red-800 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-300">
                  {apiError || "Failed to connect to Ethereum network. Please check your connection and try again."}
                </p>
                <p className="text-xs text-red-400 mt-2">
                  This could be due to:
                  <ul className="list-disc pl-5 mt-1">
                    <li>Invalid or expired RPC URL</li>
                    <li>Network connectivity issues</li>
                    <li>Rate limiting from the RPC provider</li>
                  </ul>
                </p>
              </div>
            </div>

            <Button
              onClick={() => {
                setConnectionFailed(false)
                fetchAdminBalance()
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Admin Wallet</CardTitle>
            <CardDescription className="text-zinc-400">
              Manage your admin wallet and fund it from the liquidity pool
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Network Status Indicators */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Network Status</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkNetworkConnectivity}
                  disabled={checkingNetworks}
                  className="text-xs h-6 px-2 bg-zinc-800 border-zinc-700 text-zinc-300"
                >
                  {checkingNetworks ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Refresh
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(networkStatus).map(([network, status]) => (
                  <div key={network} className="p-3 rounded-md bg-zinc-800 border border-zinc-700">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${getNetworkStatusColor(status)}`}></div>
                        <span className="font-medium">{network.charAt(0).toUpperCase() + network.slice(1)}</span>
                      </div>
                      {status.connected ? (
                        <span className="text-xs text-emerald-400 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" /> Connected
                        </span>
                      ) : (
                        <span className="text-xs text-red-400 flex items-center">
                          <XCircle className="h-3 w-3 mr-1" /> Disconnected
                        </span>
                      )}
                    </div>

                    {status.connected && (
                      <>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400">Latency:</span>
                            <span
                              className={status.latency && status.latency < 500 ? "text-emerald-400" : "text-amber-400"}
                            >
                              {status.latency ? `${status.latency}ms` : "N/A"}
                            </span>
                          </div>

                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400">Block Height:</span>
                            <span className="text-zinc-300">
                              {status.blockHeight ? status.blockHeight.toLocaleString() : "N/A"}
                            </span>
                          </div>

                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400">Last Checked:</span>
                            <span className="text-zinc-300">
                              {status.lastChecked ? timeAgo(status.lastChecked) : "N/A"}
                            </span>
                          </div>
                        </div>

                        <Progress
                          value={status.latency ? Math.min(100, 100 - status.latency / 10) : 0}
                          className="h-1 mt-2"
                        />
                      </>
                    )}

                    {!status.connected && status.error && (
                      <div className="text-xs text-red-400 mt-1">{status.error}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-md bg-zinc-800">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-zinc-400">Admin Wallet Address</div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(adminWalletAddress)}
                    className="h-8 px-2 text-zinc-400"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(getExplorerUrl("ethereum", "address", adminWalletAddress), "_blank")}
                    className="h-8 px-2 text-zinc-400"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="font-mono text-sm break-all">{adminWalletAddress}</div>
              <div className="mt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetWallet}
                  className="text-xs h-6 px-2 bg-zinc-800 border-zinc-700 text-zinc-300"
                >
                  Reset Wallet
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 bg-zinc-800">
                <TabsTrigger value="balances">Balances</TabsTrigger>
                <TabsTrigger value="send">Send</TabsTrigger>
                <TabsTrigger value="receive">Receive</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="balances" className="space-y-4 pt-4">
                <Tabs defaultValue="ETH" onValueChange={setSelectedCrypto}>
                  <TabsList className="grid grid-cols-4 md:grid-cols-8 bg-zinc-900">
                    {SUPPORTED_CRYPTOS.map((crypto) => (
                      <TabsTrigger key={crypto.id} value={crypto.id}>
                        {crypto.icon} {crypto.symbol}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {SUPPORTED_CRYPTOS.map((crypto) => (
                    <TabsContent key={crypto.id} value={crypto.id}>
                      <div className="p-3 rounded-md bg-zinc-900 mt-2">
                        <div className="text-sm text-zinc-400 mb-1">{crypto.name} Balance</div>
                        {balanceLoading ? (
                          <div className="flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>
                              {balances[crypto.id] ? `${balances[crypto.id]} ${crypto.symbol}` : "Loading..."}
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="text-xl font-bold">
                              {balances[crypto.id] ? `${balances[crypto.id]} ${crypto.symbol}` : `0 ${crypto.symbol}`}
                            </div>
                            <div className="text-sm text-emerald-400 mt-1">
                              ≈ ${getUsdValue(crypto.id, balances[crypto.id] || "0").toLocaleString()}
                            </div>
                            <div className="flex items-center mt-2">
                              <div className="text-xs text-zinc-400">Network: </div>
                              <div className="ml-1 px-2 py-0.5 text-xs rounded-full bg-zinc-800 flex items-center">
                                <div
                                  className={`w-1.5 h-1.5 rounded-full mr-1 ${getNetworkStatusColor(networkStatus[crypto.network])}`}
                                ></div>
                                {crypto.network.charAt(0).toUpperCase() + crypto.network.slice(1)}
                                {crypto.isMainnet && <span className="ml-1 text-emerald-400">(Mainnet)</span>}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                <div className="flex justify-end">
                  <Button
                    onClick={fetchAdminBalance}
                    disabled={balanceLoading}
                    size="sm"
                    className="bg-zinc-700 hover:bg-zinc-600"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Balances
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="send" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="crypto-select" className="text-zinc-400">
                      Cryptocurrency
                    </Label>
                    <select
                      id="crypto-select"
                      value={selectedCrypto}
                      onChange={(e) => setSelectedCrypto(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md"
                    >
                      <option value="">Select cryptocurrency</option>
                      {SUPPORTED_CRYPTOS.map((crypto) => (
                        <option key={crypto.id} value={crypto.id}>
                          {crypto.icon} {crypto.name} ({crypto.symbol})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="send-address" className="text-zinc-400">
                      Recipient Address
                    </Label>
                    <Input
                      id="send-address"
                      placeholder="0x..."
                      value={sendAddress}
                      onChange={(e) => setSendAddress(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="send-amount" className="text-zinc-400">
                      Amount
                    </Label>
                    <Input
                      id="send-amount"
                      type="number"
                      step="0.000001"
                      placeholder="0.1"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    {balances[selectedCrypto] && (
                      <div className="text-xs text-zinc-500">
                        Available: {balances[selectedCrypto]} {selectedCrypto}
                        (≈ ${getUsdValue(selectedCrypto, balances[selectedCrypto]).toLocaleString()})
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleSendTransaction}
                    disabled={isSending || !sendAddress || !sendAmount}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Send {selectedCrypto}
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="receive" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="receive-crypto" className="text-zinc-400">
                      Select Cryptocurrency
                    </Label>
                    <select
                      id="receive-crypto"
                      value={selectedReceiveCrypto}
                      onChange={(e) => setSelectedReceiveCrypto(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md"
                    >
                      <option value="">Select cryptocurrency</option>
                      {SUPPORTED_CRYPTOS.map((crypto) => (
                        <option key={crypto.id} value={crypto.id}>
                          {crypto.icon} {crypto.name} ({crypto.symbol})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-4 rounded-md bg-zinc-900">
                    <div className="text-sm text-zinc-400 mb-2">Your {selectedReceiveCrypto} Address</div>
                    <div className="font-mono text-sm break-all mb-2">
                      {receiveAddresses[selectedReceiveCrypto] || "Generating address..."}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(receiveAddresses[selectedReceiveCrypto] || "")}
                        className="bg-zinc-800 border-zinc-700 text-zinc-300"
                        disabled={!receiveAddresses[selectedReceiveCrypto]}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReceiveDialog(true)}
                        className="bg-zinc-800 border-zinc-700 text-zinc-300"
                        disabled={!receiveAddresses[selectedReceiveCrypto]}
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Show QR Code
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-zinc-400">
                    <p>Important: Make sure to send only {selectedReceiveCrypto} to this address.</p>
                    <p>Sending any other cryptocurrency may result in permanent loss of funds.</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4 pt-4">
                {transactionHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          <th className="pb-3 text-zinc-400 font-medium">Type</th>
                          <th className="pb-3 text-zinc-400 font-medium">Asset</th>
                          <th className="pb-3 text-zinc-400 font-medium text-right">Amount</th>
                          <th className="pb-3 text-zinc-400 font-medium">Date</th>
                          <th className="pb-3 text-zinc-400 font-medium">Status</th>
                          <th className="pb-3 text-zinc-400 font-medium">Explorer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactionHistory.map((tx) => (
                          <tr key={tx.id} className="border-b border-zinc-800">
                            <td className="py-3">
                              <span
                                className={`inline-block px-2 py-1 text-xs rounded-full ${
                                  tx.type === "Send"
                                    ? "bg-red-900/50 text-red-300"
                                    : tx.type === "Fund"
                                      ? "bg-emerald-900/50 text-emerald-300"
                                      : "bg-blue-900/50 text-blue-300"
                                }`}
                              >
                                {tx.type}
                              </span>
                            </td>
                            <td className="py-3">{tx.asset}</td>
                            <td className="py-3 text-right">{tx.amount}</td>
                            <td className="py-3">{new Date(tx.timestamp).toLocaleString()}</td>
                            <td className="py-3">
                              <span className="inline-block px-2 py-1 text-xs rounded-full bg-emerald-900/50 text-emerald-300">
                                {tx.status}
                              </span>
                            </td>
                            <td className="py-3">
                              {tx.explorerUrl && (
                                <a
                                  href={tx.explorerUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:underline flex items-center"
                                >
                                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                  View
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">No transaction history available yet.</div>
                )}
              </TabsContent>
            </Tabs>

            <div className="border-t border-zinc-800 pt-4">
              <h3 className="text-lg font-medium mb-4">Fund Admin Wallet</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pool-address" className="text-zinc-400">
                    Liquidity Pool Address
                  </Label>
                  <Input
                    id="pool-address"
                    placeholder="0x..."
                    value={poolAddress}
                    onChange={(e) => {
                      setPoolAddress(e.target.value)
                      if (e.target.value) {
                        fetchPoolBalances(e.target.value)
                      }
                    }}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="crypto-select-fund" className="text-zinc-400">
                    Cryptocurrency to Fund With
                  </Label>
                  <select
                    id="crypto-select-fund"
                    value={selectedCrypto}
                    onChange={(e) => setSelectedCrypto(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md"
                  >
                    <option value="">Select cryptocurrency</option>
                    {SUPPORTED_CRYPTOS.map((crypto) => (
                      <option key={crypto.id} value={crypto.id}>
                        {crypto.icon} {crypto.name} ({crypto.symbol})
                      </option>
                    ))}
                  </select>
                  {poolBalances[selectedCrypto] && (
                    <div className="text-xs text-zinc-500">
                      Pool Balance: {poolBalances[selectedCrypto]} {selectedCrypto}
                    </div>
                  )}
                  {selectedCrypto === "USDC" && (
                    <div className="text-xs text-emerald-500">Using direct USDC transfer from funding wallet</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fund-amount" className="text-zinc-400">
                    Amount to Fund ({selectedCrypto})
                  </Label>
                  <Input
                    id="fund-amount"
                    type="number"
                    step="0.000001"
                    placeholder="0.1"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <Button
                  onClick={fundAdminWallet}
                  disabled={loading || !adminWalletAddress || !fundAmount}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Fund Admin Wallet with {selectedCrypto}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                {apiError && (
                  <div className="p-3 rounded-md bg-red-900/50 border border-red-800 text-red-300 text-sm flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>{apiError}</span>
                  </div>
                )}

                {success && (
                  <div className="p-3 rounded-md bg-emerald-900/50 border border-emerald-800 text-emerald-300 text-sm">
                    {success}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Code Dialog */}
      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent className="bg-zinc-900 text-white border-zinc-700">
          <DialogHeader>
            <DialogTitle>Receive {selectedReceiveCrypto}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Scan this QR code to send {selectedReceiveCrypto} to your wallet
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center p-4">
            <div className="bg-white p-4 rounded-md mb-4">
              {/* In a real app, you would generate a QR code here */}
              <div className="w-48 h-48 bg-zinc-800 flex items-center justify-center">
                <QrCode className="h-24 w-24 text-white" />
              </div>
            </div>

            <div className="font-mono text-sm break-all mb-2 text-center">
              {receiveAddresses[selectedReceiveCrypto]}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(receiveAddresses[selectedReceiveCrypto] || "")}
              className="bg-zinc-800 border-zinc-700 text-zinc-300"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Address
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReceiveDialog(false)}
              className="bg-zinc-800 border-zinc-700 text-zinc-300"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}