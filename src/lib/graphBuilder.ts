import type { Node, Edge } from '@xyflow/react'
import type { SuiObjectResponse, DynamicFieldInfo } from '@mysten/sui/jsonRpc'

export interface GraphData {
  nodes: Node[]
  edges: Edge[]
}

/**
 * Extracts object IDs referenced in the object's fields (Move structs).
 * Recursively walks the content fields looking for 32-byte hex IDs.
 */
function extractReferencedIds(fields: Record<string, unknown>, parentId: string): string[] {
  const ids: string[] = []
  const idPattern = /^0x[a-fA-F0-9]{64}$/

  function walk(val: unknown) {
    if (typeof val === 'string' && idPattern.test(val) && val !== parentId) {
      ids.push(val)
    } else if (Array.isArray(val)) {
      val.forEach(walk)
    } else if (val && typeof val === 'object') {
      Object.values(val as Record<string, unknown>).forEach(walk)
    }
  }

  walk(fields)
  return [...new Set(ids)]
}

/**
 * Builds a React Flow graph from a Sui object + its dynamic fields.
 */
export function buildGraph(
  objectResponse: SuiObjectResponse,
  dynamicFields: DynamicFieldInfo[],
  referencedObjects: SuiObjectResponse[],
  onNodeClick: (id: string) => void,
  onTxClick?: (digest: string) => void
): GraphData {
  const nodes: Node[] = []
  const edges: Edge[] = []

  if (!objectResponse.data) return { nodes, edges }

  const obj = objectResponse.data
  const objectId = obj.objectId
  const shortId = (id: string) => `${id.slice(0, 6)}…${id.slice(-4)}`

  // --- Central object node ---
  nodes.push({
    id: objectId,
    type: 'objectNode',
    position: { x: 0, y: 0 },
    data: {
      label: shortId(objectId),
      fullId: objectId,
      nodeType: 'selected',
      typeLabel: obj.type ? obj.type.split('::').pop() ?? 'Object' : 'Object',
      onClick: onNodeClick,
    },
  })

  // --- Owner node ---
  const owner = obj.owner
  if (owner) {
    let ownerId = ''
    let ownerLabel = ''
    let ownerType: 'wallet' | 'parent' = 'wallet'

    if (owner === 'Immutable') {
      ownerId = `immutable-${objectId}`
      ownerLabel = 'Immutable'
      ownerType = 'wallet'
    } else if (typeof owner === 'object') {
      if ('AddressOwner' in owner) {
        ownerId = `owner-${owner.AddressOwner}`
        ownerLabel = `Wallet\n${shortId(owner.AddressOwner)}`
        ownerType = 'wallet'
      } else if ('ObjectOwner' in owner) {
        ownerId = owner.ObjectOwner
        ownerLabel = `Object\n${shortId(owner.ObjectOwner)}`
        ownerType = 'parent'
      } else if ('Shared' in owner) {
        ownerId = `shared-${objectId}`
        ownerLabel = 'Shared Object'
        ownerType = 'wallet'
      } else if ('ConsensusAddressOwner' in owner) {
        const consensusOwner = owner as { ConsensusAddressOwner: { owner: string } }
        ownerId = `owner-${consensusOwner.ConsensusAddressOwner.owner}`
        ownerLabel = `Consensus\n${shortId(consensusOwner.ConsensusAddressOwner.owner)}`
        ownerType = 'wallet'
      }
    }

    if (ownerId) {
      nodes.push({
        id: ownerId,
        type: 'objectNode',
        position: { x: -300, y: -150 },
        data: {
          label: ownerLabel,
          fullId: ownerType === 'parent' ? ownerId : undefined,
          nodeType: 'owner',
          typeLabel: ownerType === 'wallet' ? 'Owner' : 'Parent Object',
          onClick: ownerType === 'parent' ? onNodeClick : undefined,
        },
      })
      edges.push({
        id: `edge-owner-${ownerId}`,
        source: ownerId,
        target: objectId,
        label: 'owns',
        animated: true,
        style: { stroke: '#a78bfa' },
        labelStyle: { fill: '#a78bfa', fontSize: 11 },
      })
    }
  }

  // --- Previous transaction node ---
  if (obj.previousTransaction) {
    const txDigest = obj.previousTransaction
    const txId = `tx-${txDigest}`
    nodes.push({
      id: txId,
      type: 'objectNode',
      position: { x: 300, y: -150 },
      data: {
        label: `Tx\n${shortId(txDigest)}`,
        fullId: txDigest,
        nodeType: 'transaction',
        typeLabel: 'Transaction',
        onClick: onTxClick ? () => onTxClick(txDigest) : undefined,
      },
    })
    edges.push({
      id: `edge-tx-${txId}`,
      source: objectId,
      target: txId,
      label: 'last tx',
      style: { stroke: '#fb923c' },
      labelStyle: { fill: '#fb923c', fontSize: 11 },
    })
  }

  // --- Dynamic field nodes ---
  dynamicFields.forEach((field, i) => {
    const fieldNodeId = `dynfield-${field.objectId}`
    const angle = (i / Math.max(dynamicFields.length, 1)) * Math.PI * 2
    const radius = 280
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius + 200

    nodes.push({
      id: fieldNodeId,
      type: 'objectNode',
      position: { x, y },
      data: {
        label: field.name?.value
          ? String(field.name.value).slice(0, 12)
          : shortId(field.objectId),
        fullId: field.objectId,
        nodeType: 'dynamicField',
        typeLabel: 'Dynamic Field',
        onClick: onNodeClick,
      },
    })
    edges.push({
      id: `edge-dynfield-${field.objectId}`,
      source: objectId,
      target: fieldNodeId,
      label: 'dynamic field',
      style: { stroke: '#34d399' },
      labelStyle: { fill: '#34d399', fontSize: 11 },
    })
  })

  // --- Referenced object nodes from fields ---
  if (obj.content && 'fields' in obj.content) {
    const refIds = extractReferencedIds(
      obj.content.fields as Record<string, unknown>,
      objectId
    )

    referencedObjects.forEach((refObj, i) => {
      if (!refObj.data) return
      const refId = refObj.data.objectId
      if (nodes.find((n) => n.id === refId)) return // already in graph

      const x = -300 + i * 180
      const y = 250

      nodes.push({
        id: refId,
        type: 'objectNode',
        position: { x, y },
        data: {
          label: shortId(refId),
          fullId: refId,
          nodeType: 'reference',
          typeLabel: refObj.data.type?.split('::').pop() ?? 'Object',
          onClick: onNodeClick,
        },
      })
      edges.push({
        id: `edge-ref-${refId}`,
        source: objectId,
        target: refId,
        label: 'references',
        style: { stroke: '#94a3b8' },
        labelStyle: { fill: '#94a3b8', fontSize: 11 },
      })
    })

    // Prevent unused variable warning
    void refIds
  }

  return { nodes, edges }
}
