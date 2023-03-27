import React from 'react'

import TokenList from 'decentraland-gatsby/dist/utils/dom/TokenList'

import { ChoiceColor } from '../../entities/Votes/types'

import './Progress.css'

interface Props {
  color: ChoiceColor
  progress: number
}

export default function Progress({ color, progress }: Props) {
  return (
    <div
      className={TokenList.join([
        'Progress',
        typeof color === 'string' && `Progress--${color}`,
        typeof color === 'number' && `Progress--status-${color % 8}`,
      ])}
    >
      <div className="Progress--bar" style={{ width: (progress || 0) + `%` }} />
    </div>
  )
}
