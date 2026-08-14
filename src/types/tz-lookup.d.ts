/** tz-lookup ships no types: one function, coordinates in, IANA zone out. */
declare module 'tz-lookup' {
  export default function tzLookup(lat: number, lon: number): string
}
