import type {
  SuiMoveNormalizedModule,
  SuiMoveNormalizedFunction,
  SuiMoveNormalizedStruct,
  SuiMoveNormalizedType,
} from '@mysten/sui/jsonRpc'

interface Props {
  modules: Record<string, SuiMoveNormalizedModule> | null
  selectedModule: string | null
  packageId: string
  loading: boolean
  error: string | null
  onSelectModule: (name: string) => void
}

/** Render a Move type as a readable string */
function renderType(t: SuiMoveNormalizedType): string {
  if (typeof t === 'string') return t.toLowerCase()
  if ('Struct' in t) {
    const s = t.Struct
    const args = s.typeArguments.length > 0
      ? `<${s.typeArguments.map(renderType).join(', ')}>`
      : ''
    return `${s.module}::${s.name}${args}`
  }
  if ('Vector' in t) return `vector<${renderType(t.Vector)}>`
  if ('TypeParameter' in t) return `T${t.TypeParameter}`
  if ('Reference' in t) return `&${renderType(t.Reference)}`
  if ('MutableReference' in t) return `&mut ${renderType(t.MutableReference)}`
  return JSON.stringify(t)
}

function FunctionCard({ name, fn }: { name: string; fn: SuiMoveNormalizedFunction }) {
  const isEntry = fn.isEntry
  const isPublic = fn.visibility === 'Public'

  return (
    <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 mb-2">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-sm font-semibold text-[#34d399] font-mono">{name}</span>
        <div className="flex gap-1.5">
          {isEntry && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6fbcf0]/20 text-[#6fbcf0]
              border border-[#6fbcf0]/30 font-bold">
              entry
            </span>
          )}
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
            ${isPublic
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : fn.visibility === 'Friend'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}>
            {fn.visibility.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Parameters */}
      {fn.parameters.length > 0 && (
        <div className="mb-1.5">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Params </span>
          <code className="text-xs text-gray-300 font-mono">
            ({fn.parameters.map(renderType).join(', ')})
          </code>
        </div>
      )}

      {/* Return types */}
      {fn.return && fn.return.length > 0 && (
        <div>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Returns </span>
          <code className="text-xs text-[#a78bfa] font-mono">
            {fn.return.map(renderType).join(', ')}
          </code>
        </div>
      )}

      {/* Type params */}
      {fn.typeParameters && fn.typeParameters.length > 0 && (
        <div className="mt-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Type params </span>
          <code className="text-xs text-gray-400 font-mono">
            {fn.typeParameters.map((_, i) => `T${i}`).join(', ')}
          </code>
        </div>
      )}
    </div>
  )
}

function StructCard({ name, struct }: { name: string; struct: SuiMoveNormalizedStruct }) {
  const abilities = struct.abilities.abilities ?? []
  return (
    <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3 mb-2">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-sm font-semibold text-[#fb923c] font-mono">{name}</span>
        {abilities.map((a) => (
          <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-[#fb923c]/20
            text-[#fb923c] border border-[#fb923c]/30 font-bold">
            {a.toLowerCase()}
          </span>
        ))}
      </div>
      {struct.fields.map((field) => (
        <div key={field.name} className="flex items-center gap-2 text-xs font-mono py-0.5">
          <span className="text-gray-300 w-32 flex-shrink-0">{field.name}</span>
          <span className="text-gray-500">:</span>
          <span className="text-[#6fbcf0]">{renderType(field.type)}</span>
        </div>
      ))}
    </div>
  )
}

function ModulePanel({ module }: { module: SuiMoveNormalizedModule }) {
  const functions = Object.entries(module.exposedFunctions)
  const structs = Object.entries(module.structs)
  const entryFns = functions.filter(([, fn]) => fn.isEntry)
  const publicFns = functions.filter(([, fn]) => !fn.isEntry && fn.visibility === 'Public')
  const otherFns = functions.filter(([, fn]) => !fn.isEntry && fn.visibility !== 'Public')

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Module header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="text-2xl font-bold text-white font-mono">{module.name}</div>
        <span className="text-xs text-gray-500 bg-[#161b22] border border-[#30363d] px-2 py-1 rounded">
          v{module.fileFormatVersion}
        </span>
        {module.friends.length > 0 && (
          <span className="text-xs text-gray-400">
            {module.friends.length} friend{module.friends.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Structs */}
      {structs.length > 0 && (
        <section className="mb-8">
          <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#fb923c]" />
            Structs ({structs.length})
          </h3>
          {structs.map(([name, struct]) => (
            <StructCard key={name} name={name} struct={struct} />
          ))}
        </section>
      )}

      {/* Entry functions */}
      {entryFns.length > 0 && (
        <section className="mb-8">
          <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6fbcf0]" />
            Entry Functions ({entryFns.length})
          </h3>
          {entryFns.map(([name, fn]) => (
            <FunctionCard key={name} name={name} fn={fn} />
          ))}
        </section>
      )}

      {/* Public functions */}
      {publicFns.length > 0 && (
        <section className="mb-8">
          <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Public Functions ({publicFns.length})
          </h3>
          {publicFns.map(([name, fn]) => (
            <FunctionCard key={name} name={name} fn={fn} />
          ))}
        </section>
      )}

      {/* Other functions */}
      {otherFns.length > 0 && (
        <section className="mb-8">
          <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            Private / Friend Functions ({otherFns.length})
          </h3>
          {otherFns.map(([name, fn]) => (
            <FunctionCard key={name} name={name} fn={fn} />
          ))}
        </section>
      )}
    </div>
  )
}

export function PackageViewer({
  modules,
  selectedModule,
  packageId,
  loading,
  error,
  onSelectModule,
}: Props) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#a78bfa] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading package…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="w-12 h-12 bg-red-900/30 border border-red-500/50 rounded-full flex items-center
            justify-center mx-auto mb-4 text-red-400 text-xl">✕</div>
          <h3 className="text-white font-semibold mb-2">Package not found</h3>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  if (!modules) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-lg px-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#161b22] border border-[#30363d]
            flex items-center justify-center text-3xl">📦</div>
          <h2 className="text-xl font-semibold text-white mb-3">Package Viewer</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            Enter a Sui package ID to explore its Move modules — structs, entry functions,
            public functions, types, and abilities.
          </p>
          <p className="text-xs text-gray-500">
            Try the Sui Framework: <span className="text-[#6fbcf0] font-mono">0x2</span>
          </p>
        </div>
      </div>
    )
  }

  const moduleNames = Object.keys(modules).sort()
  const activeModule = selectedModule ? modules[selectedModule] : null

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Module list sidebar */}
      <div className="w-52 flex-shrink-0 border-r border-[#30363d] bg-[#0d1117] flex flex-col overflow-hidden">
        <div className="px-3 py-3 border-b border-[#30363d]">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Package</div>
          <div className="text-xs text-[#6fbcf0] font-mono truncate">{packageId.slice(0, 10)}…</div>
          <div className="text-[10px] text-gray-500 mt-1">{moduleNames.length} modules</div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {moduleNames.map((name) => {
            const mod = modules[name]
            const fnCount = Object.keys(mod.exposedFunctions).length
            const structCount = Object.keys(mod.structs).length
            const isSelected = name === selectedModule
            return (
              <button
                key={name}
                onClick={() => onSelectModule(name)}
                className={`w-full text-left px-3 py-2 transition-colors
                  ${isSelected
                    ? 'bg-[#6fbcf0]/10 border-r-2 border-[#6fbcf0] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#161b22]'
                  }`}
              >
                <div className="text-xs font-mono font-medium truncate">{name}</div>
                <div className="text-[10px] text-gray-600 mt-0.5">
                  {fnCount}fn · {structCount}struct
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Module detail */}
      {activeModule ? (
        <ModulePanel module={activeModule} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          Select a module
        </div>
      )}
    </div>
  )
}
