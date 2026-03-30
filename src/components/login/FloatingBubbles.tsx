import type { CSSProperties } from "react";

const BUBBLES: { className: string; style: CSSProperties }[] = [
  {
    className:
      "left-[8%] top-[12%] h-[min(42vw,280px)] w-[min(42vw,280px)] bg-gold/25 animate-float",
    style: { animationDelay: "0s" },
  },
  {
    className:
      "right-[12%] top-[20%] h-[min(36vw,220px)] w-[min(36vw,220px)] bg-green-light/20 animate-float-slow",
    style: { animationDelay: "-4s" },
  },
  {
    className:
      "bottom-[18%] left-[15%] h-[min(48vw,320px)] w-[min(48vw,320px)] bg-gold-light/15 animate-drift",
    style: { animationDelay: "-2s" },
  },
  {
    className:
      "bottom-[10%] right-[8%] h-[min(30vw,180px)] w-[min(30vw,180px)] bg-green-main/30 animate-drift-reverse",
    style: { animationDelay: "-7s" },
  },
  {
    className:
      "left-[35%] top-[45%] h-[min(24vw,140px)] w-[min(24vw,140px)] bg-white/10 animate-pulse-soft",
    style: { animationDelay: "-1s" },
  },
  {
    className:
      "right-[28%] bottom-[35%] h-[min(20vw,120px)] w-[min(20vw,120px)] border border-white/20 bg-gold/10 backdrop-blur-md animate-float",
    style: { animationDelay: "-4s" },
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
          className={`absolute will-change-transform rounded-full blur-3xl ${b.className}`}
          style={b.style}
        />
      ))}
      <div className="absolute left-1/2 top-1/2 h-[min(55vw,380px)] w-[min(55vw,380px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-gradient-to-br from-white/5 to-transparent shadow-[0_0_80px_rgba(201,168,76,0.12)] backdrop-blur-[2px] will-change-transform animate-pulse-soft" />
    </div>
  );
}
