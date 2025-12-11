import { ethers } from "ethers"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gets the formatted private key with 0x prefix
 * @returns The formatted private key or throws an error if not configured
 */
export function getFormattedPrivateKey(): string {
  const privateKey = process.env.PRIVATE_KEY

  if (!privateKey) {
    throw new Error("Private key not configured in environment variables")
  }

  // Ensure the private key has the 0x prefix
  return privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`
}

/**
 * Ensures an address is properly checksummed
 * @param address The address to checksum
 * @returns The checksummed address
 */
export function getChecksumAddress(address: string): string {
  try {
    return ethers.getAddress(address)
  } catch (error) {
    throw new Error(`Invalid address format: ${address}`)
  }
}

/**
 * Sorts token addresses as required by Uniswap V3
 * @param tokenA First token address
 * @param tokenB Second token address
 * @returns Sorted token addresses [token0, token1]
 */
export function sortTokens(tokenA: string, tokenB: string): [string, string] {
  const checksummedA = getChecksumAddress(tokenA)
  const checksummedB = getChecksumAddress(tokenB)

  if (checksummedA === checksummedB) {
    throw new Error(`Identical token addresses: ${checksummedA}`)
  }

  return checksummedA.toLowerCase() < checksummedB.toLowerCase()
    ? [checksummedA, checksummedB]
    : [checksummedB, checksummedA]
}

/**
 * Formats a number with commas for thousands separators
 * @param num The number to format
 * @param decimals The number of decimal places
 * @returns The formatted number string
 */
export function formatNumber(num: string | number, decimals = 2): string {
  return Number(num).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}

/**
 * Formats a currency value
 * @param value The value to format
 * @param decimals The number of decimal places
 * @returns The formatted currency string
 */
export function formatCurrency(value: number | string, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(Number(value))
}

/**
 * Normalizes a number input by replacing commas with periods
 * @param value The input value
 * @returns The normalized value
 */
export function normalizeNumberInput(value: string): string {
  // Replace comma with period for decimal separator
  return value.replace(/,/g, ".")
}