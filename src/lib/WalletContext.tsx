/**
 * Thin wrapper around @mysten/dapp-kit that exposes
 * the connected wallet address + isAdmin flag app-wide.
 */
import { createContext, useContext, type ReactNode } from 'react'
import {
  WalletProvider as DAppWalletProvider,
  SuiClientProvider,
  useCurrentAccount,
} from '@mysten/dapp-kit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { isAdmin } from './adminAuth'
import '@mysten/dapp-kit/dist/index.css'

const queryClient = new QueryClient()

interface WalletCtx {
  address: string | null
  isAdmin: boolean
}

const WalletCtx = createContext<WalletCtx>({ address: null, isAdmin: false })

function Inner({ children }: { children: ReactNode }) {
  const account = useCurrentAccount()
  const address = account?.address ?? null
  return (
    <WalletCtx.Provider value={{ address, isAdmin: isAdmin(address) }}>
      {children}
    </WalletCtx.Provider>
  )
}

const networks = {
  mainnet: { url: 'https://fullnode.mainnet.sui.io:443', network: 'mainnet' as const },
  testnet: { url: 'https://fullnode.testnet.sui.io:443', network: 'testnet' as const },
  devnet:  { url: 'https://fullnode.devnet.sui.io:443',  network: 'devnet'  as const },
}

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="mainnet">
        <DAppWalletProvider autoConnect>
          <Inner>{children}</Inner>
        </DAppWalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}

export function useWallet() {
  return useContext(WalletCtx)
}
