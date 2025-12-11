"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Copy, Check, AlertCircle } from "lucide-react"

export default function EthersClient() {
  // Wallet connection state
  const [provider, setProvider] = useState<any>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  // Contract interaction state
  const [contractAddress, setContractAddress] = useState("")
  const [contractAbi, setContractAbi] = useState("")
  const [contractResult, setContractResult] = useState<any>(null)
  const [isReading, setIsReading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create wallet state
  const [newWallet, setNewWallet] = useState<{
    address: string
    privateKey: string
  } | null>(null)
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [copiedPrivateKey, setCopiedPrivateKey] = useState(false)

  // Check if browser environment and MetaMask is available
  useEffect(() => {
    const checkProvider = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          setProvider(provider)
        } catch (error) {
          console.error("Error initializing provider:", error)
        }
      }
    }

    checkProvider()
  }, [])

  // Connect to wallet
  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask not detected. Please install MetaMask.")
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      setProvider(provider)

      const accounts = await provider.send("eth_requestAccounts", [])
      const account = accounts[0]
      setAccount(account)

      const balance = await provider.getBalance(account)
      setBalance(ethers.formatEther(balance))

      setIsConnected(true)
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      setError(`Error connecting wallet: ${error.message}`)
    } finally {
      setIsConnecting(false)
    }
  }

  // Create a new wallet
  const createWallet = async () => {
    setIsCreatingWallet(true)
    setError(null)

    try {
      // Generate a random wallet
      const wallet = ethers.Wallet.createRandom()

      setNewWallet({
        address: wallet.address,
        privateKey: wallet.privateKey,
      })
    } catch (error: any) {
      console.error("Error creating wallet:", error)
      setError(`Error creating wallet: ${error.message}`)
    } finally {
      setIsCreatingWallet(false)
    }
  }

  // Copy text to clipboard
  const copyToClipboard = async (text: string, type: "address" | "privateKey") => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === "address") {
        setCopiedAddress(true)
        setTimeout(() => setCopiedAddress(false), 2000)
      } else {
        setCopiedPrivateKey(true)
        setTimeout(() => setCopiedPrivateKey(false), 2000)
      }
    } catch (error) {
      console.error("Error copying to clipboard:", error)
    }
  }

  // Read from contract
  const readContract = async () => {
    if (!contractAddress || !contractAbi) {
      setError("Please enter contract address and ABI")
      return
    }

    setIsReading(true)
    setError(null)
    setContractResult(null)

    try {
      // Parse the ABI
      let parsedAbi
      try {
        parsedAbi = JSON.parse(contractAbi)
      } catch (e) {
        throw new Error("Invalid ABI format. Please provide a valid JSON ABI.")
      }

      // Create contract instance
      let contract
      let publicProvider

      if (isConnected && provider) {
        // If connected to MetaMask, use that provider
        const signer = await provider.getSigner()
        contract = new ethers.Contract(contractAddress, parsedAbi, signer)
      } else {
        // Otherwise use a public provider with a timeout
        try {
          publicProvider = new ethers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/demo", undefined, {
            timeout: 30000, // 30 seconds timeout
          })

          // Test the connection
          await publicProvider.getBlockNumber()

          contract = new ethers.Contract(contractAddress, parsedAbi, publicProvider)
        } catch (error) {
          throw new Error(
            "Failed to connect to Ethereum network. Please check your internet connection or try again later.",
          )
        }
      }

      // Find a view function to call
      const abi = contract.interface.fragments
      const viewFunctions = abi.filter(
        (fragment: any) =>
          fragment.type === "function" &&
          (fragment.stateMutability === "view" || fragment.stateMutability === "pure") &&
          fragment.inputs.length === 0,
      )

      if (viewFunctions.length === 0) {
        throw new Error("No view functions found in the ABI that take zero arguments")
      }

      // Call the first view function
      const functionName = viewFunctions[0].name
      const result = await contract[functionName]()

      // Format the result
      let formattedResult

      if (ethers.isAddress(result)) {
        formattedResult = result // Address
      } else if (typeof result === "bigint") {
        formattedResult = result.toString() // BigInt
      } else if (Array.isArray(result)) {
        formattedResult = result.map((item: any) => (typeof item === "bigint" ? item.toString() : item)) // Array
      } else {
        formattedResult = result // Other types
      }

      setContractResult({
        functionName,
        result: formattedResult,
      })
    } catch (error: any) {
      console.error("Error reading contract:", error)
      setError(`Error reading contract: ${error.message}`)
    } finally {
      setIsReading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-zinc-900 text-white border-zinc-800">
      <CardHeader>
        <CardTitle>Ethers.js Demo</CardTitle>
        <CardDescription className="text-zinc-400">
          Connect to Ethereum and interact with smart contracts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="connect">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
            <TabsTrigger value="connect">Connect Wallet</TabsTrigger>
            <TabsTrigger value="create">Create Wallet</TabsTrigger>
            <TabsTrigger value="contract">Read Contract</TabsTrigger>
          </TabsList>

          <TabsContent value="connect" className="space-y-4 pt-4">
            {!isConnected ? (
              <Button onClick={connectWallet} disabled={isConnecting} className="w-full bg-zinc-700 hover:bg-zinc-600">
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Wallet"
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-zinc-800">
                  <div className="text-sm text-zinc-400 mb-1">Connected Account</div>
                  <div className="font-mono text-sm break-all">{account}</div>
                </div>

                <div className="p-4 rounded-md bg-zinc-800">
                  <div className="text-sm text-zinc-400 mb-1">Balance</div>
                  <div className="font-mono text-xl">{balance} ETH</div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-4 pt-4">
            <Button onClick={createWallet} disabled={isCreatingWallet} className="w-full bg-zinc-700 hover:bg-zinc-600">
              {isCreatingWallet ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create New Wallet"
              )}
            </Button>

            {newWallet && (
              <div className="space-y-4 mt-4">
                <div className="p-4 rounded-md bg-zinc-800">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-sm text-zinc-400">Wallet Address</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(newWallet.address, "address")}
                      className="h-8 px-2 text-zinc-400"
                    >
                      {copiedAddress ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="font-mono text-sm break-all">{newWallet.address}</div>
                </div>

                <div className="p-4 rounded-md bg-zinc-800">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-sm text-zinc-400">Private Key (Keep this secret!)</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(newWallet.privateKey, "privateKey")}
                      className="h-8 px-2 text-zinc-400"
                    >
                      {copiedPrivateKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="font-mono text-sm break-all">{newWallet.privateKey}</div>
                </div>

                <div className="text-sm text-amber-400">
                  ⚠️ Important: Save your private key securely. If lost, you cannot recover your wallet or funds.
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="contract" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="contract-address" className="text-zinc-400">
                Contract Address
              </Label>
              <Input
                id="contract-address"
                placeholder="0x..."
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract-abi" className="text-zinc-400">
                Contract ABI
              </Label>
              <textarea
                id="contract-abi"
                className="w-full h-32 p-3 rounded-md bg-zinc-800 border border-zinc-700 text-white font-mono text-sm"
                placeholder='[{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}]'
                value={contractAbi}
                onChange={(e) => setContractAbi(e.target.value)}
              />
              <p className="text-xs text-zinc-500">
                Paste a valid JSON ABI. For ERC-20 tokens, you can use the standard token ABI.
              </p>
            </div>

            <Button
              onClick={readContract}
              disabled={isReading || !contractAddress || !contractAbi}
              className="w-full bg-zinc-700 hover:bg-zinc-600"
            >
              {isReading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reading...
                </>
              ) : (
                "Read Contract"
              )}
            </Button>

            {error && (
              <div className="p-3 text-sm bg-red-900/50 text-red-300 rounded-md border border-red-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {contractResult && (
              <div className="p-4 rounded-md bg-zinc-800 space-y-2">
                <div className="text-sm text-zinc-400">
                  Function: <span className="text-emerald-400">{contractResult.functionName}()</span>
                </div>
                <div className="text-sm text-zinc-400">Result:</div>
                <pre className="p-3 bg-zinc-950 rounded-md overflow-auto text-xs text-emerald-400 font-mono">
                  {typeof contractResult.result === "object"
                    ? JSON.stringify(contractResult.result, null, 2)
                    : contractResult.result.toString()}
                </pre>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t border-zinc-800 text-zinc-400 text-sm">
        Make sure you have MetaMask or another web3 wallet installed
      </CardFooter>
    </Card>
  )
}