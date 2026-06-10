"use client";

// The one primary action per screen: an engraved machine plate.
export function PlateButton({
  children,
  onClick,
  className = "",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`press block w-full bg-navy text-paper font-display font-bold tracking-[0.18em] text-[15px] uppercase py-4 px-6 border border-navy-deep shadow-plate disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

// Secondary actions: typed, underlined, quiet.
export function TypeLink({
  children,
  onClick,
  className = "",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-geo text-[13px] tracking-wider underline underline-offset-4 decoration-[1.5px] decoration-faded text-ink-soft disabled:no-underline disabled:opacity-45 ${className}`}
    >
      {children}
    </button>
  );
}

// A typed form checkbox: square box, red ink X when checked.
export function FormCheck({
  checked,
  onChange,
  label,
  sub,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sub?: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 text-left"
      role="checkbox"
      aria-checked={checked}
    >
      <span className="relative mt-[1px] inline-block h-[22px] w-[22px] shrink-0 border-[1.5px] border-ink bg-paper">
        {checked && (
          <svg
            viewBox="0 0 22 22"
            className="absolute -top-[3px] -left-[2px] h-[26px] w-[26px]"
            aria-hidden
          >
            <path
              d="M 4 5 L 18 18 M 18 4 L 5 18"
              stroke="#1F3A5F"
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        )}
      </span>
      <span className="font-geo">
        <span className="block text-[14px] tracking-wide text-ink">{label}</span>
        {sub && <span className="block text-[11.5px] text-faded">{sub}</span>}
      </span>
    </button>
  );
}
