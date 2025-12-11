import { ethers } from "ethers"

// ERC20 Token ABI for token operations
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
]

// Token decimals mapping
const TOKEN_DECIMALS = {
  USDC: 6,
  DAI: 18,
  USDT: 6,
  ETH: 18,
}

// Token addresses mapping
const TOKEN_ADDRESSES = {
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
}

/**
 * Checks if a contract has a specific method
 * @param contract The ethers contract instance
 * @param methodName The method name to check
 * @returns True if the method exists, false otherwise
 */
async function contractHasMethod(contract: ethers.Contract, methodName: string): Promise<boolean> {
  try {
    // Check if the method exists on the contract
    return typeof contract[methodName] === "function"
  } catch (error) {
    return false
  }
}

/**
 * Gets the token balance of an address
 * @param tokenAddress The token contract address
 * @param walletAddress The wallet address to check
 * @param provider The ethers provider
 * @returns The token balance in both raw and formatted form
 */
export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string,
  provider: ethers.Provider,
): Promise<{ raw: bigint; formatted: string; decimals: number }> {
  try {
    // Create token contract
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

    // Get token decimals
    const decimals = await tokenContract.decimals()

    // Get balance
    const balance = await tokenContract.balanceOf(walletAddress)

    return {
      raw: balance,
      formatted: ethers.formatUnits(balance, decimals),
      decimals,
    }
  } catch (error) {
    console.error(`Error getting token balance:`, error)
    throw error
  }
}

/**
 * Transfers tokens from a liquidity pool to an admin wallet
 * @param tokenSymbol The token symbol (USDC, DAI, etc.)
 * @param amount The amount to transfer
 * @param adminWallet The admin wallet address
 * @param liquidityPoolAddress The liquidity pool address
 * @param signer The ethers signer
 * @returns The transaction receipt
 */
export async function transferTokenFromPool(
  tokenSymbol: string,
  amount: string,
  adminWallet: string,
  liquidityPoolAddress: string,
  signer: ethers.Signer,
): Promise<{ txHash: string; success: boolean; error?: string }> {
  try {
    // Get token address and decimals
    const tokenAddress = TOKEN_ADDRESSES[tokenSymbol]
    if (!tokenAddress) {
      throw new Error(`Unsupported token: ${tokenSymbol}`)
    }

    const decimals = TOKEN_DECIMALS[tokenSymbol]
    const amountToSend = ethers.parseUnits(amount, decimals)

    // Create token contract
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer)

    // Check pool balance
    const poolBalance = await tokenContract.balanceOf(liquidityPoolAddress)
    const formattedPoolBalance = ethers.formatUnits(poolBalance, decimals)

    console.log(`Pool balance check for ${tokenSymbol}:`, {
      poolBalance: formattedPoolBalance,
      requestedAmount: amount,
    })

    if (poolBalance < amountToSend) {
      throw new Error(
        `Insufficient ${tokenSymbol} balance in the pool. Available: ${formattedPoolBalance} ${tokenSymbol}, Requested: ${amount} ${tokenSymbol}`,
      )
    }

    // For USDC, we'll try a direct transfer approach
    if (tokenSymbol === "USDC") {
      console.log("Using direct USDC transfer approach")

      // Check if the signer has permission to transfer from the pool
      const signerAddress = await signer.getAddress()
      const allowance = await tokenContract.allowance(liquidityPoolAddress, signerAddress)

      console.log(`Allowance check: ${ethers.formatUnits(allowance, decimals)} USDC`)

      if (allowance < amountToSend) {
        console.log("Insufficient allowance, attempting to use pool's transfer function")

        // Try to use the pool's transfer function directly
        // Create a contract instance for the pool with a basic transfer function
        const poolContract = new ethers.Contract(
          liquidityPoolAddress,
          ["function transfer(address to, uint256 amount) returns (bool)"],
          signer,
        )

        // Call the transfer function on the pool contract
        console.log(`Calling transfer on pool contract to send ${amount} USDC to ${adminWallet}`)
        const tx = await poolContract.transfer(adminWallet, amountToSend, {
          gasLimit: 300000,
        })

        console.log(`Transaction hash: ${tx.hash}`)

        // Wait for transaction to be mined
        await tx.wait()

        return {
          txHash: tx.hash,
          success: true,
        }
      } else {
        // If we have allowance, use transferFrom
        console.log(`Using transferFrom with allowance: ${ethers.formatUnits(allowance, decimals)}`)
        const tx = await tokenContract.transferFrom(liquidityPoolAddress, adminWallet, amountToSend, {
          gasLimit: 300000,
        })

        console.log(`Transaction hash: ${tx.hash}`)

        // Wait for transaction to be mined
        await tx.wait()

        return {
          txHash: tx.hash,
          success: true,
        }
      }
    }

    // For other tokens, try different methods that might exist on the pool
    console.log(`Trying different methods for ${tokenSymbol} transfer`)

    // Create pool contract with potential methods
    const poolContract = new ethers.Contract(
      liquidityPoolAddress,
      [
        // Try different method signatures that might exist
        "function transferToken(address token, address to, uint256 amount) external returns (bool)",
        "function sendTokenFunds(address token, address to, uint256 amount) external returns (bool)",
        "function withdrawToken(address token, address to, uint256 amount) external returns (bool)",
        "function transferERC20(address token, address to, uint256 amount) external returns (bool)",
      ],
      signer,
    )

    // Try different methods that might exist on the pool
    let tx

    // Method 1: transferToken
    if (await contractHasMethod(poolContract, "transferToken")) {
      console.log(`Using transferToken method`)
      tx = await poolContract.transferToken(tokenAddress, adminWallet, amountToSend, {
        gasLimit: 300000,
      })
    }
    // Method 2: sendTokenFunds
    else if (await contractHasMethod(poolContract, "sendTokenFunds")) {
      console.log(`Using sendTokenFunds method`)
      tx = await poolContract.sendTokenFunds(tokenAddress, adminWallet, amountToSend, {
        gasLimit: 300000,
      })
    }
    // Method 3: withdrawToken
    else if (await contractHasMethod(poolContract, "withdrawToken")) {
      console.log(`Using withdrawToken method`)
      tx = await poolContract.withdrawToken(tokenAddress, adminWallet, amountToSend, {
        gasLimit: 300000,
      })
    }
    // Method 4: transferERC20
    else if (await contractHasMethod(poolContract, "transferERC20")) {
      console.log(`Using transferERC20 method`)
      tx = await poolContract.transferERC20(tokenAddress, adminWallet, amountToSend, {
        gasLimit: 300000,
      })
    }
    // Fallback: Check if signer has approval to transfer from pool
    else {
      console.log(`No direct pool methods found, checking for transferFrom approval`)

      // Check if signer has approval
      const allowance = await tokenContract.allowance(liquidityPoolAddress, await signer.getAddress())

      if (allowance < amountToSend) {
        throw new Error(
          `Cannot transfer ${tokenSymbol} from pool: no approval and no transfer methods available. The pool contract may need to implement a token transfer method.`,
        )
      }

      // Use transferFrom if we have approval
      tx = await tokenContract.transferFrom(liquidityPoolAddress, adminWallet, amountToSend, {
        gasLimit: 300000,
      })
    }

    // Wait for transaction to be mined
    const receipt = await tx.wait()

    return {
      txHash: tx.hash,
      success: true,
    }
  } catch (error) {
    console.error(`Error transferring ${tokenSymbol} from pool:`, error)
    return {
      txHash: "",
      success: false,
      error: error.message,
    }
  }
}