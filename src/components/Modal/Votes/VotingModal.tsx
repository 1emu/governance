import React, { useMemo } from 'react'

import Paragraph from 'decentraland-gatsby/dist/components/Text/Paragraph'
import { Button } from 'decentraland-ui/dist/components/Button/Button'
import { Close } from 'decentraland-ui/dist/components/Close/Close'
import { Header } from 'decentraland-ui/dist/components/Header/Header'
import { Modal } from 'decentraland-ui/dist/components/Modal/Modal'

import { ProposalAttributes } from '../../../entities/Proposal/types'
import { formatChoice } from '../../../modules/votes/utils'
import { SelectedChoice } from '../../../pages/proposal'
import SentimentSurvey from '../../Proposal/SentimentSurvey'
import '../ProposalModal.css'

export type Feedback = {
  topic_id: string
  reaction_id: string
}

interface VotingModalProps {
  open: boolean
  proposal: ProposalAttributes
  selectedChoice: SelectedChoice
  onCastVote: (choiceIndex: number, feedback: Feedback[]) => void
  onClose: () => void
  castingVote: boolean
}

export function VotingModal({ open, onClose, proposal, selectedChoice, onCastVote, castingVote }: VotingModalProps) {
  const feedback = useMemo(() => [], [])

  if (!selectedChoice.choiceIndex || !selectedChoice.choice) {
    return null
  }

  return (
    <Modal size="tiny" className="VotingModal ProposalModal" open={open} closeIcon={<Close />} onClose={onClose}>
      <Modal.Content>
        <div className="ProposalModal__Title">
          <Header>{'We’d appreciate some extra feedback'}</Header>
          <Paragraph small>{`You're about to vote "${formatChoice(selectedChoice.choice)}"`}</Paragraph>
        </div>
        <SentimentSurvey proposal={proposal} />
        <div className="ProposalModal__Actions">
          <Button fluid primary onClick={() => onCastVote(selectedChoice.choiceIndex!, feedback)} loading={castingVote}>
            {'Cast Vote'}
          </Button>
        </div>
      </Modal.Content>
    </Modal>
  )
}
