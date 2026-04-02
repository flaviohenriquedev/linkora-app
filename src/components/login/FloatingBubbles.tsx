import type { CSSProperties } from "react";

type Bubble = { className: string; style: CSSProperties };

const BUBBLES: Bubble[] = [
  {
    className:
      "left-[3%] top-[8%] h-[min(42vw,320px)] w-[min(42vw,320px)] bg-gold/25 blur-3xl",
    style: { animation: "login-bubble-wander 30s ease-in-out infinite", animationDelay: "-3s" },
  },
  {
    className:
      "right-[6%] top-[18%] h-[min(34vw,240px)] w-[min(34vw,240px)] bg-green-light/20 blur-3xl",
    style: { animation: "login-bubble-wander 24s ease-in-out infinite", animationDelay: "-11s" },
  },
  {
    className:
      "bottom-[8%] left-[9%] h-[min(45vw,340px)] w-[min(45vw,340px)] bg-gold-light/15 blur-3xl",
    style: { animation: "login-bubble-wander 27s ease-in-out infinite", animationDelay: "-6s" },
  },
  {
    className:
      "bottom-[4%] right-[5%] h-[min(28vw,190px)] w-[min(28vw,190px)] bg-green-main/30 blur-2xl",
    style: { animation: "login-bubble-wander-alt 22s ease-in-out infinite", animationDelay: "-14s" },
  },
  {
    className:
      "left-[36%] top-[42%] h-[min(22vw,160px)] w-[min(22vw,160px)] bg-white/10 blur-2xl",
    style: { animation: "login-bubble-wander-alt 18s ease-in-out infinite", animationDelay: "-4s" },
  },
  {
    className:
      "right-[28%] bottom-[35%] h-[min(20vw,120px)] w-[min(20vw,120px)] border border-white/20 bg-gold/10 backdrop-blur-md blur-xl",
    style: { animation: "login-bubble-wander 19s ease-in-out infinite", animationDelay: "-9s" },
  },
  {
    className: "left-[56%] top-[9%] h-[min(18vw,130px)] w-[min(18vw,130px)] bg-[#4CAF76]/18 blur-2xl",
    style: { animation: "login-bubble-wander-alt 20s ease-in-out infinite", animationDelay: "-2s" },
  },
  {
    className: "left-[18%] top-[55%] h-[min(14vw,100px)] w-[min(14vw,100px)] bg-[#C9A84C]/18 blur-2xl",
    style: { animation: "login-bubble-wander 16s ease-in-out infinite", animationDelay: "-12s" },
  },
];

export function FloatingBubbles() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(201,168,76,0.12),transparent_55%),radial-gradient(ellipse_at_80%_0%,rgba(76,175,118,0.08),transparent_45%),radial-gradient(ellipse_at_50%_100%,rgba(13,31,23,0.9),#0D1F17)]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          className={`absolute will-change-transform rounded-full ${b.className}`}
          style={b.style}
        />
      ))}
      <div
        className="absolute left-1/2 top-1/2 h-[min(58vw,420px)] w-[min(58vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-gradient-to-br from-white/5 to-transparent shadow-[0_0_110px_rgba(201,168,76,0.16)] backdrop-blur-[2px] will-change-transform"
        style={{ animation: "login-bubble-orbit 33s ease-in-out infinite", animationDelay: "-8s" }}
      />
    </div>
  );
}
