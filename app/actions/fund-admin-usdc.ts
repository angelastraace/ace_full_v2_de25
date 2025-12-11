"use server"

import { ethers } from "ethers"
import { supabase } from "@/lib/supabaseClient"

// USDC contract address on mainnet
const USDC_CONTRACT_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"

// USDC ABI for the functions we need
const USDC_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
]

// Expanded pool contract ABI with more potential methods
const POOL_CONTRACT_ABI = [
  // Standard methods
  "function transferToken(address token, address to, uint256 amount) external returns (bool)",
  "function sendTokenFunds(address token, address to, uint256 amount) external returns (bool)",
  "function withdrawToken(address token, address to, uint256 amount) external returns (bool)",
  "function transferERC20(address token, address to, uint256 amount) external returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  // Additional methods that might exist
  "function withdraw(address token, uint256 amount) external returns (bool)",
  "function withdrawTo(address token, address to, uint256 amount) external returns (bool)",
  "function send(address token, address to, uint256 amount) external returns (bool)",
  "function sendToken(address token, address to, uint256 amount) external returns (bool)",
  "function execute(address target, bytes calldata data) external returns (bytes memory)",
  // Admin/owner methods
  "function owner() view returns (address)",
  "function admin() view returns (address)",
  "function isAdmin(address) view returns (bool)",
]

/**
 * Server action to fund the admin wallet with USDC from the liquidity pool
 */
export async function fundAdminWithUSDC(amount: string) {
  console.log(`Starting USDC funding to admin wallet for amount ${amount}`)

  try {
    // Get environment variables
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL
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

    // Get private key securely on the server
    const privateKey = process.env.PRIVATE_KEY
    if (!privateKey) {
      console.error("Private key not configured")
      throw new Error("Private key not configured in environment variables")
    }

    console.log("Environment variables validated")
    console.log(`Liquidity pool address: ${liquidityPoolAddress}`)
    console.log(`Admin wallet address: ${adminWallet}`)

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
    console.log(`Using wallet address: ${signer.address} for transaction`)

    // Create USDC contract instance
    const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, USDC_ABI, signer)

    // Get USDC decimals
    const decimals = await usdcContract.decimals()
    console.log(`USDC decimals: ${decimals}`)

    // Parse amount with proper decimals
    const amountToSend = ethers.parseUnits(amount, decimals)
    console.log(`Amount to send in base units: ${amountToSend.toString()}`)

    // Check if the signer has enough USDC
    const signerBalance = await usdcContract.balanceOf(signer.address)
    const formattedSignerBalance = ethers.formatUnits(signerBalance, decimals)
    console.log(`Signer USDC balance: ${formattedSignerBalance}`)

    // If signer has enough USDC, send directly
    if (signerBalance >= amountToSend) {
      console.log(`Signer has enough USDC, sending directly to admin wallet`)

      // Estimate gas for the transaction
      const gasEstimate = await usdcContract.transfer.estimateGas(adminWallet, amountToSend)
      console.log(`Estimated gas: ${gasEstimate.toString()}`)

      // Send the transaction with a gas limit
      const tx = await usdcContract.transfer(adminWallet, amountToSend, {
        gasLimit: (gasEstimate * 120n) / 100n, // Add 20% buffer to gas estimate
      })

      console.log(`Transaction sent: ${tx.hash}`)

      // Wait for transaction to be mined
      const receipt = await tx.wait()
      console.log(`Transaction confirmed in block ${receipt?.blockNumber}`)

      // Log to Supabase
      try {
        await supabase.from("liquidity_logs").insert([
          {
            type: "usdc_transfer",
            to: adminWallet,
            amount: amount,
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
    }

    // If signer doesn't have enough USDC, check the pool balance
    console.log(`Signer doesn't have enough USDC, checking pool balance`)
    const poolBalance = await usdcContract.balanceOf(liquidityPoolAddress)
    const formattedPoolBalance = ethers.formatUnits(poolBalance, decimals)
    console.log(`Pool USDC balance: ${formattedPoolBalance}`)

    if (poolBalance < amountToSend) {
      throw new Error(
        `Insufficient USDC balance in the liquidity pool. The pool has ${formattedPoolBalance} USDC, but you're trying to send ${amount} USDC.`,
      )
    }

    // Try to create a liquidity pool contract to transfer USDC
    console.log(`Attempting to transfer USDC from pool to admin wallet`)

    // Create a contract instance for the pool with multiple possible function signatures
    const poolContract = new ethers.Contract(liquidityPoolAddress, POOL_CONTRACT_ABI, signer)

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
      try {
        // Try to check if signer is in admin list
        const isAdmin = await poolContract.isAdmin(signer.address)
        console.log(`Is signer an admin? ${isAdmin}`)
        if (isAdmin) {
          console.log(`Signer is in the admin list of the pool contract`)
          isOwnerOrAdmin = true
        }
      } catch (e) {
        console.log(`Could not check if signer is in admin list: ${e.message}`)
      }
    }

    if (!isOwnerOrAdmin) {
      console.warn(`Signer is not the owner or admin of the pool contract. Some methods may fail.`)
    }

    // Try different methods that might exist on the pool
    let tx
    let methodUsed = ""
    const errors = []

    // Method 1: Try transferToken
    try {
      console.log(`Attempting transferToken method`)
      tx = await poolContract.transferToken(USDC_CONTRACT_ADDRESS, adminWallet, amountToSend, {
        gasLimit: 300000,
      })
      console.log(`transferToken succeeded: ${tx.hash}`)
      methodUsed = "transferToken"
    } catch (e1) {
      errors.push(`transferToken failed: ${e1.message}`)
      console.log(`transferToken failed: ${e1.message}`)

      // Method 2: Try sendTokenFunds
      try {
        console.log(`Attempting sendTokenFunds method`)
        tx = await poolContract.sendTokenFunds(USDC_CONTRACT_ADDRESS, adminWallet, amountToSend, {
          gasLimit: 300000,
        })
        console.log(`sendTokenFunds succeeded: ${tx.hash}`)
        methodUsed = "sendTokenFunds"
      } catch (e2) {
        errors.push(`sendTokenFunds failed: ${e2.message}`)
        console.log(`sendTokenFunds failed: ${e2.message}`)

        // Method 3: Try withdrawToken
        try {
          console.log(`Attempting withdrawToken method`)
          tx = await poolContract.withdrawToken(USDC_CONTRACT_ADDRESS, adminWallet, amountToSend, {
            gasLimit: 300000,
          })
          console.log(`withdrawToken succeeded: ${tx.hash}`)
          methodUsed = "withdrawToken"
        } catch (e3) {
          errors.push(`withdrawToken failed: ${e3.message}`)
          console.log(`withdrawToken failed: ${e3.message}`)

          // Method 4: Try transferERC20
          try {
            console.log(`Attempting transferERC20 method`)
            tx = await poolContract.transferERC20(USDC_CONTRACT_ADDRESS, adminWallet, amountToSend, {
              gasLimit: 300000,
            })
            console.log(`transferERC20 succeeded: ${tx.hash}`)
            methodUsed = "transferERC20"
          } catch (e4) {
            errors.push(`transferERC20 failed: ${e4.message}`)
            console.log(`transferERC20 failed: ${e4.message}`)

            // Method 5: Try direct transfer if the pool is an ERC20 token itself
            try {
              console.log(`Attempting direct transfer method`)
              tx = await poolContract.transfer(adminWallet, amountToSend, {
                gasLimit: 300000,
              })
              console.log(`direct transfer succeeded: ${tx.hash}`)
              methodUsed = "transfer"
            } catch (e5) {
              errors.push(`direct transfer failed: ${e5.message}`)
              console.log(`direct transfer failed: ${e5.message}`)

              // Method 6: Try withdraw
              try {
                console.log(`Attempting withdraw method`)
                tx = await poolContract.withdraw(USDC_CONTRACT_ADDRESS, amountToSend, {
                  gasLimit: 300000,
                })
                console.log(`withdraw succeeded: ${tx.hash}`)
                methodUsed = "withdraw"
              } catch (e6) {
                errors.push(`withdraw failed: ${e6.message}`)
                console.log(`withdraw failed: ${e6.message}`)

                // Method 7: Try withdrawTo
                try {
                  console.log(`Attempting withdrawTo method`)
                  tx = await poolContract.withdrawTo(USDC_CONTRACT_ADDRESS, adminWallet, amountToSend, {
                    gasLimit: 300000,
                  })
                  console.log(`withdrawTo succeeded: ${tx.hash}`)
                  methodUsed = "withdrawTo"
                } catch (e7) {
                  errors.push(`withdrawTo failed: ${e7.message}`)
                  console.log(`withdrawTo failed: ${e7.message}`)

                  // Method 8: Try send
                  try {
                    console.log(`Attempting send method`)
                    tx = await poolContract.send(USDC_CONTRACT_ADDRESS, adminWallet, amountToSend, {
                      gasLimit: 300000,
                    })
                    console.log(`send succeeded: ${tx.hash}`)
                    methodUsed = "send"
                  } catch (e8) {
                    errors.push(`send failed: ${e8.message}`)
                    console.log(`send failed: ${e8.message}`)

                    // Method 9: Try sendToken
                    try {
                      console.log(`Attempting sendToken method`)
                      tx = await poolContract.sendToken(USDC_CONTRACT_ADDRESS, adminWallet, amountToSend, {
                        gasLimit: 300000,
                      })
                      console.log(`sendToken succeeded: ${tx.hash}`)
                      methodUsed = "sendToken"
                    } catch (e9) {
                      errors.push(`sendToken failed: ${e9.message}`)
                      console.log(`sendToken failed: ${e9.message}`)

                      // Method 10: Try execute (for contracts with generic execution)
                      try {
                        console.log(`Attempting execute method with USDC transfer calldata`)
                        // Create the calldata for a USDC transfer
                        const usdcInterface = new ethers.Interface(USDC_ABI)
                        const calldata = usdcInterface.encodeFunctionData("transfer", [adminWallet, amountToSend])

                        tx = await poolContract.execute(USDC_CONTRACT_ADDRESS, calldata, {
                          gasLimit: 300000,
                        })
                        console.log(`execute succeeded: ${tx.hash}`)
                        methodUsed = "execute"
                      } catch (e10) {
                        errors.push(`execute failed: ${e10.message}`)
                        console.log(`execute failed: ${e10.message}`)

                        // If all direct methods fail, check if we have approval to use transferFrom
                        console.log(`Checking if signer has approval to transfer from pool`)
                        const allowance = await usdcContract.allowance(liquidityPoolAddress, signer.address)
                        console.log(`Allowance: ${ethers.formatUnits(allowance, decimals)}`)

                        if (allowance >= amountToSend) {
                          // Use transferFrom if we have approval
                          console.log(`Using transferFrom with allowance`)
                          tx = await usdcContract.transferFrom(liquidityPoolAddress, adminWallet, amountToSend, {
                            gasLimit: 300000,
                          })
                          console.log(`transferFrom succeeded: ${tx.hash}`)
                          methodUsed = "transferFrom"
                        } else {
                          // Try to approve ourselves if we're the owner/admin
                          if (isOwnerOrAdmin) {
                            try {
                              console.log(`Attempting to approve signer for transferFrom as owner/admin`)
                              // Create a new contract instance for USDC but connected through the pool
                              const poolUsdcContract = new ethers.Contract(
                                USDC_CONTRACT_ADDRESS,
                                USDC_ABI,
                                provider,
                              ).connect(
                                // Use the pool as the signer (this only works if we're the owner/admin)
                                new ethers.VoidSigner(liquidityPoolAddress).connect(provider),
                              )

                              const approveTx = await poolUsdcContract.approve(signer.address, amountToSend, {
                                gasLimit: 300000,
                              })
                              console.log(`Approval transaction sent: ${approveTx.hash}`)

                              await approveTx.wait()
                              console.log(`Approval confirmed, now trying transferFrom`)

                              tx = await usdcContract.transferFrom(liquidityPoolAddress, adminWallet, amountToSend, {
                                gasLimit: 300000,
                              })
                              console.log(`transferFrom after approval succeeded: ${tx.hash}`)
                              methodUsed = "approve+transferFrom"
                            } catch (e11) {
                              errors.push(`approve+transferFrom failed: ${e11.message}`)
                              console.log(`approve+transferFrom failed: ${e11.message}`)

                              // If all methods fail, throw a detailed error
                              throw new Error(
                                `Failed to transfer USDC: All methods failed. Details: ${errors.join("; ")}`,
                              )
                            }
                          } else {
                            // If we're not the owner/admin and have no allowance, we can't do anything
                            throw new Error(
                              `Failed to transfer USDC: No permission to transfer from pool. Details: ${errors.join("; ")}`,
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
        }
      }
    }

    // If we get here, one of the methods succeeded
    console.log(`Successfully transferred USDC using method: ${methodUsed}`)

    // Wait for transaction to be mined
    const receipt = await tx.wait()
    console.log(`Transaction confirmed in block ${receipt?.blockNumber}`)

    // Log to Supabase
    try {
      await supabase.from("liquidity_logs").insert([
        {
          type: "usdc_pool_transfer",
          method: methodUsed,
          to: adminWallet,
          amount: amount,
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
      method: methodUsed,
    }
  } catch (error: any) {
    console.error("Error funding admin with USDC:", error)
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    }
  }
}