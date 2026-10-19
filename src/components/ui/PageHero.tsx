type Props = { eyebrow: string; title: string; text: string };

export function PageHero({ eyebrow, title, text }: Props) {
  return (
    <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-700 py-20 text-white sm:py-28">
      <div className="container-page">
        <p className="eyebrow !text-cyan-300">{eyebrow}</p>
        <h1 className="h1 max-w-3xl">{title}</h1>
        <p className="lead mt-6 !text-navy-100">{text}</p>
      </div>
    </div>
  );
}
