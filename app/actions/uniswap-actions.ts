"use server"

import { ethers } from "ethers"
import { supabase } from "@/lib/supabaseClient"

// Uniswap V3 Router address
const ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564"

// ERC20 ABI for token operations
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
]

// Uniswap V3 Router ABI (simplified for our needs)
const ROUTER_ABI = [
  "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256)",
  "function exactInput(tuple(bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256)",
]

/**
 * Gets the formatted private key with 0x prefix
 * @returns The formatted private key or throws an error if not configured
 */
function getFormattedPrivateKey(): string {
  const privateKey = process.env.PRIVATE_KEY

  if (!privateKey) {
    throw new Error("Private key not configured in environment variables")
  }

  // Ensure the private key has the 0x prefix
  return privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`
}

/**
 * Approve a token for the Uniswap Router
 */
export async function approveTokenForRouter({
  tokenAddress,
  amount,
  decimals = 18,
}: {
  tokenAddress: string
  amount: string
  decimals?: number
}) {
  console.log(`Starting token approval for Uniswap Router: ${tokenAddress}, amount: ${amount}`)

  try {
    // Get environment variables
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL
    if (!rpcUrl) {
      console.error("RPC URL not configured")
      throw new Error("RPC URL not configured in environment variables")
    }

    // Get private key securely on the server
    const privateKey = getFormattedPrivateKey()

    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const signer = new ethers.Wallet(privateKey, provider)
    console.log(`Using wallet address: ${signer.address} for approval`)

    // Create token contract instance
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer)

    // Check current allowance
    const currentAllowance = await tokenContract.allowance(signer.address, ROUTER_ADDRESS)
    const amountToApprove = ethers.parseUnits(amount, decimals)

    console.log(`Current allowance: ${ethers.formatUnits(currentAllowance, decimals)}`)
    console.log(`Amount to approve: ${amount}`)

    // If current allowance is sufficient, no need to approve again
    if (currentAllowance >= amountToApprove) {
      console.log("Current allowance is sufficient, no need to approve again")
      return {
        success: true,
        message: "Current allowance is sufficient",
        txHash: "",
      }
    }

    // Approve the router to spend tokens
    console.log(`Approving Uniswap Router to spend ${amount} tokens...`)
    const tx = await tokenContract.approve(ROUTER_ADDRESS, amountToApprove)
    console.log(`Approval transaction sent: ${tx.hash}`)

    // Wait for transaction to be mined
    const receipt = await tx.wait()
    console.log(`Approval confirmed in block ${receipt?.blockNumber}`)

    // Log to Supabase
    try {
      await supabase.from("liquidity_logs").insert([
        {
          type: "token_approval",
          token_address: tokenAddress,
          amount: amount,
          spender: ROUTER_ADDRESS,
          tx_hash: tx.hash,
        },
      ])
      console.log("Approval logged to Supabase")
    } catch (supabaseError) {
      console.warn("Failed to log to Supabase:", supabaseError)
      // Continue execution even if logging fails
    }

    return {
      success: true,
      txHash: tx.hash,
      explorerUrl: `https://etherscan.io/tx/${tx.hash}`,
    }
  } catch (error: any) {
    console.error("Approval Error:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Execute a swap using Uniswap V3 Router
 */
export async function executeUniswapSwap({
  tokenIn,
  tokenOut,
  fee,
  recipient,
  amountIn,
  decimalsIn = 18,
  decimalsOut = 18,
  amountOutMinimum = "0",
  isNativeIn = false,
}: {
  tokenIn: string
  tokenOut: string
  fee: number
  recipient: string
  amountIn: string
  decimalsIn?: number
  decimalsOut?: number
  amountOutMinimum?: string
  isNativeIn?: boolean
}) {
  console.log(`Starting Uniswap swap: ${tokenIn} -> ${tokenOut}, amount: ${amountIn}`)

  try {
    // Get environment variables
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL
    if (!rpcUrl) {
      console.error("RPC URL not configured")
      throw new Error("RPC URL not configured in environment variables")
    }

    // Get private key securely on the server
    const privateKey = getFormattedPrivateKey()

    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const signer = new ethers.Wallet(privateKey, provider)

    if (!recipient) {
      // Default to admin wallet if no recipient is provided
      recipient = process.env.ADMIN_WALLET || ""
      console.log(`No recipient specified, defaulting to admin wallet: ${recipient}`)
    }

    console.log(`Transaction will be sent FROM: ${signer.address}`)
    console.log(`Swapped tokens will be sent TO: ${recipient}`)

    // If the signer address is the same as the recipient, warn about this:
    if (signer.address.toLowerCase() === recipient.toLowerCase()) {
      console.warn("WARNING: The sending wallet and recipient wallet are the same!")
      console.warn("This means the admin wallet is both sending and receiving the transaction.")
    }

    console.log(`Using wallet address: ${signer.address} for swap`)

    // Create router contract instance
    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, signer)

    // Parse amounts
    const parsedAmountIn = ethers.parseUnits(amountIn, decimalsIn)
    const parsedAmountOutMinimum = ethers.parseUnits(amountOutMinimum, decimalsOut)

    // Set deadline to 10 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10

    // Log the parameters for debugging
    console.log("Swap parameters:", {
      tokenIn,
      tokenOut,
      fee,
      recipient,
      deadline,
      amountIn: parsedAmountIn.toString(),
      amountOutMinimum: parsedAmountOutMinimum.toString(),
      sqrtPriceLimitX96: 0,
    })

    // Execute the swap
    let tx
    if (isNativeIn) {
      // If swapping from ETH, we need to send ETH value
      console.log(`Swapping ETH -> Token: sending ${amountIn} ETH as value`)
      tx = await router.exactInputSingle(
        [
          tokenIn,
          tokenOut,
          fee,
          recipient,
          deadline,
          parsedAmountIn,
          parsedAmountOutMinimum,
          0, // sqrtPriceLimitX96
        ],
        {
          value: parsedAmountIn,
          gasLimit: 500000, // Increased gas limit
        },
      )
    } else {
      // If swapping from a token, no ETH value needed
      console.log(`Swapping Token -> Token/ETH: no ETH value needed`)
      tx = await router.exactInputSingle(
        [
          tokenIn,
          tokenOut,
          fee,
          recipient,
          deadline,
          parsedAmountIn,
          parsedAmountOutMinimum,
          0, // sqrtPriceLimitX96
        ],
        {
          gasLimit: 500000, // Increased gas limit
        },
      )
    }

    console.log(`Swap transaction sent: ${tx.hash}`)

    // Wait for transaction to be mined
    const receipt = await tx.wait()
    console.log(`Swap confirmed in block ${receipt?.blockNumber}`)

    // Log to Supabase
    try {
      await supabase.from("liquidity_logs").insert([
        {
          type: "uniswap_swap",
          token_in: tokenIn,
          token_out: tokenOut,
          amount_in: amountIn,
          recipient: recipient,
          tx_hash: tx.hash,
        },
      ])
      console.log("Swap logged to Supabase")
    } catch (supabaseError) {
      console.warn("Failed to log to Supabase:", supabaseError)
      // Continue execution even if logging fails
    }

    return {
      success: true,
      txHash: tx.hash,
      explorerUrl: `https://etherscan.io/tx/${tx.hash}`,
    }
  } catch (error: any) {
    console.error("Swap Error:", error)
    return { success: false, error: error.message }
  }
}