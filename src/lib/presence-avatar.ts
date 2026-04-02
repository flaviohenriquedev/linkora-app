/** Classes Tailwind para anel de presença (online / ausente / offline) em avatares. */
export type PresenceStatus = "online" | "away" | "offline";

export function presenceAvatarRingClass(presence?: PresenceStatus): string {
  if (presence === "online") return "ring-2 ring-green-light ring-offset-2 ring-offset-bg-card";
  if (presence === "away") return "ring-2 ring-gold ring-offset-2 ring-offset-bg-card";
  if (presence === "offline") return "ring-2 ring-text-muted/50 ring-offset-2 ring-offset-bg-card";
  return "";
}
