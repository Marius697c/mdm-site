type Item = { title: string; text: string };

/** Liste d'étapes numérotées (sémantique <ol>). */
export function Steps({ items, label, columns = 3, dark = false }: { items: Item[]; label?: string; columns?: 2 | 3; dark?: boolean }) {
  const grid = columns === 2 ? "md:grid-cols-2" : "md:grid-cols-3";
  return (
    <ol className={`grid gap-6 ${grid}`}>
      {items.map((item, i) => (
        <li key={item.title} className={`rounded-2xl p-6 ${dark ? "bg-white/5 ring-1 ring-white/15" : "card"}`}>
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-navy-800 text-lg font-bold text-cyan-300">
            {i + 1}
            {label && <span className="sr-only"> ({label})</span>}
          </span>
          <h3 className="text-xl font-bold">{item.title}</h3>
          <p className={`mt-2 leading-relaxed ${dark ? "text-navy-100" : "text-navy-700"}`}>{item.text}</p>
        </li>
      ))}
    </ol>
  );
}
