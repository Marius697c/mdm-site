import { Link } from "@/i18n/navigation";

type Props = { title: string; text: string; button: string; query?: string };

export function CtaBanner({ title, text, button, query }: Props) {
  return (
    <section className="section bg-navy-900 text-white">
      <div className="container-page flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="h2 max-w-xl">{title}</h2>
          <p className="lead mt-4 !text-navy-100">{text}</p>
        </div>
        <Link
          href={query ? { pathname: "/contact", query: { profile: query } } : "/contact"}
          className="btn-primary shrink-0"
        >
          {button}
        </Link>
      </div>
    </section>
  );
}
