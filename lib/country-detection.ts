// Server-side only: node:net keeps this lookup out of browser bundles.
import { BlockList, isIP } from "node:net"
import { getCountryName } from "./country-codes"

const nonPublicV4 = new BlockList()
const nonPublicV6 = new BlockList()
for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  nonPublicV4.addSubnet(address, prefix, "ipv4")
for (const [address, prefix] of [
  ["::", 96],
  ["::ffff:0:0", 96],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
  ["2001:db8::", 32],
] as const)
  nonPublicV6.addSubnet(address, prefix, "ipv6")

type RequestHeaders = Pick<Headers, "get">

export function getPublicClientIP(headers: RequestHeaders): string | undefined {
  for (const name of [
    "cf-connecting-ip",
    "x-vercel-forwarded-for",
    "x-forwarded-for",
    "x-real-ip",
  ]) {
    const raw = headers.get(name)?.split(",")[0]?.trim()
    if (!raw) continue
    const ip = raw.replace(/^::ffff:(?=\d+\.)/i, "")
    const family = isIP(ip)
    if (family === 4 && !nonPublicV4.check(ip, "ipv4")) return ip
    if (family === 6 && !nonPublicV6.check(ip, "ipv6")) return ip
  }
}

export type CountryFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

export async function detectCountry(
  headers: RequestHeaders,
  fetcher: CountryFetcher = fetch
): Promise<string | undefined> {
  const ip = getPublicClientIP(headers)
  // Looking up the API caller without a visitor IP would select the server's country.
  if (!ip) return undefined
  try {
    const response = await fetcher(
      `https://api.country.is/${encodeURIComponent(ip)}`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(1500),
        headers: { Accept: "application/json" },
      }
    )
    if (!response.ok) return undefined
    const data: unknown = await response.json()
    if (
      !data ||
      typeof data !== "object" ||
      !("country" in data) ||
      typeof data.country !== "string"
    )
      return undefined
    return getCountryName(data.country)
  } catch {
    // Detection is optional. An unavailable provider must never block the survey.
    return undefined
  }
}
