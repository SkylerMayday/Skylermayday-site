export interface NavLink {
  label: string;
  href: string;
}

// Shared nav config — data, not a component, so Header/Footer/mobile menu
// all read from a single source of truth.
export const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Content", href: "/content" },
  // Shop hidden from nav pending re-enable — /shop route still live, just unlinked.
  { label: "Tools", href: "/tools" },
  { label: "PTCG Binders", href: "/ptcg-binders" },
  { label: "Contact", href: "/contact" },
];
