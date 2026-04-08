import { ConnectButton, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit'
import { useWallet } from '../lib/WalletContext'

export function WalletButton() {
  const account = useCurrentAccount()
  const { mutate: disconnect } = useDisconnectWallet()
  const { isAdmin: admin } = useWallet()

  if (!account) {
    return (
      <ConnectButton
        connectText="Connect Wallet"
        className="!px-3 !py-1.5 !text-xs !font-semibold !rounded-lg
          !border !border-[#30363d] !bg-[#161b22] !text-gray-300
          hover:!text-white hover:!border-[#6fbcf0] !transition-colors"
      />
    )
  }

  const short = `${account.address.slice(0, 6)}…${account.address.slice(-4)}`

  return (
    <div className="flex items-center gap-2">
      {admin && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full
          bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20">
          ADMIN
        </span>
      )}
      <button
        onClick={() => disconnect()}
        title={account.address}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg
          border border-[#30363d] bg-[#161b22] text-gray-300
          hover:text-white hover:border-[#6fbcf0] transition-colors"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        {short}
      </button>
    </div>
  )
}
