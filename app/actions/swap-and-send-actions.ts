"use server"

import { ethers } from "ethers"
import { supabase } from "@/lib/supabaseClient"
import { ROUTER_ADDRESS } from "@/app/lib/constants"
import { getFormattedPrivateKey, normalizeNumberInput } from "@/app/lib/utils"
import { ERC20_ABI } from "@/app/lib/abis"

/**
 * Swap tokens using Uniswap V3 and send the output to the admin wallet
 */
export async function swapAndSendToAdmin({
  tokenInAddress,
  tokenOutAddress,
  fee,
  amount,
  decimalsIn = 18,
  decimalsOut = 18,
  slippageTolerance = 0.5, // Default 0.5% slippage tolerance
  isNativeIn = false,
  isNativeOut = false,
}: {
  tokenInAddress: string
  tokenOutAddress: string
  fee: number
  amount: string
  decimalsIn?: number
  decimalsOut?: number
  slippageTolerance?: number
  isNativeIn?: boolean
  isNativeOut?: boolean
}) {
  console.log(`Starting swap and send to admin: ${tokenInAddress} -> ${tokenOutAddress}, amount: ${amount}`)

  try {
    // Get environment variables
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL
    if (!rpcUrl) {
      console.error("RPC URL not configured")
      throw new Error("RPC URL not configured in environment variables")
    }

    const liquidityPoolAddress = process.env.LIQUIDITY_POOL_ADDRESS
    if (!liquidityPoolAddress) {
      console.error("Liquidity pool address not configured")
      throw new Error("Liquidity pool address not configured in environment variables")
    }

    const adminWallet = process.env.ADMIN_WALLET
    if (!adminWallet) {
      console.error("Admin wallet address not configured")
      throw new Error("Admin wallet address not configured in environment variables")
    }

    // Get private key securely on the server
    const privateKey = getFormattedPrivateKey()

    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const signer = new ethers.Wallet(privateKey, provider)
    console.log(`Using wallet address: ${signer.address} for swap and send`)

    // Create token contract instances
    const tokenInContract = new ethers.Contract(tokenInAddress, ERC20_ABI, provider)
    const tokenOutContract = new ethers.Contract(tokenOutAddress, ERC20_ABI, provider)

    // Parse amount with proper decimals
    const normalizedAmount = normalizeNumberInput(amount)
    const parsedAmountIn = ethers.parseUnits(normalizedAmount, decimalsIn)
    console.log(`Parsed amount: ${parsedAmountIn.toString()}`)

    // Check token balance of the liquidity pool
    const poolBalance = await tokenInContract.balanceOf(liquidityPoolAddress)
    const formattedPoolBalance = ethers.formatUnits(poolBalance, decimalsIn)

    console.log(`Liquidity pool balance for ${tokenInAddress}: ${formattedPoolBalance}`)
    console.log(`Amount to swap: ${normalizedAmount}`)

    if (poolBalance < parsedAmountIn) {
      throw new Error(
        `Insufficient token balance in the liquidity pool. Pool has ${formattedPoolBalance}, but trying to swap ${normalizedAmount}.`,
      )
    }

    // APPROACH 1: Try to transfer tokens from pool to signer first, then swap
    console.log("APPROACH 1: Transferring tokens from pool to signer first, then swapping")

    // Create a contract instance for the pool with multiple possible function signatures
    const poolContract = new ethers.Contract(
      liquidityPoolAddress,
      [
        // Try different method signatures that might exist
        "function transferToken(address token, address to, uint256 amount) external returns (bool)",
        "function sendTokenFunds(address token, address to, uint256 amount) external returns (bool)",
        "function withdrawToken(address token, address to, uint256 amount) external returns (bool)",
        "function transferERC20(address token, address to, uint256 amount) external returns (bool)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function admin() view returns (address)",
        "function owner() view returns (address)",
      ],
      signer,
    )

    // Check if the signer is the owner or admin of the pool
    let isOwnerOrAdmin = false
    try {
      // Try to check if signer is owner
      const owner = await poolContract.owner()
      console.log(`Pool owner: ${owner}`)
      if (owner.toLowerCase() === signer.address.toLowerCase()) {
        console.log(`Signer is the owner of the pool contract`)
        isOwnerOrAdmin = true
      }
    } catch (e) {
      console.log(`Could not determine pool owner: ${e.message}`)
    }

    if (!isOwnerOrAdmin) {
      try {
        // Try to check if signer is admin
        const admin = await poolContract.admin()
        console.log(`Pool admin: ${admin}`)
        if (admin.toLowerCase() === signer.address.toLowerCase()) {
          console.log(`Signer is the admin of the pool contract`)
          isOwnerOrAdmin = true
        }
      } catch (e) {
        console.log(`Could not determine pool admin: ${e.message}`)
      }
    }

    if (!isOwnerOrAdmin) {
      console.warn(`Signer is not the owner or admin of the pool contract. Some methods may fail.`)
    }

    // Try different methods to transfer tokens from pool to signer
    let transferTx
    let transferMethod = ""
    const errors = []

    try {
      console.log(`Attempting transferToken method`)
      transferTx = await poolContract.transferToken(tokenInAddress, signer.address, parsedAmountIn, {
        gasLimit: 300000,
      })
      console.log(`transferToken succeeded: ${transferTx.hash}`)
      transferMethod = "transferToken"
    } catch (e1) {
      errors.push(`transferToken failed: ${e1.message}`)
      console.log(`transferToken failed: ${e1.message}`)

      try {
        console.log(`Attempting sendTokenFunds method`)
        transferTx = await poolContract.sendTokenFunds(tokenInAddress, signer.address, parsedAmountIn, {
          gasLimit: 300000,
        })
        console.log(`sendTokenFunds succeeded: ${transferTx.hash}`)
        transferMethod = "sendTokenFunds"
      } catch (e2) {
        errors.push(`sendTokenFunds failed: ${e2.message}`)
        console.log(`sendTokenFunds failed: ${e2.message}`)

        try {
          console.log(`Attempting withdrawToken method`)
          transferTx = await poolContract.withdrawToken(tokenInAddress, signer.address, parsedAmountIn, {
            gasLimit: 300000,
          })
          console.log(`withdrawToken succeeded: ${transferTx.hash}`)
          transferMethod = "withdrawToken"
        } catch (e3) {
          errors.push(`withdrawToken failed: ${e3.message}`)
          console.log(`withdrawToken failed: ${e3.message}`)

          try {
            console.log(`Attempting transferERC20 method`)
            transferTx = await poolContract.transferERC20(tokenInAddress, signer.address, parsedAmountIn, {
              gasLimit: 300000,
            })
            console.log(`transferERC20 succeeded: ${transferTx.hash}`)
            transferMethod = "transferERC20"
          } catch (e4) {
            errors.push(`transferERC20 failed: ${e4.message}`)
            console.log(`transferERC20 failed: ${e4.message}`)

            // If all methods fail, throw a detailed error
            throw new Error(
              `Failed to transfer tokens from pool to signer: All methods failed. Details: ${errors.join("; ")}`,
            )
          }
        }
      }
    }

    // Wait for transfer transaction to be mined
    console.log(`Waiting for transfer transaction to be mined...`)
    const transferReceipt = await transferTx.wait()
    console.log(`Transfer confirmed in block ${transferReceipt?.blockNumber}`)

    // Check if signer now has the tokens
    const signerBalance = await tokenInContract.balanceOf(signer.address)
    const formattedSignerBalance = ethers.formatUnits(signerBalance, decimalsIn)
    console.log(`Signer balance after transfer: ${formattedSignerBalance}`)

    if (signerBalance < parsedAmountIn) {
      throw new Error(
        `Transfer from pool to signer failed. Signer has ${formattedSignerBalance}, but needs ${normalizedAmount}.`,
      )
    }

    // Now approve the router to spend the tokens
    console.log(`Approving router to spend ${normalizedAmount} tokens...`)
    const approveTx = await tokenInContract.connect(signer).approve(ROUTER_ADDRESS, parsedAmountIn)
    console.log(`Approval transaction sent: ${approveTx.hash}`)

    // Wait for approval transaction to be mined
    const approveReceipt = await approveTx.wait()
    console.log(`Approval confirmed in block ${approveReceipt?.blockNumber}`)

    // Create router contract instance
    const router = new ethers.Contract(
      ROUTER_ADDRESS,
      [
        "function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256)",
      ],
      signer,
    )

    // Set deadline to 10 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10

    // Execute the swap
    console.log(`Executing swap from signer to admin wallet...`)
    const swapTx = await router.exactInputSingle(
      [
        tokenInAddress,
        tokenOutAddress,
        fee,
        adminWallet,
        deadline,
        parsedAmountIn,
        0, // amountOutMinimum - in production, calculate this based on price and slippage
        0, // sqrtPriceLimitX96 - no price limit
      ],
      {
        gasLimit: 500000,
      },
    )

    console.log(`Swap transaction sent: ${swapTx.hash}`)

    // Wait for swap transaction to be mined
    const swapReceipt = await swapTx.wait()
    console.log(`Swap confirmed in block ${swapReceipt?.blockNumber}`)

    // Log to Supabase
    try {
      await supabase.from("liquidity_logs").insert([
        {
          type: "swap_and_send",
          token_in: tokenInAddress,
          token_out: tokenOutAddress,
          amount_in: normalizedAmount,
          recipient: adminWallet,
          tx_hash_transfer: transferTx.hash,
          tx_hash_swap: swapTx.hash,
          method: transferMethod,
        },
      ])
      console.log("Transaction logged to Supabase")
    } catch (supabaseError) {
      console.warn("Failed to log to Supabase:", supabaseError)
      // Continue execution even if logging fails
    }

    return {
      success: true,
      txHash: swapTx.hash,
      transferTxHash: transferTx.hash,
      explorerUrl: `https://etherscan.io/tx/${swapTx.hash}`,
      transferExplorerUrl: `https://etherscan.io/tx/${transferTx.hash}`,
      method: transferMethod,
    }
  } catch (error: any) {
    console.error("Error in swap and send:", error)
    return {
      success: false,
      error: error.message,
      details: error.stack,
    }
  }
}