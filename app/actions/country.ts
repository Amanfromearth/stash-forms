"use server"

import { headers } from "next/headers"
import { detectCountry } from "@/lib/country-detection"

export async function detectVisitorCountry(): Promise<string | undefined> {
  return detectCountry(await headers())
}
