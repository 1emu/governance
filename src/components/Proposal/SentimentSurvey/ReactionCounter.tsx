import React from 'react'

import useFormatMessage from 'decentraland-gatsby/dist/hooks/useFormatMessage'

import { Reaction } from '../../../entities/SurveyTopic/types'
import { REACTION_LIST } from '../../../entities/SurveyTopic/utils'
import IconHelper from '../../Helper/IconHelper'

interface Props {
  reactionType: Reaction
  count: number
}

const ReactionCounter = ({ reactionType, count }: Props) => {
  const t = useFormatMessage()
  const reactionView = REACTION_LIST.find((reactionIcon) => reactionIcon.reaction === reactionType)
  if (!reactionView) {
    console.log(`Missing icon for reaction type ${reactionType}`)
    return null
  }

  return (
    <div className="ReactionCounter">
      <IconHelper
        text={t(`component.reaction_icon.${reactionView.reaction}`)}
        icon={reactionView.icon}
        position={'bottom center'}
      />
      <span className="ReactionCount"> {count}</span>
    </div>
  )
}

export default ReactionCounter
