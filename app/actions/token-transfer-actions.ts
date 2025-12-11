"use server"

import { ethers } from "ethers"

// ERC20 Token ABI for token operations
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
]

// Liquidity Pool ABI with the transferTokens function
const LIQUIDITY_POOL_ABI = [
  "function transferTokens(address token, address to, uint256 amount) external returns (bool)",
  "function sendFunds(address to, uint256 amount) returns (bool)",
  "function admin() view returns (address)",
  "function transfer(address to, uint256 amount) returns (bool)",
]

// Token addresses
const TOKEN_ADDRESSES = {
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
}

// Token decimals
const TOKEN_DECIMALS = {
  USDC: 6,
  DAI: 18,
  USDT: 6,
}

/**
 * Transfer tokens from the admin wallet to another address
 */
export async function transferTokenFromAdmin(tokenSymbol: string, amount: string, recipientAddress: string) {
  console.log(`Starting ${tokenSymbol} transfer to ${recipientAddress} for amount ${amount}`)

  try {
    // Get environment variables
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL
    if (!rpcUrl) {
      console.error("RPC URL not configured")
      throw new Error("RPC URL not configured in environment variables")
    }

    // Get the private key from server-side environment variables
    const privateKey = process.env.PRIVATE_KEY
    if (!privateKey) {
      console.error("Private key not configured")
      throw new Error("Private key not configured in environment variables")
    }

    // Get token address and decimals
    const tokenAddress = TOKEN_ADDRESSES[tokenSymbol]
    if (!tokenAddress) {
      throw new Error(`Unsupported token: ${tokenSymbol}`)
    }

    const decimals = TOKEN_DECIMALS[tokenSymbol]

    console.log("Environment variables validated")

    // Create provider with better error handling
    const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
      staticNetwork: true,
      timeout: 30000, // 30 second timeout
      polling: false,
      batchStallTime: 0,
    })

    // Test the connection
    try {
      const blockNumber = await provider.getBlockNumber()
      console.log(`Connected to network. Current block: ${blockNumber}`)
    } catch (connectionError: any) {
      console.error("Failed to connect to network:", connectionError)
      throw new Error(`Failed to connect to Ethereum network: ${connectionError.message}`)
    }

    // Create signer
    const signer = new ethers.Wallet(privateKey, provider)

    // Log the wallet address we're using to send (address is public info)
    console.log(`Using wallet address: ${signer.address} to send ${tokenSymbol}`)

    // Create token contract instance
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer)

    // Check token balance of sender
    const senderBalance = await tokenContract.balanceOf(signer.address)
    const formattedBalance = ethers.formatUnits(senderBalance, decimals)

    console.log(`${tokenSymbol} Balance: ${formattedBalance}`)

    // Check if we have enough tokens
    const amountToSend = ethers.parseUnits(amount, decimals)
    if (senderBalance < amountToSend) {
      console.error(`Insufficient ${tokenSymbol} balance. Have: ${formattedBalance}, Need: ${amount}`)
      throw new Error(
        `Insufficient ${tokenSymbol} balance. You have ${formattedBalance} ${tokenSymbol}, but trying to send ${amount} ${tokenSymbol}.`,
      )
    }

    // Estimate gas for the transaction
    console.log("Estimating gas...")
    const gasEstimate = await tokenContract.transfer.estimateGas(recipientAddress, amountToSend)
    console.log(`Estimated gas: ${gasEstimate}`)

    // Get current gas price
    const feeData = await provider.getFeeData()
    console.log(
      `Current gas price: ${feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") + " gwei" : "unknown"}`,
    )

    // Send the transaction with a gas limit
    console.log(`Sending ${tokenSymbol} transaction to ${recipientAddress}...`)
    const tx = await tokenContract.transfer(recipientAddress, amountToSend, {
      gasLimit: (gasEstimate * 120n) / 100n, // Add 20% buffer to gas estimate
    })

    console.log(`Transaction hash: ${tx.hash}`)

    // Wait for transaction to be mined
    console.log("Waiting for transaction confirmation...")
    const receipt = await tx.wait()
    console.log(`Transaction confirmed in block ${receipt?.blockNumber}`)

    // Return success response
    return {
      success: true,
      txHash: tx.hash,
      explorerUrl: `https://etherscan.io/tx/${tx.hash}`,
    }
  } catch (error: any) {
    console.error(`Error transferring ${tokenSymbol}:`, error)
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    }
  }
}

/**
 * Transfer tokens from the liquidity pool to the admin wallet
 */
export async function transferTokenFromPool(tokenSymbol: string, amount: string) {
  console.log(`Starting ${tokenSymbol} transfer from pool for amount ${amount}`)

  try {
    // Get environment variables
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL
    if (!rpcUrl) {
      console.error("RPC URL not configured")
      throw new Error("RPC URL not configured in environment variables")
    }

    const liquidityPoolAddress = process.env.LIQUIDITY_POOL_ADDRESS
    if (!liquidityPoolAddress || liquidityPoolAddress === "0x0000000000000000000000000000000000000000") {
      console.error("Liquidity pool address not properly configured")
      throw new Error("Liquidity pool address not properly configured in environment variables")
    }

    const adminWallet = process.env.ADMIN_WALLET
    if (!adminWallet) {
      console.error("Admin wallet address not configured")
      throw new Error("Admin wallet address not configured in environment variables")
    }

    // Get the private key from server-side environment variables
    const privateKey = process.env.PRIVATE_KEY
    if (!privateKey) {
      console.error("Private key not configured")
      throw new Error("Private key not configured in environment variables")
    }

    // Get token address and decimals
    const tokenAddress = TOKEN_ADDRESSES[tokenSymbol]
    if (!tokenAddress) {
      throw new Error(`Unsupported token: ${tokenSymbol}`)
    }

    const decimals = TOKEN_DECIMALS[tokenSymbol]

    console.log("Environment variables validated")

    // Create provider with better error handling
    const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
      staticNetwork: true,
      timeout: 30000, // 30 second timeout
      polling: false,
      batchStallTime: 0,
    })

    // Test the connection
    try {
      const blockNumber = await provider.getBlockNumber()
      console.log(`Connected to network. Current block: ${blockNumber}`)
    } catch (connectionError: any) {
      console.error("Failed to connect to network:", connectionError)
      throw new Error(`Failed to connect to Ethereum network: ${connectionError.message}`)
    }

    // Create signer
    const signer = new ethers.Wallet(privateKey, provider)

    // Log the wallet address we're using to send (address is public info)
    console.log(`Using wallet address: ${signer.address} for transaction`)

    // Create token contract instance to check balance
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

    // Check token balance of the pool
    const poolBalance = await tokenContract.balanceOf(liquidityPoolAddress)
    const formattedPoolBalance = ethers.formatUnits(poolBalance, decimals)

    console.log(`Pool ${tokenSymbol} Balance: ${formattedPoolBalance}`)

    // Check if the pool has enough tokens
    const amountToSend = ethers.parseUnits(amount, decimals)
    if (poolBalance < amountToSend) {
      console.error(`Insufficient ${tokenSymbol} balance in pool. Have: ${formattedPoolBalance}, Need: ${amount}`)
      throw new Error(
        `Insufficient ${tokenSymbol} balance in the liquidity pool. The pool has ${formattedPoolBalance} ${tokenSymbol}, but you're trying to send ${amount} ${tokenSymbol}.`,
      )
    }

    // For USDC, we'll try a direct transfer approach
    if (tokenSymbol === "USDC") {
      console.log("Using direct USDC transfer approach")

      // Create a contract instance for the USDC token
      const usdcContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer)

      // Check if the pool is an ERC20 token itself (some liquidity pools are)
      // If it is, we can try to use the transfer method directly
      try {
        // Create a contract instance for the pool with a basic ERC20 interface
        const poolAsERC20 = new ethers.Contract(liquidityPoolAddress, ERC20_ABI, signer)

        // Try to call transfer directly on the pool
        console.log(`Attempting to call transfer directly on the pool contract`)
        const tx = await poolAsERC20.transfer(adminWallet, amountToSend, {
          gasLimit: 300000,
        })

        console.log(`Transaction hash: ${tx.hash}`)

        // Wait for transaction to be mined
        await tx.wait()

        return {
          success: true,
          txHash: tx.hash,
          explorerUrl: `https://etherscan.io/tx/${tx.hash}`,
          method: "direct-transfer",
        }
      } catch (error) {
        console.error("Direct transfer failed:", error)

        // Check if the signer has allowance to transfer from the pool
        const signerAddress = await signer.getAddress()
        const allowance = await usdcContract.allowance(liquidityPoolAddress, signerAddress)

        console.log(`Allowance check: ${ethers.formatUnits(allowance, decimals)} USDC`)

        if (allowance >= amountToSend) {
          // If we have allowance, use transferFrom
          console.log(`Using transferFrom with allowance: ${ethers.formatUnits(allowance, decimals)}`)
          const tx = await usdcContract.transferFrom(liquidityPoolAddress, adminWallet, amountToSend, {
            gasLimit: 300000,
          })

          console.log(`Transaction hash: ${tx.hash}`)

          // Wait for transaction to be mined
          await tx.wait()

          return {
            success: true,
            txHash: tx.hash,
            explorerUrl: `https://etherscan.io/tx/${tx.hash}`,
            method: "transferFrom",
          }
        }

        // If direct transfer and transferFrom failed, throw an error
        throw new Error("Failed to transfer USDC: Neither direct transfer nor transferFrom worked")
      }
    }

    // Create liquidity pool contract instance with the transferTokens function
    const poolContract = new ethers.Contract(liquidityPoolAddress, LIQUIDITY_POOL_ABI, signer)

    // Check if the signer is the admin
    try {
      const adminAddress = await poolContract.admin()
      console.log(`Pool admin address: ${adminAddress}`)
      console.log(`Signer address: ${signer.address}`)

      if (adminAddress.toLowerCase() !== signer.address.toLowerCase()) {
        console.warn("Signer is not the pool admin. Transaction may fail if the contract requires admin privileges.")
      }
    } catch (error) {
      console.warn("Could not verify admin status:", error)
    }

    // Call the transferTokens function to transfer tokens from the pool to the admin wallet
    console.log(`Calling transferTokens(${tokenAddress}, ${adminWallet}, ${amountToSend})`)
    const tx = await poolContract.transferTokens(tokenAddress, adminWallet, amountToSend, {
      gasLimit: 300000, // Add a gas limit to prevent unexpected failures
    })

    console.log(`Transaction sent. Hash: ${tx.hash}`)

    // Wait for transaction to be mined
    console.log("Waiting for transaction confirmation...")
    const receipt = await tx.wait()
    console.log(`Transaction confirmed in block ${receipt?.blockNumber}`)

    // Return success response
    return {
      success: true,
      txHash: tx.hash,
      explorerUrl: `https://etherscan.io/tx/${tx.hash}`,
      method: "transferTokens",
    }
  } catch (error: any) {
    console.error(`Error transferring ${tokenSymbol} from pool:`, error)

    // Provide more helpful error messages
    if (error.message.includes("execution reverted")) {
      return {
        success: false,
        error: `Transaction reverted: The contract rejected the transaction. This may be because the signer is not the admin or the contract doesn't have the transferTokens function.`,
      }
    }

    return {
      success: false,
      error: error.message || "Unknown error occurred",
    }
  }
}