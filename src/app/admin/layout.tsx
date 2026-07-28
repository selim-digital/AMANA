import Link from "next/link";
import { requireAdmin } from "@/lib/authz";
import { AmanaMark } from "@/components/AmanaMark";

/** L'administration a sa propre coquille : fond encre, pas de nav produit.
 *  On ne doit jamais confondre « piloter AMANA » et « utiliser AMANA ». */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="min-h-dvh bg-panel text-panel-text">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-panel/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-5 py-3">
          <AmanaMark className="h-7 w-7" />
          <span className="text-[13px] font-extrabold tracking-[0.3em] indent-[0.3em]">AMANA</span>
          <span className="rounded-full bg-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#12100D]">
            Admin
          </span>
          <span className="ml-auto hidden text-xs opacity-60 sm:block">{session.user.email}</span>
          <Link
            href="/aujourdhui"
            className="press rounded-full border border-white/20 px-3.5 py-1.5 text-xs font-semibold"
          >
            Quitter
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
