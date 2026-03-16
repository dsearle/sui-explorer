import type { Network } from '../../lib/suiClient'
import { BlockstreamSkyline } from './BlockstreamSkyline'

interface Props {
  network: Network
}

export function ChainHero(props: Props) {
  return <BlockstreamSkyline {...props} />
}
