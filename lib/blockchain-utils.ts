import { ethers } from "ethers"

// Get environment variables
const privateKey = process.env.PRIVATE_KEY || ""
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || ""
const liquidityPoolAddress = process.env.LIQUIDITY_POOL_ADDRESS || ""
const adminWalletAddress = process.env.ADMIN_WALLET || ""

// Check if environment variables are properly set
export const isConfigured = () => {
  return Boolean(
    privateKey &&
      privateKey !== "0x0000000000000000000000000000000000000000000000000000000000000000" &&
      rpcUrl &&
      liquidityPoolAddress &&
      adminWalletAddress,
  )
}

// Create provider and signer
export const getProvider = () => {
  if (!rpcUrl) throw new Error("RPC URL not configured")
  return new ethers.JsonRpcProvider(rpcUrl)
}

export const getSigner = () => {
  if (!privateKey) throw new Error("Private key not configured")
  const provider = getProvider()
  return new ethers.Wallet(privateKey, provider)
}

// Get contract instances
export const getContract = (address: string, abi: any) => {
  const signer = getSigner()
  return new ethers.Contract(address, abi, signer)
}

// Log transactions to Supabase
export const logTransaction = async (supabase: any, data: any) => {
  try {
    await supabase.from("transactions").insert([data])
    return true
  } catch (error) {
    console.error("Error logging transaction:", error)
    return false
  }
}