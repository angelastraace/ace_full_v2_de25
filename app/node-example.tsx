"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function NodeExample() {
  const [rpcUrl, setRpcUrl] = useState("https://eth-mainnet.g.alchemy.com/v2/your-api-key")
  const [privateKey, setPrivateKey] = useState("")
  const [contractAddress, setContractAddress] = useState("")
  const [contractAbi, setContractAbi] = useState("")
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const getReserves = async () => {
    if (!rpcUrl || !contractAddress || !contractAbi) {
      setResult("Please fill in all required fields")
      return
    }

    setLoading(true)
    setResult(null)

    try {
      // Create provider
      const provider = new ethers.JsonRpcProvider(rpcUrl)

      // Create contract instance
      let contract

      if (privateKey) {
        // If private key is provided, create a signer
        const wallet = new ethers.Wallet(privateKey, provider)
        contract = new ethers.Contract(contractAddress, JSON.parse(contractAbi), wallet)
      } else {
        // Otherwise use read-only provider
        contract = new ethers.Contract(contractAddress, JSON.parse(contractAbi), provider)
      }

      // Call getReserves method (or whatever method the pool has)
      const reserves = await contract.getReserves()

      setResult(
        JSON.stringify(
          {
            reserve0: reserves[0].toString(),
            reserve1: reserves[1].toString(),
            blockTimestampLast: reserves[2].toString(),
          },
          null,
          2,
        ),
      )
    } catch (error) {
      console.error("Error:", error)
      setResult(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Ethers.js Node.js Example</CardTitle>
          <CardDescription>Connect to Ethereum and read pool reserves using a server-side connection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="read">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="read">Read Contract</TabsTrigger>
              <TabsTrigger value="write">Write Contract</TabsTrigger>
            </TabsList>

            <TabsContent value="read" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rpc-url">RPC URL</Label>
                <Input
                  id="rpc-url"
                  placeholder="https://..."
                  value={rpcUrl}
                  onChange={(e) => setRpcUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Use an RPC provider like Alchemy, Infura, or your own node
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract-address">Pool Contract Address</Label>
                <Input
                  id="contract-address"
                  placeholder="0x..."
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract-abi">Pool Contract ABI</Label>
                <textarea
                  id="contract-abi"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="[{...}]"
                  value={contractAbi}
                  onChange={(e) => setContractAbi(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">The ABI should include the getReserves method</p>
              </div>

              <Button onClick={getReserves} disabled={loading}>
                {loading ? "Loading..." : "Get Reserves"}
              </Button>
            </TabsContent>

            <TabsContent value="write" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="private-key">Private Key (for write operations)</Label>
                <Input
                  id="private-key"
                  type="password"
                  placeholder="0x..."
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Never share your private key. For testing, use a test account with minimal funds.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Other fields</Label>
                <p className="text-sm text-muted-foreground">
                  Fill in the RPC URL, contract address, and ABI fields in the Read tab
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {result && (
            <div className="mt-4">
              <Label>Result:</Label>
              <pre className="mt-2 p-4 bg-muted rounded-md overflow-auto text-xs">{result}</pre>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            This example demonstrates how to use ethers.js in a Node.js environment
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}