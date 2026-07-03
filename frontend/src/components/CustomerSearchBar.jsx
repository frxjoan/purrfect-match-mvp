import { useEffect, useMemo, useRef, useState } from 'react'
import { countActiveListingFilters, emptyListingFilters, getListingFilterOptions } from '../utils/listingFilters.js'

function CustomerSearchBar({ filters = emptyListingFilters, listings = [], onChange, onFiltersChange, value }) {
  const [draftFilters, setDraftFilters] = useState(filters)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const containerRef = useRef(null)
  const filterOptions = useMemo(() => getListingFilterOptions(listings), [listings])
  const activeFilterCount = countActiveListingFilters(filters)

  useEffect(() => {
    setDraftFilters(filters)
  }, [filters])

  useEffect(() => {
    function handleOutsideClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFilterOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  function updateDraft(field, nextValue) {
    setDraftFilters((current) => ({ ...current, [field]: nextValue }))
  }

  function applyFilters() {
    onFiltersChange?.(draftFilters)
    setIsFilterOpen(false)
  }

  function clearFilters() {
    setDraftFilters(emptyListingFilters)
    onFiltersChange?.(emptyListingFilters)
    setIsFilterOpen(false)
  }

  return (
    <div className="relative mx-auto w-full max-w-sm" ref={containerRef}>
      <div className="flex h-9 items-center rounded-full border border-black bg-white px-2 text-sm shadow-sm">
        <button
          aria-expanded={isFilterOpen}
          aria-label="Open listing filters"
          className="relative mr-3 grid h-9 w-9 place-items-center rounded-full text-3xl leading-none transition hover:bg-[#eee7ff]"
          onClick={() => setIsFilterOpen((isOpen) => !isOpen)}
          type="button"
        >
          <span aria-hidden="true">{'\uD83D\uDC3E'}</span>
          {activeFilterCount ? (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#ff7bac] px-1 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
        <input
          className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
          onChange={(event) => onChange(event.target.value)}
          placeholder="Orange cat..."
          value={value}
        />

      </div>

      {isFilterOpen ? (
        <div className="absolute left-0 right-0 top-12 z-20 rounded-xl border border-black bg-[#fbfbff] p-4 text-xs shadow-xl">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="font-semibold text-slate-700">Breed</span>
              <select className="rounded-lg border border-black bg-white px-3 py-2" onChange={(event) => updateDraft('breed', event.target.value)} value={draftFilters.breed}>
                <option value="">Any breed</option>
                {filterOptions.breeds.map((breed) => <option key={breed} value={breed}>{breed}</option>)}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="font-semibold text-slate-700">Location</span>
              <select className="rounded-lg border border-black bg-white px-3 py-2" onChange={(event) => updateDraft('location', event.target.value)} value={draftFilters.location}>
                <option value="">Any location</option>
                {filterOptions.locations.map((location) => <option key={location} value={location}>{location}</option>)}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="font-semibold text-slate-700">Gender</span>
              <select className="rounded-lg border border-black bg-white px-3 py-2" onChange={(event) => updateDraft('gender', event.target.value)} value={draftFilters.gender}>
                <option value="">Any gender</option>
                {filterOptions.genders.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="font-semibold text-slate-700">Status</span>
              <select className="rounded-lg border border-black bg-white px-3 py-2" onChange={(event) => updateDraft('status', event.target.value)} value={draftFilters.status}>
                <option value="">Any status</option>
                {filterOptions.statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="font-semibold text-slate-700">Min price</span>
              <input className="rounded-lg border border-black bg-white px-3 py-2" min="0" onChange={(event) => updateDraft('minPrice', event.target.value)} placeholder="0" type="number" value={draftFilters.minPrice} />
            </label>
            <label className="grid gap-1">
              <span className="font-semibold text-slate-700">Max price</span>
              <input className="rounded-lg border border-black bg-white px-3 py-2" min="0" onChange={(event) => updateDraft('maxPrice', event.target.value)} placeholder="2500" type="number" value={draftFilters.maxPrice} />
            </label>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button className="rounded-full border border-black bg-white px-4 py-2 font-semibold transition hover:bg-[#fff0f6]" onClick={clearFilters} type="button">Clear filters</button>
            <button className="rounded-full border border-[#6c5ce7] bg-[#6c5ce7] px-4 py-2 font-semibold text-white transition hover:bg-[#5b4ed8]" onClick={applyFilters} type="button">Apply filters</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default CustomerSearchBar