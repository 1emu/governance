import { ethers } from 'ethers'
import isEthereumAddress from 'validator/lib/isEthereumAddress'

import { NOTIFICATIONS_SERVICE_ENABLED } from '../../constants'
import { ProposalAttributes } from '../../entities/Proposal/types'
import { proposalUrl } from '../../entities/Proposal/utils'
import { ErrorService } from '../../services/ErrorService'
import { ErrorCategory } from '../../utils/errorCategories'
import { isProdEnv } from '../../utils/governanceEnvs'
import { NotificationCustomType, NotificationType, getCaipAddress } from '../../utils/notifications'

import { CoauthorService } from './coauthor'

const PushAPI = NOTIFICATIONS_SERVICE_ENABLED ? require('@pushprotocol/restapi') : null

enum ENV {
  PROD = 'prod',
  STAGING = 'staging',
}

const CHAIN_ID = 5
const CHANNEL_ADDRESS = '0xBf363AeDd082Ddd8DB2D6457609B03f9ee74a2F1'
const PUSH_CHANNEL_OWNER_PK = process.env.PUSH_CHANNEL_OWNER_PK
const PUSH_API_URL = process.env.PUSH_API_URL
const pkAddress = `0x${PUSH_CHANNEL_OWNER_PK}`
const signer = NOTIFICATIONS_SERVICE_ENABLED ? new ethers.Wallet(pkAddress) : undefined
const NotificationIdentityType = {
  DIRECT_PAYLOAD: 2,
}

const areValidAddresses = (addresses: string[]) =>
  Array.isArray(addresses) && addresses.every((item) => isEthereumAddress(item))

export class NotificationService {
  static async sendNotification({
    type,
    title,
    body,
    recipient,
    url,
    customType,
  }: {
    type?: number
    title: string
    body: string
    recipient: string | string[] | undefined
    url: string
    customType: NotificationCustomType
  }) {
    if (!NOTIFICATIONS_SERVICE_ENABLED) {
      return
    }

    const response = await PushAPI.payloads.sendNotification({
      signer,
      type: this.getType(type, recipient),
      identityType: NotificationIdentityType.DIRECT_PAYLOAD,
      notification: {
        title,
        body,
      },
      payload: {
        title,
        body,
        cta: url,
        img: '',
        additionalMeta: {
          type: `0+${1}`, // TODO: Check what this means with Push team.
          data: JSON.stringify({
            customType,
          }),
        },
      },

      recipients: this.getRecipients(recipient),
      channel: getCaipAddress(CHANNEL_ADDRESS, CHAIN_ID),
      env: isProdEnv() ? ENV.PROD : ENV.STAGING,
    })

    return response.data
  }

  private static getType(type: number | undefined, recipient: string | string[] | undefined) {
    if (type) {
      return type
    }

    if (!recipient) {
      return NotificationType.BROADCAST
    }

    if (Array.isArray(recipient)) {
      return NotificationType.SUBSET
    }

    return NotificationType.TARGET
  }

  private static getRecipients(recipient: string | string[] | undefined) {
    if (!recipient) {
      return undefined
    }

    if (Array.isArray(recipient)) {
      return recipient.map((item: string) => getCaipAddress(item, CHAIN_ID))
    }

    return getCaipAddress(recipient, CHAIN_ID)
  }

  static async getUserFeed(address: string) {
    try {
      const response = await fetch(
        `${PUSH_API_URL}/apis/v1/users/${getCaipAddress(address, CHAIN_ID)}/channels/${getCaipAddress(
          CHANNEL_ADDRESS,
          CHAIN_ID
        )}/feeds`
      )

      return (await response.json()).feeds
    } catch (error) {
      throw new Error('Error getting user feed')
    }
  }

  static async proposalEnacted(proposal: ProposalAttributes) {
    try {
      const coauthors = await CoauthorService.getAllFromProposalId(proposal.id)
      const coauthorsAddresses = coauthors.length > 0 ? coauthors.map((coauthor) => coauthor.address) : []
      const addresses = [proposal.user, ...coauthorsAddresses]

      if (!areValidAddresses(addresses)) {
        throw new Error('Invalid addresses')
      }

      return await this.sendNotification({
        title: 'Grant Proposal Enacted',
        body: 'Congratulations! Your Grant Proposal has been successfully enacted and a Vesting Contract was added',
        recipient: addresses,
        url: proposalUrl(proposal.id),
        customType: NotificationCustomType.Grant,
      })
    } catch (error) {
      ErrorService.report('Error sending proposal enacted notification', {
        error,
        category: ErrorCategory.Notifications,
        proposal,
      })
    }
  }

  static async coAuthorRequested(proposal: ProposalAttributes, coAuthors: string[]) {
    try {
      if (!areValidAddresses(coAuthors)) {
        throw new Error('Invalid addresses')
      }

      return await this.sendNotification({
        title: 'Co-author Request Received',
        body: "You've been invited to collaborate as a co-author on a published proposal. Accept it or reject it here",
        recipient: coAuthors,
        url: proposalUrl(proposal.id),
        customType: NotificationCustomType.Proposal,
      })
    } catch (error) {
      ErrorService.report('Error sending co-author request notification', {
        error,
        category: ErrorCategory.Notifications,
        proposal,
      })
    }
  }

  static async votingEndedAuthors(proposal: ProposalAttributes) {
    try {
      const coauthors = await CoauthorService.getAllFromProposalId(proposal.id)
      const coauthorsAddresses = coauthors.length > 0 ? coauthors.map((coauthor) => coauthor.address) : []
      const addresses = [proposal.user, ...coauthorsAddresses]

      if (!areValidAddresses(addresses)) {
        throw new Error('Invalid addresses')
      }

      return await this.sendNotification({
        title: `Voting Ended on Your Proposal ${proposal.title}`,
        body: 'The votes are in! Find out the outcome of the voting on your proposal now.',
        recipient: addresses,
        url: proposalUrl(proposal.id),
        customType: NotificationCustomType.Proposal,
      })
    } catch (error) {
      ErrorService.report('Error sending voting ended notification to authors', {
        error,
        category: ErrorCategory.Notifications,
        proposal,
      })
    }
  }

  static async votingEndedVoters(proposal: ProposalAttributes, addresses: string[]) {
    try {
      if (!areValidAddresses(addresses)) {
        throw new Error('Invalid addresses')
      }

      return await this.sendNotification({
        title: 'Voting Ended on a Proposal You Voted On',
        body: 'Discover the results of the proposal you participated in as a voter. Your input matters!',
        recipient: addresses,
        url: proposalUrl(proposal.id),
        customType: NotificationCustomType.Proposal,
      })
    } catch (error) {
      ErrorService.report('Error sending voting ended notification to voters', {
        error,
        category: ErrorCategory.Notifications,
        proposal,
      })
    }
  }
}
