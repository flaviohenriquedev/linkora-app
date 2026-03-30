type Props = { className?: string };

export function Logo({ className = "" }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle
        cx="20"
        cy="20"
        r="17"
        fill="none"
        stroke="#C9A84C"
        strokeWidth="2"
        strokeDasharray="90 20"
      />
      <line
        x1="20"
        y1="4"
        x2="20"
        y2="36"
        stroke="#C9A84C"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="32" cy="28" r="2.5" fill="#C9A84C" />
    </svg>
  );
}
