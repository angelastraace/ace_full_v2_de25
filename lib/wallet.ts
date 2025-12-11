export async function connectWallet() {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed")
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    })

    return { success: true, address: accounts[0] }
  } catch (error) {
    console.error("[v0] Wallet connection error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Connection failed" }
  }
}

export async function disconnectWallet() {
  // MetaMask doesn't have disconnect method, clear local state instead
  localStorage.removeItem("connectedWallet")
  return { success: true }
}

export async function getWalletBalance(address: string) {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed")
    }

    const balance = await window.ethereum.request({
      method: "eth_getBalance",
      params: [address, "latest"],
    })

    return {
      success: true,
      balance: (Number.parseInt(balance, 16) / 1e18).toFixed(4),
    }
  } catch (error) {
    console.error("[v0] Balance check error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Balance check failed" }
  }
}

export async function switchNetwork(chainId: string) {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed")
    }

    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    })

    return { success: true }
  } catch (error) {
    console.error("[v0] Network switch error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Network switch failed" }
  }
}

declare global {
  interface Window {
    ethereum: any
  }
}