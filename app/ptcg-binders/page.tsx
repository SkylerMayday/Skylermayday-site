import type { Metadata } from "next";
import { fetchBinderFile, BindersApiError } from "@/lib/binders";
import BinderBookcase from "@/components/binders/BinderBookcase";
import ErrorState from "@/components/ui/ErrorState";
import { siteConfig } from "@/data/site-config";

export const revalidate = 900; // 15 min

export const metadata: Metadata = {
  title: `PTCG Binders — ${siteConfig.brandName}`,
};

export default async function BindersBookcasePage() {
  try {
    const binderFile = await fetchBinderFile();

    return (
      <div className="flex flex-col gap-8 py-10">
        <h1 className="text-3xl font-bold">PTCG Binders</h1>
        <BinderBookcase binders={binderFile.binders} />
      </div>
    );
  } catch (err) {
    if (err instanceof BindersApiError) {
      console.warn("[ptcg-binders] fetchBinderFile failed:", err.message);
    } else {
      console.warn("[ptcg-binders] unexpected error:", err);
    }

    return (
      <div className="flex flex-col gap-8 py-10">
        <h1 className="text-3xl font-bold">PTCG Binders</h1>
        <ErrorState message="Binders are temporarily unavailable." />
      </div>
    );
  }
}
