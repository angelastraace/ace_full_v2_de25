"use server"

import { ethers } from "ethers"
import { supabase } from "@/lib/supabaseClient"

/**
 * Fund the admin wallet from a different source
 */
export async function fundAdminWallet({
  tokenSymbol,
  amount,
  sourceAddress,
  tokenAddress,
  decimals = 18,
}: {
  tokenSymbol: string
  amount: string
  sourceAddress: string
  tokenAddress: string
  decimals?: number
}) {
  console.log(`Starting fund admin wallet operation: ${amount} ${tokenSymbol} from ${sourceAddress}`)

  try {
    // Get environment variables
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL
    if (!rpcUrl) {
      console.error("RPC URL not configured")
      throw new Error("RPC URL not configured in environment variables")
    }

    const adminWallet = process.env.ADMIN_WALLET || process.env.NEXT_PUBLIC_ADMIN_WALLET
    if (!adminWallet) {
      console.error("Admin wallet address not configured")
      throw new Error("Admin wallet address not configured in environment variables")
    }

    // Create provider
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    // Get the private key from environment variables
    const privateKey = process.env.PRIVATE_KEY
    if (!privateKey) {
      throw new Error("Private key not configured for transaction signing")
    }

    // Create signer with the private key
    const signer = new ethers.Wallet(privateKey, provider)
    console.log(`Using wallet address: ${signer.address} for transaction`)

    // Check if the signer address is the same as the admin wallet
    if (signer.address.toLowerCase() === adminWallet.toLowerCase()) {
      throw new Error("Signer wallet cannot be the same as admin wallet")
    }

    // Verify that the source address is valid
    if (!ethers.isAddress(sourceAddress)) {
      throw new Error("Invalid source address format")
    }

    let tx
    if (tokenSymbol === "ETH") {
      // For ETH, send a direct transaction
      // First check balance
      const balance = await provider.getBalance(signer.address)
      const formattedBalance = ethers.formatEther(balance)
      const amountToSend = ethers.parseEther(amount)

      console.log(`ETH Balance: ${formattedBalance}`)
      console.log(`Amount to send: ${amount}`)

      if (balance < amountToSend) {
        throw new Error(`Insufficient ETH balance. You have ${formattedBalance} ETH, but trying to send ${amount} ETH.`)
      }

      tx = await signer.sendTransaction({
        to: adminWallet,
        value: amountToSend,
        gasLimit: 21000,
      })
    } else if (tokenSymbol === "USDC") {
      // For USDC, use a direct transfer approach
      console.log(`Using direct USDC transfer approach`)

      // USDC contract address on mainnet
      const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"

      // Create USDC contract instance
      const usdcContract = new ethers.Contract(
        usdcAddress,
        [
          "function transfer(address to, uint256 amount) returns (bool)",
          "function balanceOf(address owner) view returns (uint256)",
          "function decimals() view returns (uint8)",
        ],
        signer,
      )

      // Check USDC balance
      const balance = await usdcContract.balanceOf(signer.address)
      const amountToSend = ethers.parseUnits(amount, 6) // USDC has 6 decimals
      const formattedBalance = ethers.formatUnits(balance, 6)

      console.log(`USDC Balance: ${formattedBalance}`)
      console.log(`Amount to send: ${amount}`)

      if (balance < amountToSend) {
        throw new Error(
          `Insufficient USDC balance. You have ${formattedBalance} USDC, but trying to send ${amount} USDC.`,
        )
      }

      // Send USDC directly to admin wallet
      tx = await usdcContract.transfer(adminWallet, amountToSend, {
        gasLimit: 100000,
      })
    } else {
      // For other ERC20 tokens, use the token contract
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          "function transfer(address to, uint256 amount) returns (bool)",
          "function balanceOf(address owner) view returns (uint256)",
        ],
        signer,
      )

      // Check token balance
      const balance = await tokenContract.balanceOf(signer.address)
      const amountToSend = ethers.parseUnits(amount, decimals)
      const formattedBalance = ethers.formatUnits(balance, decimals)

      console.log(`${tokenSymbol} Balance: ${formattedBalance}`)
      console.log(`Amount to send: ${amount}`)

      if (balance < amountToSend) {
        throw new Error(
          `Insufficient ${tokenSymbol} balance. You have ${formattedBalance} ${tokenSymbol}, but trying to send ${amount} ${tokenSymbol}.`,
        )
      }

      // Send tokens to admin wallet
      tx = await tokenContract.transfer(adminWallet, amountToSend, {
        gasLimit: 100000,
      })
    }

    console.log(`Transaction sent: ${tx.hash}`)

    // Wait for transaction to be mined
    const receipt = await tx.wait()
    console.log(`Transaction confirmed in block ${receipt?.blockNumber}`)

    // Log to Supabase
    try {
      await supabase.from("liquidity_logs").insert([
        {
          type: "fund_admin_wallet",
          token: tokenSymbol,
          amount: amount,
          from: sourceAddress,
          to: adminWallet,
          tx_hash: tx.hash,
        },
      ])
    } catch (error) {
      console.warn("Failed to log to Supabase:", error)
    }

    return {
      success: true,
      txHash: tx.hash,
      explorerUrl: `https://etherscan.io/tx/${tx.hash}`,
    }
  } catch (error: any) {
    console.error("Error funding admin wallet:", error)
    return { success: false, error: error.message }
  }
}