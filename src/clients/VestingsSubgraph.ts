import fetch from 'isomorphic-fetch'

import { VESTINGS_QUERY_ENDPOINT } from '../entities/Snapshot/constants'

import { SubgraphVesting } from './VestingSubgraphTypes'
import { trimLastForwardSlash } from './utils'

const OLDEST_INDEXED_BLOCK = 20463272

export class VestingsSubgraph {
  static Cache = new Map<string, VestingsSubgraph>()
  private readonly queryEndpoint: string

  static from(baseUrl: string) {
    baseUrl = trimLastForwardSlash(baseUrl)
    if (!this.Cache.has(baseUrl)) {
      this.Cache.set(baseUrl, new this(baseUrl))
    }

    return this.Cache.get(baseUrl)!
  }

  static get() {
    return this.from(this.getQueryEndpoint())
  }

  constructor(baseUrl: string) {
    this.queryEndpoint = baseUrl
  }

  private static getQueryEndpoint() {
    if (!VESTINGS_QUERY_ENDPOINT) {
      throw new Error(
        'Failed to determine vestings subgraph query endpoint. Please check VESTINGS_QUERY_ENDPOINT env is defined'
      )
    }
    return VESTINGS_QUERY_ENDPOINT
  }

  async getVesting(address: string): Promise<SubgraphVesting> {
    const query = `
    query getVesting($address: String!) {
      vestings(where: { id: $address }){
        id
        version
        duration
        cliff
        beneficiary
        revoked
        revocable
        released
        start
        periodDuration
        vestedPerPeriod
        paused
        pausable
        stop
        linear
        token
        owner
        total
        revokeTimestamp
        releaseLogs{
          id
          timestamp
          amount
        }
        pausedLogs{
          id
          timestamp
          eventType
        }
      }
    }
    `

    const variables = { address: address.toLowerCase() }
    const response = await fetch(this.queryEndpoint, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: variables,
      }),
    })

    const body = await response.json()
    return body?.data?.vestings[0] || {}
  }

  async getVestings(addresses?: string[]): Promise<SubgraphVesting[]> {
    const queryAddresses = addresses && addresses.length > 0
    const addressesQuery = queryAddresses
      ? `where: { id_in: $addresses }`
      : 'block: {number_gte: $blockNumber}, first: 1000'
    const addressesParam = queryAddresses ? `$addresses: [String]!` : '$blockNumber: Int!'
    const query = `
    query getVestings(${addressesParam}) {
      vestings(${addressesQuery}){
        id
        version
        duration
        cliff
        beneficiary
        revoked
        revocable
        released
        start
        periodDuration
        vestedPerPeriod
        paused
        pausable
        stop
        linear
        token
        owner
        total
        revokeTimestamp
        releaseLogs{
          id
          timestamp
          amount
        }
        pausedLogs{
          id
          timestamp
          eventType
        }
      }
    }
    `
    const variables = queryAddresses
      ? { addresses: addresses.map((address) => address.toLowerCase()) }
      : { blockNumber: OLDEST_INDEXED_BLOCK }
    const response = await fetch(this.queryEndpoint, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables,
      }),
    })

    const body = await response.json()
    return body?.data?.vestings || []
  }
}
