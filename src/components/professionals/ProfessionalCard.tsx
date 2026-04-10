import Link from "next/link";
import {Button} from "@/components/ui/Button";
import {IconWhatsApp} from "@/components/icons/IconWhatsApp";
import {presenceAvatarRingClass} from "@/lib/presence-avatar";
import {professionalPath, type PublicProfessional} from "@/lib/public-professionals-shared";
import {buildWhatsAppChatUrl} from "@/lib/whatsapp-links";

type Props = {
    professional: PublicProfessional;
};

function Stars({n}: { n: number }) {
    return (
        <span className="text-gold">
      {"★".repeat(n)}
            {"☆".repeat(5 - n)}
    </span>
    );
}

export function ProfessionalCard({professional: p}: Props) {
    const profilePath = professionalPath(p);
    const whatsappHref =
        p.whatsappPhoneDigits != null
            ? buildWhatsAppChatUrl(p.whatsappPhoneDigits, p.whatsappOpenMessage)
            : null;
    return (
        <article
            className="flex min-w-0 cursor-pointer flex-col rounded-2xl border border-border bg-bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold">
            <Link href={profilePath} className="group mb-4 flex items-center gap-4">
                <div
                    className={`shrink-0 rounded-full transition-transform group-hover:scale-105 ${presenceAvatarRingClass(p.presence)}`}
                >
                    <div
                        className="flex h-14 w-14 overflow-hidden rounded-full font-serif text-2xl font-semibold text-white"
                        style={p.avatarUrl ? undefined : {backgroundColor: p.color}}
                    >
                        {p.avatarUrl ? (
                            <img
                                src={p.avatarUrl}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center">{p.initials}</span>
                        )}
                    </div>
                </div>
                <div>
                    <h3 className="mb-1 font-sans text-lg group-hover:text-gold">{p.name}</h3>
                    <span
                        className="mb-2 inline-block rounded bg-[rgba(46,125,82,0.2)] px-2 py-0.5 text-xs text-green-light">
            {p.specialty}
          </span>
                    <p className="text-[13px] text-text-muted">{p.city}</p>
                    {p.priceLabel ? (
                        <p className="mt-1 text-sm font-medium text-gold">{p.priceLabel}</p>
                    ) : null}
                </div>
            </Link>
            <div className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
                <Stars n={p.stars}/>
                <span>({p.reviews})</span>
            </div>
            <div className="mt-auto flex min-w-0 flex-col gap-2 sm:gap-3">
                <Link href={profilePath} className="min-w-0 w-full">
                    <Button
                        variant="outline"
                        className="w-full px-3 py-2.5 text-sm sm:px-4 sm:text-[15px]"
                    >
                        Ver Perfil
                    </Button>
                </Link>
                <div className="flex min-w-0 gap-2 sm:gap-3">
                    <Link href={`/chat?peer=${p.id}`} className="min-w-0 flex-1">
                        <Button variant="green" className="w-full px-3 py-2.5 text-sm sm:px-4 sm:text-[15px]">
                            Chat
                        </Button>
                    </Link>
                    {whatsappHref ? (
                        <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                            aria-label={`WhatsApp — ${p.name}`}
                            title="WhatsApp"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Button
                                type="button"
                                variant="outline"
                                className="h-full min-h-[44px] min-w-[44px] border-[#25D366]/50 px-0 text-[#25D366] hover:border-[#25D366] hover:bg-[#25D366]/10"
                            >
                                <IconWhatsApp className="h-5 w-5" />
                            </Button>
                        </a>
                    ) : null}
                </div>
            </div>
        </article>
    );
}
