type Props = { className?: string };

export function KaAvatar({ className = "h-full w-full" }: Props) {
  return (
    <svg className={className} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="40" cy="40" r="40" fill="#1A3526" />
      <ellipse cx="40" cy="62" rx="18" ry="20" fill="#1B4D35" />
      <rect x="36" y="44" width="8" height="10" rx="3" fill="#C8956C" />
      <ellipse cx="40" cy="34" rx="12" ry="14" fill="#C8956C" />
      <ellipse cx="40" cy="26" rx="13" ry="8" fill="#1A1A1A" />
      <rect x="28" y="26" width="5" height="18" rx="2" fill="#1A1A1A" />
      <rect x="47" y="26" width="5" height="18" rx="2" fill="#1A1A1A" />
      <ellipse cx="35" cy="34" rx="2" ry="2.5" fill="#2A1A0A" />
      <ellipse cx="45" cy="34" rx="2" ry="2.5" fill="#2A1A0A" />
      <path
        d="M35 41 Q40 44 45 41"
        stroke="#8B5E3C"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="28" cy="36" r="2" fill="#C9A84C" />
      <circle cx="52" cy="36" r="2" fill="#C9A84C" />
      <path
        d="M33 54 Q40 50 47 54"
        stroke="#2E5040"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}
