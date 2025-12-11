"use server"

import { ethers } from "ethers"

export async function transferUSDC(recipientAddress: string, amount: string) {
  console.log(`=== STARTING USDC TRANSFER ===`)
  console.log(`Recipient: ${recipientAddress}`)
  console.log(`Amount: ${amount} USDC`)

  try {
    // Get environment variables
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL
    if (!rpcUrl) {
      console.error("RPC URL not configured")
      throw new Error("RPC URL not configured in environment variables")
    }
    console.log("RPC URL configured ✓")

    // Get the private key from server-side environment variables
    const privateKey = process.env.PRIVATE_KEY
    if (!privateKey) {
      console.error("Private key not configured")
      throw new Error("Private key not configured in environment variables")
    }
    console.log("Private key configured ✓")

    // Create provider with better error handling
    console.log("Creating provider...")
    const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
      staticNetwork: true,
      timeout: 30000, // 30 second timeout
      polling: false,
      batchStallTime: 0,
    })

    // Test the connection
    try {
      const blockNumber = await provider.getBlockNumber()
      console.log(`Connected to network. Current block: ${blockNumber} ✓`)
    } catch (connectionError: any) {
      console.error("Failed to connect to network:", connectionError)
      throw new Error(`Failed to connect to Ethereum network: ${connectionError.message}`)
    }

    // Create signer
    console.log("Creating signer...")
    const signer = new ethers.Wallet(privateKey, provider)
    console.log(`Using wallet address: ${signer.address} ✓`)

    // Create USDC contract instance
    console.log("Creating USDC contract instance...")
    const usdc = new ethers.Contract(
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC mainnet
      [
        "function transfer(address to, uint256 value) public returns (bool)",
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)",
      ],
      signer,
    )

    // Check USDC balance of sender
    console.log("Checking USDC balance...")
    const senderBalance = await usdc.balanceOf(signer.address)
    const decimals = await usdc.decimals()
    const formattedBalance = ethers.formatUnits(senderBalance, decimals)

    console.log(`USDC Balance: ${formattedBalance}`)

    // Check if we have enough USDC - with more detailed error message
    const amountToSend = ethers.parseUnits(amount, decimals)
    console.log(`Amount to send (raw): ${amountToSend.toString()}`)
    console.log(`Sender balance (raw): ${senderBalance.toString()}`)

    if (senderBalance < amountToSend) {
      console.error(`Insufficient USDC balance. Have: ${formattedBalance}, Need: ${amount}`)
      throw new Error(
        `Insufficient USDC balance. You have ${formattedBalance} USDC, but trying to send ${amount} USDC.`,
      )
    }
    console.log("Balance check passed ✓")

    // Estimate gas for the transaction
    console.log("Estimating gas...")
    const gasEstimate = await usdc.transfer.estimateGas(recipientAddress, amountToSend)
    console.log(`Estimated gas: ${gasEstimate.toString()} ✓`)

    // Get current gas price
    const feeData = await provider.getFeeData()
    console.log(
      `Current gas price: ${feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") + " gwei" : "unknown"} ✓`,
    )

    // Send the transaction with a gas limit
    console.log("Sending transaction...")
    const tx = await usdc.transfer(recipientAddress, amountToSend, {
      gasLimit: (gasEstimate * 120n) / 100n, // Add 20% buffer to gas estimate
    })

    console.log(`Transaction hash: ${tx.hash} ✓`)

    // Wait for transaction to be mined
    console.log("Waiting for transaction confirmation...")
    const receipt = await tx.wait()
    console.log(`Transaction confirmed in block ${receipt?.blockNumber} ✓`)
    console.log(`=== USDC TRANSFER COMPLETED SUCCESSFULLY ===`)

    // Return success response
    return {
      success: true,
      txHash: tx.hash,
      explorerUrl: `https://etherscan.io/tx/${tx.hash}`,
    }
  } catch (error: any) {
    console.error("=== USDC TRANSFER ERROR ===")
    console.error(error)
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    }
  }
}