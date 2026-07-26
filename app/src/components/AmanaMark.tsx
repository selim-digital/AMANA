export function AmanaMark({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-label="Symbole AMANA">
      <rect x="10" y="10" width="180" height="180" rx="52" className="fill-ink" />
      <circle cx="66" cy="134" r="13" className="fill-paper" />
      <circle cx="100" cy="100" r="13" className="fill-paper" />
      <circle cx="136" cy="64" r="14.5" className="fill-gold" />
    </svg>
  );
}

export function Wordmark({ className = "text-xl" }: { className?: string }) {
  return (
    <span className={`font-extrabold tracking-[0.38em] indent-[0.38em] ${className}`}>AMANA</span>
  );
}
