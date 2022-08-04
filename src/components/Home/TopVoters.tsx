import React from 'react'

import useFormatMessage from 'decentraland-gatsby/dist/hooks/useFormatMessage'
import { Card } from 'decentraland-ui/dist/components/Card/Card'
import { Header } from 'decentraland-ui/dist/components/Header/Header'
import { Table } from 'decentraland-ui/dist/components/Table/Table'

import useTopVoters from '../../hooks/useTopVoters'

import './TopVoters.css'
import TopVotersRow from './TopVotersRow'

const createRow = ({ address, votes }: { address: string; votes: number }, idx: number) => {
  return <TopVotersRow key={idx} address={address} votes={votes} rank={idx + 1} />
}

const now = new Date()
const start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDay())

function TopVoters() {
  const t = useFormatMessage()
  const { topVoters } = useTopVoters(start, now, 5)
  return (
    <Card className="TopVoters">
      <Table basic="very" unstackable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>
              <Header sub>{t('page.home.community_engagement.top_voters')}</Header>
            </Table.HeaderCell>
            <Table.HeaderCell textAlign="center">
              <Header sub>{t('page.home.community_engagement.Votes')}</Header>
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>{topVoters.map(createRow)}</Table.Body>
      </Table>
    </Card>
  )
}

export default TopVoters
