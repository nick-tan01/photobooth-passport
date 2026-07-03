import PaperTexture from "@/components/PaperTexture";
import type { AdminKfactorRow, AdminMetrics } from "@/lib/admin";
import { pivotDailyFunnel, pivotUtmAttribution } from "@/lib/admin";

// Cap every table at 10 rows and say so in the label where DESIGN.md
// specifies one — "What NOT to do" on the /admin spec: "no pagination
// controls — cap long tables at 10 rows".
const ROW_CAP = 10;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="pb-1 pt-5 font-geo text-[9px] font-semibold tracking-[0.28em] text-gold">
      {children}
    </p>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-2 font-geo text-[11px] tracking-[0.18em] text-faded">{children}</p>
  );
}

function Th({ children, align = "right" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={`pb-1 font-geo text-[9px] font-semibold uppercase tracking-[0.12em] text-faded ${
        align === "left" ? "text-left" : "text-right"
      }`}
    >
      {children}
    </th>
  );
}

function Td({ children, align = "right" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <td
      className={`py-2 font-geo text-[12px] tabular-nums text-ink ${
        align === "left" ? "text-left" : "text-right"
      }`}
    >
      {children}
    </td>
  );
}

function KfactorHero({ kfactor }: { kfactor: AdminKfactorRow }) {
  const hasData = kfactor.k_factor !== null;
  return (
    <div className="mx-auto mt-6 w-full border border-navy-deep bg-navy px-6 py-8 text-center shadow-plate">
      <p className="font-geo text-[10px] tracking-[0.28em] text-gold">K — FACTOR</p>
      <p className="mt-2 font-display text-[64px] font-bold leading-none tabular-nums text-paper">
        {hasData ? kfactor.k_factor!.toFixed(2) : "—"}
      </p>
      <p className="mt-3 font-geo text-[10.5px] tracking-[0.1em] text-gold/70 tabular-nums">
        {hasData
          ? // Sourced from analytics_kfactor, which is all-time (not a
            // trailing window) — labeled ALL-TIME rather than DESIGN.md's
            // literal "TRAILING 7 DAYS" so the suffix doesn't misstate the
            // data's actual time range. See supabase/migrations/
            // 0012_admin_metrics.sql and lib/admin.ts for the source.
            `${kfactor.referred_activations} ÷ ${kfactor.activated_sessions} = ${kfactor.k_factor!.toFixed(2)} · ALL-TIME`
          : "NO SHARES YET — THE FIGURE AWAITS."}
      </p>
    </div>
  );
}

export default function Ledger({ metrics }: { metrics: AdminMetrics }) {
  const dailyRows = pivotDailyFunnel(metrics.daily_funnel).slice(0, ROW_CAP);
  const topSlugs = metrics.top_slugs.slice(0, ROW_CAP);
  const utmRows = pivotUtmAttribution(metrics.utm).slice(0, ROW_CAP);

  return (
    <main className="relative min-h-dvh w-full bg-cream pb-10">
      <div className="relative z-10 mx-auto max-w-app px-5 pt-safe-lg">
        <p className="text-center font-geo text-[10px] tracking-[0.26em] text-faded">
          THE GRAND TOUR COMPANY · HEAD OFFICE
        </p>
        <h1 className="mt-1 text-center font-display text-[22px] font-bold uppercase tracking-[0.05em] text-ink">
          BUREAU OF RECORDS
        </h1>
        <p className="mt-1 text-center font-geo text-[10px] tracking-[0.22em] text-signal">
          INTERNAL LEDGER — NOT FOR DISTRIBUTION
        </p>

        {metrics.kfactor && <KfactorHero kfactor={metrics.kfactor} />}

        <SectionLabel>DAILY FUNNEL</SectionLabel>
        {dailyRows.length === 0 ? (
          <EmptyLine>NO CROSSINGS RECORDED — THE REGISTER IS EMPTY.</EmptyLine>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Th align="left">DATE</Th>
                <Th>SAT</Th>
                <Th>STAMPED</Th>
                <Th>SHARED</Th>
                <Th>REFERRED</Th>
              </tr>
            </thead>
            <tbody>
              {dailyRows.map((row) => (
                <tr key={row.day} className="border-t border-navy/20">
                  <Td align="left">{row.day}</Td>
                  <Td>{row.sat}</Td>
                  <Td>{row.stamped}</Td>
                  <Td>{row.shared}</Td>
                  <Td>{row.referred}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <SectionLabel>TOP REFERRING SLUGS · FIRST 10</SectionLabel>
        {topSlugs.length === 0 ? (
          <EmptyLine>NO REFERRALS ON FILE.</EmptyLine>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Th align="left">SLUG</Th>
                <Th>VISITS</Th>
                <Th>ADMITTED</Th>
              </tr>
            </thead>
            <tbody>
              {topSlugs.map((row) => (
                <tr key={row.share_slug} className="border-t border-navy/20">
                  <Td align="left">
                    <span className="tracking-normal">{row.share_slug}</span>
                  </Td>
                  <Td>{row.arrival_sessions}</Td>
                  <Td>{row.activation_sessions}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <SectionLabel>UTM ATTRIBUTION</SectionLabel>
        {utmRows.length === 0 ? (
          <EmptyLine>NO ORIGIN STAMPED.</EmptyLine>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <Th align="left">SOURCE</Th>
                <Th align="left">CAMPAIGN</Th>
                <Th>ADMITTED</Th>
              </tr>
            </thead>
            <tbody>
              {utmRows.map((row) => (
                <tr key={`${row.source} ${row.campaign}`} className="border-t border-navy/20">
                  <Td align="left">{row.source}</Td>
                  <Td align="left">{row.campaign}</Td>
                  <Td>{row.admitted}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <footer className="mt-8 text-center font-geo text-[8.5px] tracking-[0.22em] text-faded">
          ISSUED BY THE GRAND TOUR COMPANY · EST. 2026
        </footer>
      </div>
      <PaperTexture />
    </main>
  );
}
