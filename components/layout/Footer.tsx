import Link from "next/link";
import { siteConfig } from "@/data/site-config";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 text-sm text-fg-muted sm:px-6">
        <div className="flex flex-wrap gap-4">
          {siteConfig.platformLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-150 ease-out hover:text-fg"
            >
              {link.platform}
            </a>
          ))}
          <Link href="/contact" className="transition-colors duration-150 ease-out hover:text-fg">
            Contact
          </Link>
        </div>
        <p>&copy; {year} {siteConfig.brandName}. All rights reserved.</p>
      </div>
    </footer>
  );
}
