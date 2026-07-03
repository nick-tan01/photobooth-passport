import PaperTexture from "@/components/PaperTexture";
import SubmitButton from "./SubmitButton";
import { presentKey } from "./actions";

// DESIGN.md "### /admin — Bureau Ledger" — "Key-gate (unauthenticated)".
const REJECT_COPY: Record<string, string> = {
  invalid: "CREDENTIALS NOT RECOGNIZED — CHECK THE KEY.",
  // Env-less degradation line — not specified verbatim in DESIGN.md, so
  // written in the same signal-red/officialese register as the reject line
  // above rather than a generic error message.
  unavailable: "THE OFFICE IS CLOSED — NO LEDGER TO CONSULT.",
};

export default function Gate({ error }: { error?: string }) {
  const message = error ? REJECT_COPY[error] : undefined;

  return (
    <main className="relative flex min-h-dvh w-full flex-col items-center justify-center bg-cream px-5">
      <div className="relative z-10 mx-auto w-full max-w-app border-2 border-gold/50 px-6 py-8">
        <p className="text-center font-geo text-[10px] tracking-[0.26em] text-faded">
          THE GRAND TOUR COMPANY · HEAD OFFICE
        </p>
        <h1 className="mt-3 text-center font-display text-[20px] font-bold uppercase tracking-[0.08em] text-ink">
          PRESENT CREDENTIALS
        </h1>
        <p className="mt-3 text-center font-geo text-[12px] text-ink-soft">
          This ledger is restricted. State your key.
        </p>

        <form action={presentKey} className="mt-6 flex items-end justify-center gap-3">
          <input
            type="password"
            name="key"
            placeholder="OFFICE KEY"
            required
            autoComplete="off"
            aria-label="Office key"
            className="typed-field font-geo w-full max-w-[200px] uppercase tracking-[0.18em]"
          />
          <SubmitButton />
        </form>

        {message && (
          <p className="mt-4 text-center font-geo text-[10px] tracking-[0.1em] text-signal">
            {message}
          </p>
        )}
      </div>
      <PaperTexture />
    </main>
  );
}
