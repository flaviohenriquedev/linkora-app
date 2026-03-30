import Image from "next/image";

type Props = {
  className?: string;
  /** Enquadramento da foto (rosto um pouco acima do centro costuma funcionar bem). */
  objectPosition?: string;
  /** `true` na Ka acima da dobra (LCP). */
  priority?: boolean;
};

export function KaAvatar({
  className = "h-full w-full",
  objectPosition = "center 28%",
  priority = false,
}: Props) {
  return (
    <div
      className={`relative isolate overflow-hidden rounded-full bg-bg-card ${className}`}
      style={{
        boxShadow:
          "0 0 0 1px rgba(201, 168, 76, 0.35), 0 0 0 2px rgba(13, 31, 23, 0.9), 0 12px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
      }}
    >
      <Image
        src="/KaChatProfile.png"
        alt="Ka, assistente virtual da Linkora"
        fill
        sizes="(max-width: 768px) 112px, 176px"
        priority={priority}
        className="object-cover"
        style={{ objectPosition }}
      />
      {/* Vinheta leve nas bordas para “selar” o círculo */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-black/25"
        aria-hidden
      />
    </div>
  );
}
