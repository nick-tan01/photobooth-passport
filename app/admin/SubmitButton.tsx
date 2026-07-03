"use client";

import { useFormStatus } from "react-dom";

// The only client-side JS on /admin: the PRESENT / PRESENTING… pending
// label on the key-gate button (DESIGN.md's key-gate spec). Everything else
// on this page is a plain server-rendered form + Server Action.
export default function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="press border border-navy-deep bg-navy px-3 py-[7px] font-geo text-[10.5px] tracking-[0.18em] text-paper disabled:opacity-40"
    >
      {pending ? "PRESENTING…" : "PRESENT"}
    </button>
  );
}
