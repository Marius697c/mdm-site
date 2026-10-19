export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const MACHINE_DIMENSIONS_CM = { length: 100, width: 60, height: 40 } as const;

/** Pages accessibles (clé de traduction `Header.nav.*`). */
export const NAV_ITEMS = [
  { key: "home", href: "/" },
  { key: "machine", href: "/machine" },
  { key: "mdiag", href: "/mdiag" },
  { key: "pharmacies", href: "/pharmacies" },
  { key: "investors", href: "/investors" },
  { key: "contact", href: "/contact" },
] as const;
