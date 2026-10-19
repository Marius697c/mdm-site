import type { ReactNode } from "react";

type Props = {
  id?: string;
  eyebrow?: string;
  title: string;
  text?: string;
  tone?: "white" | "soft" | "dark";
  children?: ReactNode;
};

export function Section({ id, eyebrow, title, text, tone = "white", children }: Props) {
  const bg = { white: "bg-white", soft: "bg-navy-50", dark: "bg-navy-900 text-white" }[tone];
  const eyebrowCls = tone === "dark" ? "eyebrow !text-cyan-300" : "eyebrow";
  const leadCls = tone === "dark" ? "lead !text-navy-100" : "lead";
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={`section ${bg}`}>
      <div className="container-page">
        <div className="mb-12">
          {eyebrow && <p className={eyebrowCls}>{eyebrow}</p>}
          <h2 id={id ? `${id}-title` : undefined} className="h2 max-w-3xl">{title}</h2>
          {text && <p className={`${leadCls} mt-4`}>{text}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}
