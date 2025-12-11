"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, CheckCircle2, ExternalLink, Wallet } from "lucide-react"

// Token configuration with addresses and decimals
const SUPPORTED_TOKENS = [
  {
    id: "ETH",
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
    address: null, // Native token
  },
  {
    id: "USDC",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  },
  {
    id: "DAI",
    name: "Dai Stablecoin",
    symbol: "DAI",
    decimals: 18,
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  },
  {
    id: "USDT",
    name: "Tether",
    symbol: "USDT",
    decimals: 6,
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  },
]

// ERC20 Token ABI for token operations
const ERC20_ABI = [
  "function transfer(address to, uint amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
]

interface ClientFundAdminProps {
  adminWalletAddress: string
}

export default function ClientFundAdmin({ adminWalletAddress }: ClientFundAdminProps) {
  const [amount, setAmount] = useState("")
  const [crypto, setCrypto] = useState("ETH")
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    txHash?: string
    explorerUrl?: string
  } | null>(null)

  // Initialize provider and check connection
  useEffect(() => {
    const initProvider = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          // Create provider
          const provider = new ethers.BrowserProvider(window.ethereum)
          setProvider(provider)

          // Check if already connected
          const accounts = await provider.listAccounts()
          if (accounts.length > 0) {
            setAccount(accounts[0].address)
            setSigner(await provider.getSigner())
            setConnected(true)
          }
        } catch (error) {
          console.error("Error initializing provider:", error)
        }
      }
    }

    initProvider()
  }, [])

  // Connect wallet function
  const connectWallet = async () => {
    if (!provider) {
      setResult({
        success: false,
        message: "MetaMask not detected. Please install MetaMask.",
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      // Request account access
      const accounts = await provider.send("eth_requestAccounts", [])
      const account = accounts[0]
      setAccount(account)

      // Get signer
      const signer = await provider.getSigner()
      setSigner(signer)
      setConnected(true)
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      setResult({
        success: false,
        message: `Error connecting wallet: ${error.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle funding the admin wallet
  const handleFundClick = async () => {
    if (!signer || !amount || isNaN(Number(amount)) || Number.parseFloat(amount) <= 0) {
      setResult({
        success: false,
        message: !signer ? "Please connect your wallet first." : "Please enter a valid amount.",
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const selectedToken = SUPPORTED_TOKENS.find((token) => token.id === crypto)

      if (!selectedToken) {
        throw new Error(`Unsupported token: ${crypto}`)
      }

      let tx

      if (crypto === "ETH") {
        // Sending ETH directly
        // First check balance
        const balance = await provider.getBalance(await signer.getAddress())
        const formattedBalance = ethers.formatEther(balance)

        if (balance < ethers.parseEther(amount)) {
          throw new Error(
            `Insufficient ETH balance. You have ${formattedBalance} ETH, but trying to send ${amount} ETH.`,
          )
        }

        tx = await signer.sendTransaction({
          to: adminWalletAddress,
          value: ethers.parseEther(amount),
        })
      } else {
        // Sending ERC-20 tokens
        const tokenContract = new ethers.Contract(selectedToken.address!, ERC20_ABI, signer)

        // Get token decimals (use the configured value or fetch from contract)
        let decimals = selectedToken.decimals
        try {
          decimals = await tokenContract.decimals()
        } catch (error) {
          console.warn(`Could not fetch decimals for ${crypto}, using default: ${decimals}`)
        }

        // Parse amount with the correct decimals
        const parsedAmount = ethers.parseUnits(amount, decimals)

        // Check balance before sending
        const balance = await tokenContract.balanceOf(await signer.getAddress())
        const formattedBalance = ethers.formatUnits(balance, decimals)

        if (balance < parsedAmount) {
          throw new Error(
            `Insufficient ${crypto} balance. You have ${formattedBalance} ${crypto}, but trying to send ${amount} ${crypto}.`,
          )
        }

        // Send the transaction
        tx = await tokenContract.transfer(adminWalletAddress, parsedAmount)
      }

      // Wait for transaction to be mined
      const receipt = await tx.wait()

      // Get the appropriate block explorer URL
      const explorerUrl = `https://etherscan.io/tx/${tx.hash}`

      setResult({
        success: true,
        message: `Successfully sent ${amount} ${crypto} to admin wallet.`,
        txHash: tx.hash,
        explorerUrl,
      })

      // Clear input on success
      setAmount("")
    } catch (error: any) {
      console.error("Transfer failed:", error)
      setResult({
        success: false,
        message: `Transfer failed: ${error.message || "Unknown error"}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
      <h2 className="text-lg font-medium text-white">Client-Side Fund Admin Wallet</h2>

      {!connected ? (
        <div className="space-y-4">
          <p className="text-zinc-400">Connect your wallet to fund the admin wallet.</p>
          <Button
            onClick={connectWallet}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 rounded-md bg-zinc-800 flex justify-between items-center">
            <div>
              <p className="text-xs text-zinc-400">Connected Account</p>
              <p className="text-sm font-mono">{account}</p>
            </div>
            <div className="flex items-center text-emerald-400 text-xs">
              <div className="w-2 h-2 bg-emerald-400 rounded-full mr-1"></div>
              Connected
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="crypto-select" className="text-zinc-400">
              Cryptocurrency
            </Label>
            <select
              id="crypto-select"
              value={crypto}
              onChange={(e) => setCrypto(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SUPPORTED_TOKENS.map((token) => (
                <option key={token.id} value={token.id}>
                  {token.name} ({token.symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount-input" className="text-zinc-400">
              Amount
            </Label>
            <Input
              id="amount-input"
              type="text"
              placeholder="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
            <p className="text-xs text-zinc-500">Enter the amount of {crypto} to send to the admin wallet</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-address" className="text-zinc-400">
              Admin Wallet Address
            </Label>
            <Input
              id="admin-address"
              type="text"
              value={adminWalletAddress}
              readOnly
              className="bg-zinc-800 border-zinc-700 text-white font-mono text-xs"
            />
          </div>

          <Button
            onClick={handleFundClick}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Fund Admin Wallet with ${crypto}`
            )}
          </Button>
        </div>
      )}

      {result && (
        <div
          className={`p-3 rounded-md ${
            result.success
              ? "bg-emerald-900/50 border border-emerald-800 text-emerald-300"
              : "bg-red-900/50 border border-red-800 text-red-300"
          } text-sm flex items-start gap-2`}
        >
          {result.success ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p>{result.message}</p>
            {result.txHash && <p className="text-xs mt-1 font-mono break-all">Transaction: {result.txHash}</p>}
            {result.explorerUrl && (
              <a
                href={result.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs mt-2 flex items-center text-blue-400 hover:underline"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View on blockchain explorer
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}