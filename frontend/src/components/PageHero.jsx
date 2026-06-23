function PageHero({ eyebrow, title, description, children }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">{eyebrow}</p>
      <h1 className="mt-4 text-3xl font-bold text-slate-950 md:text-5xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{description}</p>
      {children ? <div className="mt-8">{children}</div> : null}
    </section>
  )
}

export default PageHero
