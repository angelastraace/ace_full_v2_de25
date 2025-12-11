"use server"

import { ethers } from "ethers"
import { supabase } from "@/lib/supabaseClient"

// ERC20 Token ABI for token operations
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
]

// Liquidity Pool ABI for funding operations
const LIQUIDITY_POOL_ABI = [
  "function sendFunds(address to, uint256 amount) public returns (bool)",
  "function sendTokenFunds(address token, address to, uint256 amount) public returns (bool)",
  "function removeLiquidity(uint256 amount) public returns (bool)",
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
 * Send funds from liquidity pool to admin wallet
 */
export async function sendAdminReward(amount: string) {
  console.log(`Starting admin reward transfer for amount: ${amount}`)

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

    console.log("Environment variables validated")

    // Get private key securely on the server
    const privateKey = getFormattedPrivateKey()

    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    // Test the connection
    try {
      const blockNumber = await provider.getBlockNumber()
      console.log(`Connected to network. Current block: ${blockNumber}`)
    } catch (connectionError: any) {
      console.error("Failed to connect to network:", connectionError)
      throw new Error(`Failed to connect to Ethereum network: ${connectionError.message}`)
    }

    const signer = new ethers.Wallet(privateKey, provider)
    console.log(`Using wallet address: ${signer.address} for transaction`)

    // First, check if the signer is the owner of the pool contract
    try {
      // Create contract with owner() function
      const poolWithOwner = new ethers.Contract(
        liquidityPoolAddress,
        ["function owner() view returns (address)"],
        provider,
      )

      try {
        const owner = await poolWithOwner.owner()
        console.log(`Pool owner: ${owner}`)
        console.log(`Signer address: ${signer.address}`)

        if (owner.toLowerCase() !== signer.address.toLowerCase()) {
          console.warn(
            "WARNING: Signer is not the pool owner. Transaction may fail if the contract requires owner privileges.",
          )
        }
      } catch (e) {
        console.log("Could not determine pool owner, contract might not have an owner() function")
      }
    } catch (e) {
      console.log("Error checking pool owner:", e)
    }

    // Determine if we're sending ETH or a token
    const isToken = amount.includes("USDC") || amount.includes("DAI") || amount.includes("USDT")

    let tx
    let tokenSymbol = "ETH"

    if (isToken) {
      // Extract token symbol and amount
      const parts = amount.split(" ")
      const amountValue = parts[0]
      tokenSymbol = parts[1]

      // Token contract addresses
      const tokenAddresses = {
        USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      }

      const tokenAddress = tokenAddresses[tokenSymbol]
      if (!tokenAddress) {
        throw new Error(`Unsupported token: ${tokenSymbol}`)
      }

      // Token decimals
      const tokenDecimals = {
        USDC: 6,
        DAI: 18,
        USDT: 6,
      }

      console.log(`Processing ${tokenSymbol} transfer of ${amountValue} tokens`)

      // Create token contract instance
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          "function balanceOf(address) view returns (uint256)",
          "function transfer(address, uint256) returns (bool)",
          "function decimals() view returns (uint8)",
          "function approve(address, uint256) returns (bool)",
          "function transferFrom(address, address, uint256) returns (bool)",
        ],
        signer,
      )

      // First check if the signer has enough tokens directly
      const signerBalance = await tokenContract.balanceOf(signer.address)
      const amountToSend = ethers.parseUnits(amountValue, tokenDecimals[tokenSymbol])
      const formattedSignerBalance = ethers.formatUnits(signerBalance, tokenDecimals[tokenSymbol])

      console.log(`Signer balance check: ${tokenSymbol}`, {
        signerBalanceRaw: signerBalance.toString(),
        signerBalanceFormatted: formattedSignerBalance,
        amountToSendRaw: amountToSend.toString(),
        amountToSendFormatted: amountValue,
      })

      // If signer has enough tokens, send directly
      if (signerBalance >= amountToSend) {
        console.log(`Signer has enough ${tokenSymbol}, sending directly`)
        tx = await tokenContract.transfer(adminWallet, amountToSend, {
          gasLimit: 200000,
        })
      } else {
        // Otherwise check if the pool has enough tokens
        const poolBalance = await tokenContract.balanceOf(liquidityPoolAddress)
        const formattedPoolBalance = ethers.formatUnits(poolBalance, tokenDecimals[tokenSymbol])

        console.log(`Pool balance check: ${tokenSymbol}`, {
          poolBalanceRaw: poolBalance.toString(),
          poolBalanceFormatted: formattedPoolBalance,
          amountToSendRaw: amountToSend.toString(),
          amountToSendFormatted: amountValue,
        })

        if (poolBalance < amountToSend) {
          throw new Error(
            `Insufficient ${tokenSymbol} balance in the pool. Available: ${formattedPoolBalance} ${tokenSymbol}, Requested: ${amountValue} ${tokenSymbol}`,
          )
        }

        // Try to create a liquidity pool contract to transfer tokens
        try {
          const poolContract = new ethers.Contract(
            liquidityPoolAddress,
            [
              "function transferToken(address token, address to, uint256 amount) external returns (bool)",
              "function sendTokenFunds(address token, address to, uint256 amount) external returns (bool)",
            ],
            signer,
          )

          // Try different methods that might exist on the pool contract
          try {
            console.log(`Attempting to transfer ${amountValue} ${tokenSymbol} using transferToken()`)
            tx = await poolContract.transferToken(tokenAddress, adminWallet, amountToSend, {
              gasLimit: 300000,
            })
          } catch (e) {
            console.log(`transferToken failed, trying sendTokenFunds: ${e.message}`)
            try {
              tx = await poolContract.sendTokenFunds(tokenAddress, adminWallet, amountToSend, {
                gasLimit: 300000,
              })
            } catch (e2) {
              console.log(`sendTokenFunds failed: ${e2.message}`)
              throw new Error(`Failed to transfer tokens from pool: ${e2.message}`)
            }
          }
        } catch (e) {
          console.error("Pool contract methods failed:", e)

          // As a last resort, try to use transferFrom if the signer has approval
          console.log("Attempting to use transferFrom as a fallback method")

          // Check if signer has approval to spend tokens from the pool
          const allowance = await tokenContract.allowance(liquidityPoolAddress, signer.address).catch(() => 0)

          if (allowance < amountToSend) {
            throw new Error(
              `Cannot transfer ${tokenSymbol} from pool: no approval. The pool contract may not have a method to transfer tokens or you don't have permission.`,
            )
          }

          tx = await tokenContract.transferFrom(liquidityPoolAddress, adminWallet, amountToSend, {
            gasLimit: 300000,
          })
        }
      }
    } else {
      // For ETH transfers
      console.log(`Processing ETH transfer of ${amount} ETH`)

      // Try multiple methods with detailed logging
      // Create contract with multiple possible function signatures
      const contract = new ethers.Contract(
        liquidityPoolAddress,
        [
          "function sendFunds(address, uint256) returns (bool)",
          "function withdraw(uint256) returns (bool)",
          "function transferETH(address, uint256) returns (bool)",
          "function sendEther(address, uint256) returns (bool)",
          "function transfer(address, uint256) returns (bool)",
          "function withdrawETH(uint256, address) returns (bool)",
          "function withdrawEther(uint256, address) returns (bool)",
        ],
        signer,
      )

      // Try each method one by one
      try {
        console.log(`Attempting to send ${amount} ETH to ${adminWallet} using sendFunds()`)
        tx = await await contract.sendFunds(adminWallet, ethers.parseEther(amount), {
          gasLimit: 200000,
        })
        console.log(`Transaction sent: ${tx.hash}`)
      } catch (e1) {
        console.error("sendFunds failed:", e1)

        try {
          console.log(`Trying withdraw() method`)
          tx = await contract.withdraw(ethers.parseEther(amount), {
            gasLimit: 200000,
          })
          console.log(`Withdraw transaction sent: ${tx.hash}`)
        } catch (e2) {
          console.error("withdraw failed:", e2)

          try {
            console.log(`Trying transferETH() method`)
            tx = await contract.transferETH(adminWallet, ethers.parseEther(amount), {
              gasLimit: 200000,
            })
            console.log(`transferETH transaction sent: ${tx.hash}`)
          } catch (e3) {
            console.error("transferETH failed:", e3)

            try {
              console.log(`Trying sendEther() method`)
              tx = await contract.sendEther(adminWallet, ethers.parseEther(amount), {
                gasLimit: 200000,
              })
              console.log(`sendEther transaction sent: ${tx.hash}`)
            } catch (e4) {
              console.error("sendEther failed:", e4)

              try {
                console.log(`Trying transfer() method`)
                tx = await contract.transfer(adminWallet, ethers.parseEther(amount), {
                  gasLimit: 200000,
                })
                console.log(`transfer transaction sent: ${tx.hash}`)
              } catch (e5) {
                console.error("transfer failed:", e5)

                try {
                  console.log(`Trying withdrawETH() method`)
                  tx = await contract.withdrawETH(ethers.parseEther(amount), adminWallet, {
                    gasLimit: 200000,
                  })
                  console.log(`withdrawETH transaction sent: ${tx.hash}`)
                } catch (e6) {
                  console.error("withdrawETH failed:", e6)

                  try {
                    console.log(`Trying withdrawEther() method`)
                    tx = await contract.withdrawEther(ethers.parseEther(amount), adminWallet, {
                      gasLimit: 200000,
                    })
                    console.log(`withdrawEther transaction sent: ${tx.hash}`)
                  } catch (e7) {
                    console.error("withdrawEther failed:", e7)

                    // If all methods fail, try a direct ETH transfer as last resort
                    try {
                      console.log(`Trying direct ETH transfer as last resort`)
                      tx = await signer.sendTransaction({
                        to: adminWallet,
                        value: ethers.parseEther(amount),
                        gasLimit: 21000,
                      })
                      console.log(`Direct ETH transfer sent: ${tx.hash}`)
                    } catch (e8) {
                      console.error("Direct ETH transfer failed:", e8)
                      throw new Error(
                        "All ETH transfer methods failed. The contract may not have a compatible function or you don't have permission.",
                      )
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Wait for transaction to be mined
    console.log("Waiting for transaction confirmation...")
    const receipt = await tx.wait()
    console.log(`Transaction confirmed in block ${receipt?.blockNumber}`)

    // Log to Supabase
    try {
      await supabase.from("liquidity_logs").insert([
        {
          type: "admin_reward",
          to: adminWallet,
          amount: isToken ? amount : `${amount} ETH`,
          tx_hash: tx.hash,
        },
      ])
      console.log("Transaction logged to Supabase")
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
    console.error("Funding Error:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Remove liquidity and fund admin wallet
 */
export async function removeAndFundAdmin({
  liquidityToRemove,
  ethToSend,
}: {
  liquidityToRemove: string
  ethToSend: string
}) {
  try {
    // Get environment variables
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL
    if (!rpcUrl) {
      throw new Error("RPC URL not configured in environment variables")
    }

    const poolAddress = process.env.LIQUIDITY_POOL_ADDRESS
    if (!poolAddress || poolAddress === "0x0000000000000000000000000000000000000000") {
      throw new Error("Liquidity pool address not properly configured in environment variables")
    }

    const adminWallet = process.env.ADMIN_WALLET
    if (!adminWallet) {
      throw new Error("Admin wallet address not configured in environment variables")
    }

    // Get private key securely on the server
    const privateKey = getFormattedPrivateKey()

    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const signer = new ethers.Wallet(privateKey, provider)

    // Create contract instance
    const contract = new ethers.Contract(poolAddress, LIQUIDITY_POOL_ABI, signer)

    // Step 1: Remove liquidity
    const removeTx = await contract.removeLiquidity(ethers.parseEther(liquidityToRemove))
    await removeTx.wait()

    // Step 2: Send ETH to admin wallet
    const sendTx = await contract.sendFunds(adminWallet, ethers.parseEther(ethToSend))
    await sendTx.wait()

    // Log to Supabase
    try {
      await supabase.from("liquidity_logs").insert([
        {
          type: "admin_liquidity_pull",
          to: adminWallet,
          removed_liquidity: liquidityToRemove,
          amount_sent: ethToSend,
          tx_hash: sendTx.hash,
        },
      ])
    } catch (supabaseError) {
      console.warn("Failed to log to Supabase:", supabaseError)
      // Continue execution even if logging fails
    }

    return {
      success: true,
      txHash: sendTx.hash,
      removedTxHash: removeTx.hash,
      explorerUrl: `https://etherscan.io/tx/${sendTx.hash}`,
      removeExplorerUrl: `https://etherscan.io/tx/${removeTx.hash}`,
    }
  } catch (error: any) {
    console.error("Liquidity Funding Error:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Send cryptocurrency from admin wallet to another address
 */
export async function sendTransaction(
  sendAddress: string,
  sendAmount: string,
  selectedCrypto: string,
  contractAddress?: string,
  decimals = 18,
) {
  try {
    // Get environment variables
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL
    if (!rpcUrl) {
      throw new Error("RPC URL not configured in environment variables")
    }

    const adminWallet = process.env.ADMIN_WALLET
    if (!adminWallet) {
      throw new Error("Admin wallet address not configured in environment variables")
    }

    // Get private key securely on the server
    const privateKey = getFormattedPrivateKey()

    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const signer = new ethers.Wallet(privateKey, provider)

    let tx
    let txHash

    if (contractAddress) {
      // For ERC20 tokens
      const tokenContract = new ethers.Contract(contractAddress, ERC20_ABI, signer)
      const amount = ethers.parseUnits(sendAmount, decimals)
      tx = await tokenContract.transfer(sendAddress, amount)
      txHash = tx.hash

      // Wait for transaction to be mined
      await tx.wait()
    } else {
      // For native tokens (ETH, BNB, MATIC)
      const amount = ethers.parseEther(sendAmount)
      tx = await signer.sendTransaction({
        to: sendAddress,
        value: amount,
      })
      txHash = tx.hash

      // Wait for transaction to be mined
      await tx.wait()
    }

    return {
      success: true,
      txHash,
      explorerUrl: `https://etherscan.io/tx/${txHash}`,
    }
  } catch (error: any) {
    console.error("Error sending transaction:", error)
    return { success: false, error: error.message }
  }
}