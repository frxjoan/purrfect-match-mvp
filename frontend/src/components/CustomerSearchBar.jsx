function CustomerSearchBar({ onChange, value }) {
  return (
    <div className="mx-auto flex h-8 w-full max-w-sm items-center rounded-full border border-black bg-white px-3 text-sm">
      <span aria-hidden="true" className="mr-2 text-lg leading-none">🐾</span>
      <input
        className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Orange cat..."
        value={value}
      />
      <span aria-hidden="true" className="ml-2 text-lg leading-none">⌕</span>
    </div>
  )
}

export default CustomerSearchBar
