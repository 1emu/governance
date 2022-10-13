import React, { useCallback, useState } from 'react'

import useFormatMessage from 'decentraland-gatsby/dist/hooks/useFormatMessage'
import TokenList from 'decentraland-gatsby/dist/utils/dom/TokenList'

import AddReaction from '../Icon/AddReaction'
import AngryEmoji from '../Icon/AngryEmoji'
import GreyX from '../Icon/GreyX'
import PartyEmoji from '../Icon/PartyEmoji'
import PokerFaceEmoji from '../Icon/PokerFaceEmoji'

import { Topic } from './SentimentSurvey'
import './SentimentSurveyRow.css'

interface Props {
  topic: Topic
  onReactionPicked: (topic: Topic, reaction: ReactionType) => void
  onReactionUnpicked: (topic: Topic) => void
}

export enum ReactionType {
  HAPPY = 'happy',
  INDIFFERENT = 'indifferent',
  ANGRY = 'angry',
  EMPTY = 'empty',
}

type ReactionView = { reaction: ReactionType; label: string; icon: JSX.Element }

const reactionViews: ReactionView[] = [
  { reaction: ReactionType.HAPPY, label: 'happy', icon: <PartyEmoji /> },
  { reaction: ReactionType.INDIFFERENT, label: 'indifferent', icon: <PokerFaceEmoji /> },
  { reaction: ReactionType.ANGRY, label: 'angry', icon: <AngryEmoji /> },
]

const SentimentSurveyRow = ({ topic, onReactionPicked, onReactionUnpicked }: Props) => {
  const t = useFormatMessage()
  const [showAddReaction, setShowAddReaction] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [pickedReaction, setPickedReaction] = useState<ReactionType | null>()
  const reactionPicked = pickedReaction != null

  const pickReaction = useCallback((reaction: ReactionType) => {
    setShowReactions(false)
    setPickedReaction(reaction)
    onReactionPicked(topic, reaction)
  }, [])

  const changeReaction = useCallback(() => {
    setPickedReaction(null)
    onReactionUnpicked(topic)
    setShowReactions(true)
    setShowAddReaction(true)
  }, [])

  return (
    <div
      className={TokenList.join(['SentimentSurveyRow', showAddReaction && 'SentimentSurveyRow__Expanded'])}
      onMouseEnter={() => !reactionPicked && setShowAddReaction(true)}
      onMouseLeave={() => setShowAddReaction(false)}
    >
      {t(`survey.survey_topics.${topic.label}`)}

      {!showReactions && !reactionPicked && (
        <div id="slide" className="SentimentSurveyRow__AddReaction" onClick={() => setShowReactions(true)}>
          <AddReaction />
          <span className={TokenList.join([showAddReaction && 'SentimentSurveyRow__AddReactionLabel'])}>
            {t(`survey.reactions.add_reaction`)}
          </span>
        </div>
      )}

      {showReactions && (
        <div className="SentimentSurveyRow__Reactions">
          {reactionViews.map((reactionView, index) => {
            return (
              <div key={`Reaction__${index}`} onClick={() => pickReaction(reactionView.reaction)}>
                {reactionView.icon}
              </div>
            )
          })}
          <div onClick={() => setShowReactions(false)}>
            <GreyX />
          </div>
        </div>
      )}

      {reactionPicked && (
        <div className="SentimentSurveyRow__Reactions SentimentSurveyRow__PickedReaction">
          {reactionViews.map((reactionView, index) => {
            return (
              pickedReaction === reactionView.reaction && (
                <div key={`Reaction__${index}`} onClick={() => changeReaction()}>
                  {reactionView.icon}
                </div>
              )
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SentimentSurveyRow