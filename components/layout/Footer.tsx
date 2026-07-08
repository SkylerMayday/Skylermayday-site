import Link from "next/link";
import { siteConfig } from "@/data/site-config";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 py-8 dark:border-neutral-800">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 text-sm text-neutral-600 dark:text-neutral-400">
        <div className="flex flex-wrap gap-4">
          {siteConfig.platformLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-950 dark:hover:text-white"
            >
              {link.platform}
            </a>
          ))}
          <Link href="/contact" className="hover:text-neutral-950 dark:hover:text-white">
            Contact
          </Link>
        </div>
        <p>&copy; {year} {siteConfig.brandName}. All rights reserved.</p>
      </div>
    </footer>
  );
}
