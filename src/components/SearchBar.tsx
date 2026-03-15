import { useState, useEffect } from 'react'

interface Props {
  onSearch: (id: string) => void
  loading: boolean
  placeholder?: string
  example?: { label: string; value: string }
}

export function SearchBar({ onSearch, loading, placeholder, example }: Props) {
  const [value, setValue] = useState('')

  // Clear input when placeholder changes (mode switch)
  useEffect(() => {
    setValue('')
  }, [placeholder])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) onSearch(value.trim())
  }

  const handleExample = () => {
    if (!example?.value) return
    setValue(example.value)
    onSearch(example.value)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1 min-w-0">
      <div className="flex-1 relative min-w-0">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder ?? 'Enter a Sui ID'}
          className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-10 pr-4 py-2
            text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#6fbcf0]
            transition-colors"
          disabled={loading}
        />
      </div>
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="px-4 py-2 bg-[#6fbcf0] text-[#0d1117] font-semibold text-sm rounded-lg
          hover:bg-[#5aa8e0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors
          whitespace-nowrap flex-shrink-0"
      >
        {loading ? 'Loading…' : 'Go'}
      </button>
      {example?.value && (
        <button
          type="button"
          onClick={handleExample}
          disabled={loading}
          className="px-3 py-2 bg-[#21262d] border border-[#30363d] text-gray-400 text-xs
            rounded-lg hover:text-white hover:border-[#6fbcf0] disabled:opacity-50
            disabled:cursor-not-allowed transition-colors whitespace-nowrap flex-shrink-0"
        >
          {example.label}
        </button>
      )}
    </form>
  )
}
