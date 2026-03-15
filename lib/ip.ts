import crypto from "crypto"

export function hashIP(ip: string): string {
  const salt = process.env.IP_HASH_SALT
  if (!salt) throw new Error("IP_HASH_SALT env var is required")
  return crypto
    .createHash("sha256")
    .update(ip + salt)
    .digest("hex")
}
