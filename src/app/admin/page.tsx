import Link from "next/link";
import { requireAdmin } from "@/lib/authz";
import { getAdminMetrics } from "@/lib/admin/metrics";

export const dynamic = "force-dynamic";

const dateFr = (d: Date) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-[18px] border border-ink/10 bg-surface p-4">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">{label}</span>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-deep">{title}</h2>
        {note && <span className="text-[11px] text-ink-faint">· {note}</span>}
      </div>
      {children}
    </section>
  );
}

export default async function AdminPage() {
  await requireAdmin();
  const m = await getAdminMetrics();
  const base = m.funnel[0].value || 1;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-8">
      <header className="enter flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="voice-amana text-2xl">Tableau de bord — administration</h1>
          <p className="text-sm text-ink-faint">
            Données réelles, agrégées depuis la base. Aucun contenu personnel n&apos;est affiché.
          </p>
        </div>
        <Link href="/aujourdhui" className="press rounded-full border border-ink/20 px-4 py-2 text-xs font-semibold">
          Retour à l&apos;app
        </Link>
      </header>

      {/* ─────────── Acquisition ─────────── */}
      <Section title="Acquisition">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Utilisateurs" value={m.acquisition.totalUsers} />
          <Stat label="7 derniers jours" value={`+${m.acquisition.new7}`} />
          <Stat label="30 derniers jours" value={`+${m.acquisition.new30}`} />
          <Stat label="Via Google" value={m.acquisition.google} />
          <Stat label="Mot de passe" value={m.acquisition.password} />
          <Stat label="Lien de connexion" value={m.acquisition.magicLink} />
        </div>
      </Section>

      {/* ─────────── Entonnoir d'activation ─────────── */}
      <Section title="Entonnoir d'activation" note="part des inscrits">
        <div className="flex flex-col gap-2 rounded-[18px] border border-ink/10 bg-surface p-4">
          {m.funnel.map((s, i) => {
            const pct = Math.round((s.value / base) * 100);
            return (
              <div key={s.label} className="flex items-center gap-3">
                <span className="w-44 flex-none text-sm">{s.label}</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/10">
                  <span
                    className={`block h-full rounded-full ${i === 0 ? "bg-ink" : "bg-gold"}`}
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-20 flex-none text-right text-sm font-semibold tabular-nums">
                  {s.value} · {pct} %
                </span>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ─────────── Engagement ─────────── */}
      <Section title="Engagement & rétention" note="utilisateurs ayant agi">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Actifs 24 h" value={m.engagement.active1} />
          <Stat label="Actifs 7 j" value={m.engagement.active7} />
          <Stat label="Actifs 30 j" value={m.engagement.active30} />
          <Stat
            label="Projets actifs"
            value={m.engagement.activeProjects}
            hint={`${m.engagement.projetsParUtilisateur} / utilisateur`}
          />
          <Stat label="Projets au total" value={m.engagement.totalProjects} />
          <Stat label="Actions terminées" value={m.engagement.tasksDone} />
          <Stat label="Actions en cours" value={m.engagement.tasksOpen} />
          <Stat
            label="Taux d'achèvement"
            value={`${
              m.engagement.tasksDone + m.engagement.tasksOpen
                ? Math.round((m.engagement.tasksDone / (m.engagement.tasksDone + m.engagement.tasksOpen)) * 100)
                : 0
            } %`}
          />
        </div>
      </Section>

      {/* ─────────── Profils ─────────── */}
      <Section title="Profils" note="domaines de vie et style d'accompagnement">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[18px] border border-ink/10 bg-surface p-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Domaines choisis
            </span>
            <ul className="mt-2 flex flex-col gap-1.5">
              {m.profil.domaines.length === 0 && <li className="text-sm text-ink-faint">Aucun profil encore.</li>}
              {m.profil.domaines.map((d) => (
                <li key={d.label} className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft">{d.label}</span>
                  <span className="font-semibold tabular-nums">{d.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[18px] border border-ink/10 bg-surface p-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Style d&apos;accompagnement
            </span>
            <ul className="mt-2 flex flex-col gap-1.5">
              {m.profil.styles.length === 0 && <li className="text-sm text-ink-faint">Aucun profil encore.</li>}
              {m.profil.styles.map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink-soft">{s.label}</span>
                  <span className="font-semibold tabular-nums">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ─────────── Activité ─────────── */}
      <Section title="Activité" note="types d'événements enregistrés">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[18px] border border-ink/10 bg-surface p-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Répartition</span>
            <ul className="mt-2 flex flex-col gap-1.5">
              {m.eventCounts.length === 0 && <li className="text-sm text-ink-faint">Aucun événement encore.</li>}
              {m.eventCounts.map((e) => (
                <li key={e.type} className="flex items-center justify-between text-sm">
                  <code className="text-ink-soft">{e.type}</code>
                  <span className="font-semibold tabular-nums">{e.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[18px] border border-ink/10 bg-surface p-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Derniers signaux</span>
            <ul className="mt-2 flex flex-col gap-1.5">
              {m.recentEvents.length === 0 && <li className="text-sm text-ink-faint">Rien pour l&apos;instant.</li>}
              {m.recentEvents.map((e, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <code className="text-ink-soft">{e.type}</code>
                  <span className="text-xs tabular-nums text-ink-faint">{dateFr(e.at)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ─────────── Derniers inscrits ─────────── */}
      <Section title="Derniers inscrits">
        <div className="overflow-x-auto rounded-[18px] border border-ink/10 bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-[11px] uppercase tracking-wider text-ink-faint">
                <th className="p-3 font-semibold">Nom</th>
                <th className="p-3 font-semibold">Email</th>
                <th className="p-3 font-semibold">Rôle</th>
                <th className="p-3 font-semibold">Inscrit</th>
              </tr>
            </thead>
            <tbody>
              {m.recentUsers.map((u) => (
                <tr key={u.id} className="border-b border-ink/5 last:border-0">
                  <td className="p-3">{u.name ?? "—"}</td>
                  <td className="p-3 text-ink-soft">{u.email}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        u.role === "ADMIN" ? "bg-gold-soft text-gold-deep" : "bg-surface-2 text-ink-faint"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 tabular-nums text-ink-faint">{dateFr(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <p className="text-xs text-ink-faint">
        Qualité IA : en attente du module de feedback conversationnel (signalement d&apos;une réponse
        inadaptée) — il alimentera cette section une fois la conversation réelle branchée.
      </p>
    </main>
  );
}
