type Item = { title: string; text: string; tag?: string };

export function CardGrid({ items, columns = 3 }: { items: Item[]; columns?: 2 | 3 | 4 }) {
  const grid = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" }[columns];
  return (
    <ul className={`grid gap-6 ${grid}`}>
      {items.map((item) => (
        <li key={item.title} className="card border-t-4 border-t-cyan-400">
          {item.tag && <p className="mb-2 text-sm font-semibold text-navy-500">{item.tag}</p>}
          <h3 className="text-xl font-bold">{item.title}</h3>
          <p className="mt-2 leading-relaxed text-navy-700">{item.text}</p>
        </li>
      ))}
    </ul>
  );
}
