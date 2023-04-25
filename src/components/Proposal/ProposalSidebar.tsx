import React, { useMemo } from 'react'

import useAuthContext from 'decentraland-gatsby/dist/context/Auth/useAuthContext'

import { ProposalAttributes, ProposalStatus, ProposalType } from '../../entities/Proposal/types'
import { SubscriptionAttributes } from '../../entities/Subscription/types'
import { Survey } from '../../entities/SurveyTopic/types'
import { UpdateAttributes } from '../../entities/Updates/types'
import { isProposalStatusWithUpdates } from '../../entities/Updates/utils'
import { SelectedVoteChoice, Vote } from '../../entities/Votes/types'
import { ProposalPageState } from '../../pages/proposal'
import { ChoiceProgressProps } from '../Status/ChoiceProgress'

import ForumButton from './View/ForumButton'
import ProposalCoAuthorStatus from './View/ProposalCoAuthorStatus'
import ProposalDetailSection from './View/ProposalDetailSection'
import ProposalGovernanceSection from './View/ProposalGovernanceSection'
import ProposalThresholdsSummary from './View/ProposalThresholdsSummary'
import ProposalUpdatesActions from './View/ProposalUpdatesActions'
import SubscribeButton from './View/SubscribeButton'
import VestingContract from './View/VestingContract'

import ProposalActions from './ProposalActions'
import './ProposalSidebar.css'

type ProposalSidebarProps = {
  proposal: ProposalAttributes | null
  proposalLoading: boolean
  deleting: boolean
  proposalPageState: ProposalPageState
  updatePageState: (newState: Partial<ProposalPageState>) => void
  pendingUpdates?: UpdateAttributes[]
  nextUpdate?: UpdateAttributes
  currentUpdate?: UpdateAttributes | null
  castingVote: boolean
  castVote: (selectedChoice: SelectedVoteChoice, survey?: Survey | undefined) => void
  voteWithSurvey: boolean
  updatingStatus: boolean
  subscribing: boolean
  subscribe: (subscribe?: boolean) => void
  subscriptions: SubscriptionAttributes[] | null
  subscriptionsLoading: boolean
  partialResults: ChoiceProgressProps[]
  votes: Record<string, Vote> | null
  votesLoading: boolean
  choices: string[]
  isOwner: boolean
  isCoauthor: boolean
}

export default function ProposalSidebar({
  proposal,
  proposalLoading,
  proposalPageState,
  updatePageState,
  deleting,
  pendingUpdates,
  nextUpdate,
  currentUpdate,
  castingVote,
  castVote,
  voteWithSurvey,
  updatingStatus,
  subscribing,
  subscribe,
  subscriptions,
  subscriptionsLoading,
  partialResults,
  votes,
  votesLoading,
  choices,
  isOwner,
  isCoauthor,
}: ProposalSidebarProps) {
  const [account] = useAuthContext()
  const subscribed = useMemo(
    () => !!account && !!subscriptions && !!subscriptions.find((sub) => sub.user === account),
    [account, subscriptions]
  )

  const handleVoteClick = (selectedChoice: SelectedVoteChoice) => {
    if (voteWithSurvey) {
      updatePageState({
        selectedChoice: selectedChoice,
        showVotingModal: true,
      })
    } else {
      castVote(selectedChoice)
    }
  }

  const showProposalUpdatesActions =
    isProposalStatusWithUpdates(proposal?.status) && proposal?.type === ProposalType.Grant && (isOwner || isCoauthor)
  const showProposalThresholdsSummary = !!(
    proposal &&
    proposal?.required_to_pass !== null &&
    proposal?.required_to_pass >= 0 &&
    !(proposal.status === ProposalStatus.Passed)
  )

  return (
    <>
      {!!proposal?.vesting_address && <VestingContract vestingAddress={proposal.vesting_address} />}
      {proposal && <ProposalCoAuthorStatus proposalId={proposal.id} proposalFinishDate={proposal.finish_at} />}
      <div className="ProposalSidebar">
        {showProposalUpdatesActions && proposal && (
          <ProposalUpdatesActions
            nextUpdate={nextUpdate}
            currentUpdate={currentUpdate}
            pendingUpdates={pendingUpdates}
            proposal={proposal}
          />
        )}
        <ProposalGovernanceSection
          disabled={!proposal || !votes}
          loading={proposalLoading || votesLoading}
          proposal={proposal}
          votes={votes}
          partialResults={partialResults}
          choices={choices}
          voteWithSurvey={voteWithSurvey}
          castingVote={castingVote}
          onChangeVote={(_, changing) => updatePageState({ changingVote: changing })}
          onVote={handleVoteClick}
          updatePageState={updatePageState}
          proposalPageState={proposalPageState}
        />
        {showProposalThresholdsSummary && (
          <ProposalThresholdsSummary proposal={proposal} partialResults={partialResults} />
        )}
        {proposal && <ProposalDetailSection proposal={proposal} />}
        <ForumButton loading={proposalLoading} proposal={proposal} />
        <SubscribeButton
          loading={proposalLoading || subscriptionsLoading || subscribing}
          disabled={!proposal}
          subscribed={subscribed}
          onClick={() => subscribe(!subscribed)}
        />
        {proposal && (
          <ProposalActions
            proposal={proposal}
            deleting={deleting}
            updatingStatus={updatingStatus}
            updatePageState={updatePageState}
          />
        )}
      </div>
    </>
  )
}