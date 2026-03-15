import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc'

export type Network = 'mainnet' | 'testnet' | 'devnet'

const RPC_URLS: Record<Network, string> = {
  mainnet: 'https://fullnode.mainnet.sui.io:443',
  testnet: 'https://fullnode.testnet.sui.io:443',
  devnet: 'https://fullnode.devnet.sui.io:443',
}

// Cache clients by network
const clientCache: Partial<Record<Network, SuiJsonRpcClient>> = {}

export function getClient(network: Network): SuiJsonRpcClient {
  if (!clientCache[network]) {
    clientCache[network] = new SuiJsonRpcClient({
      url: RPC_URLS[network],
      network,
    })
  }
  return clientCache[network]!
}
