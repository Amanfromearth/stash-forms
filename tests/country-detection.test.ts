import { readFileSync, existsSync } from "node:fs"
import { test } from "node:test"
import assert from "node:assert/strict"
import { getPublicClientIP, detectCountry } from "../lib/country-detection"
import {
  getCountryName,
  getCountryCode,
  COUNTRY_NAMES_BY_CODE,
} from "../lib/country-codes"
import { COUNTRIES } from "../lib/countries"

test("country codes map to every existing saved label without changing answers", () => {
  assert.deepEqual(
    Object.values(COUNTRY_NAMES_BY_CODE).sort(),
    [...COUNTRIES].sort()
  )
  assert.equal(getCountryName("IN"), "India")
  assert.equal(getCountryName("us"), "United States")
  assert.equal(getCountryCode("Türkiye"), "TR")
  assert.equal(getCountryName("XX"), undefined)
})

test("extracts the visitor IP from host headers, including IPv6 and forwarded chains", () => {
  assert.equal(
    getPublicClientIP(new Headers({ "x-forwarded-for": "8.8.8.8, 10.0.0.1" })),
    "8.8.8.8"
  )
  assert.equal(
    getPublicClientIP(new Headers({ "x-real-ip": "2606:4700:4700::1111" })),
    "2606:4700:4700::1111"
  )
  assert.equal(
    getPublicClientIP(
      new Headers({
        "cf-connecting-ip": "1.1.1.1",
        "x-forwarded-for": "8.8.8.8",
      })
    ),
    "1.1.1.1"
  )
  assert.equal(
    getPublicClientIP(new Headers({ "x-vercel-forwarded-for": "8.8.8.8" })),
    "8.8.8.8"
  )
  assert.equal(
    getPublicClientIP(new Headers({ "x-real-ip": "::ffff:8.8.8.8" })),
    "8.8.8.8"
  )
})

test("does not look up local, private, reserved, or malformed IP addresses", async () => {
  let calls = 0
  const fetcher: Parameters<typeof detectCountry>[1] = async () => {
    calls++
    return Response.json({ country: "US" })
  }
  for (const ip of [
    "127.0.0.1",
    "::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "10.0.0.1",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.1.1",
    "fc00::1",
    "fe80::1",
    "2001:db8::1",
    "not-an-ip",
    "8.8.8.8/../../other",
  ]) {
    assert.equal(
      await detectCountry(new Headers({ "x-forwarded-for": ip }), fetcher),
      undefined,
      ip
    )
  }
  assert.equal(await detectCountry(new Headers(), fetcher), undefined)
  assert.equal(calls, 0)
})

test("country.is receives the visitor IP server-side, with a timeout and no shared cache", async () => {
  let requested = ""
  const fetcher: Parameters<typeof detectCountry>[1] = async (
    input,
    options
  ) => {
    requested = String(input)
    assert.equal(options?.cache, "no-store")
    assert.ok(options?.signal)
    return Response.json({ ip: "8.8.8.8", country: "US" })
  }
  assert.equal(
    await detectCountry(new Headers({ "x-forwarded-for": "8.8.8.8" }), fetcher),
    "United States"
  )
  assert.equal(requested, "https://api.country.is/8.8.8.8")
})

test("unavailable, rate-limited, malformed, and unknown-country responses fall back to manual selection", async () => {
  const headers = new Headers({ "x-forwarded-for": "8.8.8.8" })
  for (const response of [
    new Response("", { status: 429 }),
    new Response("", { status: 503 }),
    new Response("invalid json"),
    Response.json({ country: null }),
    Response.json({ country: "XX" }),
    Response.json({}),
  ]) {
    assert.equal(await detectCountry(headers, async () => response), undefined)
  }
  assert.equal(
    await detectCountry(headers, async () => {
      throw new Error("Network unavailable")
    }),
    undefined
  )
})

test("every country has a local SVG flag", () => {
  for (const code of Object.keys(COUNTRY_NAMES_BY_CODE)) {
    const path = new URL(
      `../public/flags/${code.toLowerCase()}.svg`,
      import.meta.url
    )
    assert.ok(existsSync(path), `Missing flag for ${code}`)
    assert.match(readFileSync(path, "utf8"), /viewBox="0 0 32 32"/)
  }
})
