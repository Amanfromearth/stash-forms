import { isIP } from "node:net"

export function getRateLimitIdentity(
  requestHeaders: Pick<Headers, "get">,
  trustedHeader: string | undefined
): string | undefined {
  // The host must overwrite this header and prevent direct access to the app.
  // Missing IPs must not put unrelated visitors in a shared global bucket.
  const raw = trustedHeader
    ? requestHeaders.get(trustedHeader)?.trim()
    : undefined
  return raw && isIP(raw) ? raw : undefined
}
