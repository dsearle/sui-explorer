import { useState } from 'react'

interface Props {
  onSearch: (id: string) => void
  loading: boolean
}

const EXAMPLE_IDS = {
  mainnet: '0x5',       // Sui System State object
  testnet: '0x5',
  devnet: '0x5',
}

export function SearchBar({ onSearch, loading }: Props) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) onSearch(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 flex-1">
      <div className="flex-1 relative">
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
          placeholder="Enter a Sui Object ID (e.g. 0x5)"
          className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-10 pr-4 py-2.5
            text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#6fbcf0]
            transition-colors"
          disabled={loading}
        />
      </div>
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="px-5 py-2.5 bg-[#6fbcf0] text-[#0d1117] font-semibold text-sm rounded-lg
          hover:bg-[#5aa8e0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors
          whitespace-nowrap"
      >
        {loading ? 'Loading…' : 'Explore'}
      </button>
      <button
        type="button"
        onClick={() => {
          setValue(EXAMPLE_IDS.mainnet)
          onSearch(EXAMPLE_IDS.mainnet)
        }}
        disabled={loading}
        className="px-4 py-2.5 bg-[#21262d] border border-[#30363d] text-gray-400 text-sm
          rounded-lg hover:text-white hover:border-[#6fbcf0] disabled:opacity-50
          disabled:cursor-not-allowed transition-colors whitespace-nowrap"
      >
        Try 0x5
      </button>
    </form>
  )
}
