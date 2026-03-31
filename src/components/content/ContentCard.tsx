import Link from "next/link";

type Props = {
  href: string;
  title: string;
  description?: string | null;
  imageFileId?: string | null;
  footer?: React.ReactNode;
};

export function ContentCard({ href, title, description, imageFileId, footer }: Props) {
  const imgSrc = imageFileId ? `/api/public/files/${imageFileId}` : null;
  return (
    <Link
      href={href}
      className="group flex min-h-[200px] flex-col overflow-hidden rounded-2xl border border-border bg-bg-card transition hover:border-gold"
    >
      {imgSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL assinada via redirect
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-bg-secondary">
          <img src={imgSrc} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
        </div>
      ) : (
        <div className="flex min-h-[100px] items-center justify-center bg-gradient-to-br from-bg-secondary to-border px-4 py-6">
          <h3 className="text-center font-serif text-lg font-medium text-text-primary group-hover:text-gold sm:text-xl">
            {title}
          </h3>
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        {imgSrc ? (
          <h3 className="mb-2 font-sans text-lg font-medium text-text-primary group-hover:text-gold">{title}</h3>
        ) : null}
        {description ? (
          <p className="line-clamp-3 flex-1 text-sm text-text-secondary">{description}</p>
        ) : null}
        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </Link>
  );
}
