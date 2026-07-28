import { requireAdmin } from "@/lib/authz";
import { getAdminMetrics } from "@/lib/admin/metrics";

export const dynamic = "force-dynamic";

const dateFr = (d: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-55">{label}</span>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="text-xs opacity-50">{hint}</p>}
    </div>
  );
}

function Panneau({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-55">{titre}</span>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Section({ title, note, children, i = 0 }: { title: string; note?: string; children: React.ReactNode; i?: number }) {
  return (
    <section className="enter flex flex-col gap-3" style={{ "--i": i } as React.CSSProperties}>
      <div className="flex items-baseline gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">{title}</h2>
        {note && <span className="text-[11px] opacity-45">· {note}</span>}
      </div>
      {children}
    </section>
  );
}

export default async function AdminPage() {
  await requireAdmin();
  const m = await getAdminMetrics();
  const base = m.funnel[0].value || 1;
  const totalTaches = m.engagement.tasksDone + m.engagement.tasksOpen;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-8">
      <div className="enter">
        <h1 className="voice-amana text-2xl">Pilotage</h1>
        <p className="text-sm opacity-55">
          Données agrégées depuis la base. Aucun contenu personnel n&apos;est affiché ici.
        </p>
      </div>

      <Section title="Acquisition" i={1}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Utilisateurs" value={m.acquisition.totalUsers} />
          <Stat label="7 derniers jours" value={`+${m.acquisition.new7}`} />
          <Stat label="30 derniers jours" value={`+${m.acquisition.new30}`} />
          <Stat label="Via Google" value={m.acquisition.google} />
          <Stat label="Mot de passe" value={m.acquisition.password} />
          <Stat label="Lien de connexion" value={m.acquisition.magicLink} />
        </div>
      </Section>

      <Section title="Entonnoir d'activation" note="part des inscrits" i={2}>
        <div className="flex flex-col gap-2.5 rounded-[18px] border border-white/10 bg-white/5 p-4">
          {m.funnel.map((s, i) => {
            const pct = Math.round((s.value / base) * 100);
            return (
              <div key={s.label} className="flex items-center gap-3">
                <span className="w-40 flex-none text-sm sm:w-48">{s.label}</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <span
                    className={`block h-full rounded-full ${i === 0 ? "bg-panel-text/70" : "bg-gold"}`}
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

      <Section title="Engagement & rétention" note="utilisateurs ayant agi" i={3}>
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
            value={`${totalTaches ? Math.round((m.engagement.tasksDone / totalTaches) * 100) : 0} %`}
          />
        </div>
      </Section>

      <Section title="Profils" note="domaines de vie et style d'accompagnement" i={4}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Panneau titre="Domaines choisis">
            <ul className="flex flex-col gap-1.5">
              {m.profil.domaines.length === 0 && <li className="text-sm opacity-45">Aucun profil encore.</li>}
              {m.profil.domaines.map((d) => (
                <li key={d.label} className="flex items-center justify-between text-sm">
                  <span className="opacity-75">{d.label}</span>
                  <span className="font-semibold tabular-nums">{d.count}</span>
                </li>
              ))}
            </ul>
          </Panneau>
          <Panneau titre="Style d'accompagnement">
            <ul className="flex flex-col gap-1.5">
              {m.profil.styles.length === 0 && <li className="text-sm opacity-45">Aucun profil encore.</li>}
              {m.profil.styles.map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="opacity-75">{s.label}</span>
                  <span className="font-semibold tabular-nums">{s.count}</span>
                </li>
              ))}
            </ul>
          </Panneau>
        </div>
      </Section>

      <Section title="Activité" note="événements enregistrés" i={5}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Panneau titre="Répartition">
            <ul className="flex flex-col gap-1.5">
              {m.eventCounts.length === 0 && <li className="text-sm opacity-45">Aucun événement encore.</li>}
              {m.eventCounts.map((e) => (
                <li key={e.type} className="flex items-center justify-between text-sm">
                  <code className="opacity-75">{e.type}</code>
                  <span className="font-semibold tabular-nums">{e.count}</span>
                </li>
              ))}
            </ul>
          </Panneau>
          <Panneau titre="Derniers signaux">
            <ul className="flex flex-col gap-1.5">
              {m.recentEvents.length === 0 && <li className="text-sm opacity-45">Rien pour l&apos;instant.</li>}
              {m.recentEvents.map((e, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-sm">
                  <code className="opacity-75">{e.type}</code>
                  <span className="text-xs tabular-nums opacity-45">{dateFr(e.at)}</span>
                </li>
              ))}
            </ul>
          </Panneau>
        </div>
      </Section>

      <Section title="Derniers inscrits" i={6}>
        <div className="overflow-x-auto rounded-[18px] border border-white/10 bg-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wider opacity-55">
                <th className="p-3 font-semibold">Nom</th>
                <th className="p-3 font-semibold">Email</th>
                <th className="p-3 font-semibold">Rôle</th>
                <th className="p-3 font-semibold">Inscrit</th>
              </tr>
            </thead>
            <tbody>
              {m.recentUsers.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0">
                  <td className="p-3">{u.name ?? "—"}</td>
                  <td className="p-3 opacity-70">{u.email}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        u.role === "ADMIN" ? "bg-gold text-[#12100D]" : "bg-white/10 opacity-70"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 tabular-nums opacity-55">{dateFr(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <p className="text-xs opacity-45">
        Qualité IA : en attente du module de feedback conversationnel — il alimentera cette section
        une fois la conversation réelle branchée.
      </p>
    </main>
  );
}
