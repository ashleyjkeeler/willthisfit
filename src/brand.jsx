// WillThisFit brand components. Geometry matches public/brand/*.svg.
export function Mark({ size = 36, color = "var(--c-mint)", title }) {
  return (
    <svg width={size} height={size * 52 / 60} viewBox="-1 0 60 52" fill="none" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <g stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22,14 C22,8 26,4 31,4 C36,4 40,8 40,13 C40,18 36,21 31,22 L31,26" />
        <path d="M31,26 C27,28 13,36 5,46" /><path d="M31,26 C35,28 49,36 57,46" /><path d="M5,46 L57,46" />
      </g>
      <path d="M31,39 C27,36 27,31 31,30 C35,31 35,36 31,39 Z" fill={color} />
    </svg>
  );
}

export function Wordmark({ size = 20, ink = "currentColor", accent = "var(--c-mint)" }) {
  return (
    <span style={{ fontFamily: "var(--f-display)", fontSize: size, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1, color: ink, whiteSpace: "nowrap" }}>
      WillThisFit<span style={{ color: accent }}>.me</span>
    </span>
  );
}
