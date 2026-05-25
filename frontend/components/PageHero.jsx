function PageHero({ eyebrow, title, description, children }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl shadow-slate-950/30">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">{eyebrow}</p>
      <h1 className="mt-4 text-4xl font-semibold text-white">{title}</h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">{description}</p>
      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  )
}

export default PageHero
