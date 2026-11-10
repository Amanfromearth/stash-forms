import { getCountryCode } from "@/lib/country-codes"

export function CountryFlag({ country }: { country: string }) {
  const code = getCountryCode(country)
  if (!code) return null
  return (
    // Local SVGs keep flags independent of external image hosts and ad blockers.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${code.toLowerCase()}.svg`}
      alt=""
      aria-hidden="true"
      width={28}
      height={28}
      loading="lazy"
      decoding="async"
      className="size-7 shrink-0 object-contain"
    />
  )
}
