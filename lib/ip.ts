import crypto from "crypto"

export function hashIP(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "default-salt-change-in-production"
  return crypto
    .createHash("sha256")
    .update(ip + salt)
    .digest("hex")
}
