import React, { useEffect, useMemo } from 'react'
import { ChainId, Network } from '@dcl/schemas'
import { useLocation } from '@gatsbyjs/reach-router'
import { toWei } from 'web3x/utils/units'
import { Header } from 'decentraland-ui/dist/components/Header/Header'
import { Button } from 'decentraland-ui/dist/components/Button/Button'
import { Loader } from 'decentraland-ui/dist/components/Loader/Loader'
import { Card } from 'decentraland-ui/dist/components/Card/Card'
import { Container } from 'decentraland-ui/dist/components/Container/Container'
import { Stats } from 'decentraland-ui/dist/components/Stats/Stats'
import { Mana } from 'decentraland-ui/dist/components/Mana/Mana'
import Navigation, { NavigationTab } from '../components/Layout/Navigation'
import Icon from 'semantic-ui-react/dist/commonjs/elements/Icon'

import VotingPower from '../components/Token/VotingPower'
import ActionableLayout from '../components/Layout/ActionableLayout'
import Link from 'decentraland-gatsby/dist/components/Text/Link'
import useAuthContext from 'decentraland-gatsby/dist/context/Auth/useAuthContext'
import useFeatureFlagContext from 'decentraland-gatsby/dist/context/FeatureFlag/useFeatureFlagContext'
import { FeatureFlags } from '../modules/features'
import useFormatMessage from 'decentraland-gatsby/dist/hooks/useFormatMessage'
import delay from 'decentraland-gatsby/dist/utils/promise/delay'
import { useBalanceOf, useWManaContract } from '../hooks/useContract'
import useAsyncTask from 'decentraland-gatsby/dist/hooks/useAsyncTask'
import useManaBalance from 'decentraland-gatsby/dist/hooks/useManaBalance'
import useEnsBalance from 'decentraland-gatsby/dist/hooks/useEnsBalance'
import useLandBalance from 'decentraland-gatsby/dist/hooks/useLandBalance'
import useEstateBalance from 'decentraland-gatsby/dist/hooks/useEstateBalance'
import useTransactionContext from 'decentraland-gatsby/dist/context/Auth/useTransactionContext'
import { isPending } from 'decentraland-dapps/dist/modules/transaction/utils'
import isEthereumAddress from 'validator/lib/isEthereumAddress'
import Head from 'decentraland-gatsby/dist/components/Head/Head'
import useDelegation from '../hooks/useDelegation'
import useVotingPowerBalance from '../hooks/useVotingPowerBalance'
import UserStats from '../components/User/UserStats'
import locations from '../modules/locations'
import Empty from '../components/Proposal/Empty'
import Paragraph from 'decentraland-gatsby/dist/components/Text/Paragraph'
import { snapshotUrl } from '../entities/Proposal/utils'
import useAsyncMemo from 'decentraland-gatsby/dist/hooks/useAsyncMemo'
import { Snapshot } from '../api/Snapshot'
import './balance.css'
import { isUnderMaintenance } from '../modules/maintenance'
import MaintenancePage from 'decentraland-gatsby/dist/components/Layout/MaintenancePage'
import LogIn from '../components/User/LogIn'
import DelegatedCard from '../components/Balance/DelegatedCard'

const NAME_MULTIPLIER = 100
const LAND_MULTIPLIER = 2000
const UNWRAPPING_TRANSACTION_ID = `unwrapping`
const SNAPSHOT_SPACE = process.env.GATSBY_SNAPSHOT_SPACE || ''
const BUY_MANA_URL = process.env.GATSBY_BUY_MANA_URL || '#'
const BUY_NAME_URL = process.env.GATSBY_BUY_NAME_URL || '#'
const BUY_LAND_URL = process.env.GATSBY_BUY_LAND_URL || '#'
const EDIT_DELEGATION = snapshotUrl(`#/delegate/${SNAPSHOT_SPACE}`)

export default function WrappingPage() {
  const t = useFormatMessage()
  const location = useLocation()
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const [account] = useAuthContext()
  const accountBalance = isEthereumAddress(params.get('address') || '') ? params.get('address') : account
  const getAuthText = (authText: String, defaultText: String): String => {
    return accountBalance === account ? authText : defaultText
  }
  const wManaContract = useWManaContract()
  const [ff] = useFeatureFlagContext()
  const [space] = useAsyncMemo(() => Snapshot.get().getSpace(SNAPSHOT_SPACE), [SNAPSHOT_SPACE])
  const [wMana, wManaState] = useBalanceOf(wManaContract, accountBalance, 'ether')
  const [mana, manaState] = useManaBalance(accountBalance, ChainId.ETHEREUM_MAINNET)
  const [maticMana, maticManaState] = useManaBalance(accountBalance, ChainId.MATIC_MAINNET)
  const [ens, ensState] = useEnsBalance(accountBalance, ChainId.ETHEREUM_MAINNET)
  const [land, landState] = useLandBalance(accountBalance, ChainId.ETHEREUM_MAINNET)
  const [estate, estateLand, estateState] = useEstateBalance(accountBalance, ChainId.ETHEREUM_MAINNET)
  const [delegation, delegationState] = useDelegation(accountBalance, SNAPSHOT_SPACE)
  const [votingPower, votingPowerState] = useVotingPowerBalance(accountBalance, SNAPSHOT_SPACE)
  const [transactions, transactionsState] = useTransactionContext()
  const [scores, scoresState] = useAsyncMemo(
    () =>
      Snapshot.get().getLatestScores(
        space!,
        delegation.delegatedFrom.map((delegation) => delegation.delegator)
      ),
    [space, delegation.delegatedFrom],
    { callWithTruthyDeps: true }
  )
  const delegatedVotingPower = useMemo(
    () => Object.values(scores || {}).reduce((total, current) => total + current, 0),
    [scores]
  )
  const unwrappingTransaction = useMemo(
    () => (transactions || []).find((tx) => tx.payload.id === UNWRAPPING_TRANSACTION_ID),
    [transactions]
  )
  const [unwrapping, unwrap] = useAsyncTask(async () => {
    if (!wManaContract || !wMana) {
      return
    }

    const amount = toWei(String(wMana), 'ether')
    const tx = await wManaContract.methods.withdraw(amount).send({})
    const hash = await tx.getTxHash()
    await delay(1000)
    transactionsState.add(hash, { id: UNWRAPPING_TRANSACTION_ID, amount })
  }, [wManaContract, wMana, transactionsState])

  useEffect(() => {
    let cancelled = false
    if (unwrappingTransaction) {
      setTimeout(() => {
        if (!cancelled) {
          manaState.reload()
          wManaState.reload()
        }
      }, 5000)
    }

    return () => {
      cancelled
    }
  }, [unwrappingTransaction?.status])

  if (isUnderMaintenance()) {
    return (
      <>
        <Head
          title={t('page.balance.title') || ''}
          description={t('page.balance.description') || ''}
          image="https://decentraland.org/images/decentraland.png"
        />
        <Navigation activeTab={NavigationTab.Wrapping} />
        <MaintenancePage />
      </>
    )
  }

  if (!account) {
    return <LogIn title={t('page.balance.title') || ''} description={t('page.balance.description') || ''} />
  }

  return (
    <>
      <Head
        title={t('page.balance.title') || ''}
        description={t('page.balance.description') || ''}
        image="https://decentraland.org/images/decentraland.png"
      />
      <Navigation activeTab={NavigationTab.Wrapping} />
      <Container className="VotingPowerSummary">
        <UserStats size="huge" className="VotingPowerProfile" address={accountBalance || account} />
        <Stats title={t(`page.balance.total_label`) || ''}>
          <VotingPower value={votingPower} size="huge" />
          <Loader
            size="small"
            className="balance"
            active={
              votingPowerState.loading ||
              manaState.loading ||
              wManaState.loading ||
              maticManaState.loading ||
              landState.loading ||
              estateState.loading
            }
          />
        </Stats>
      </Container>
      <Container className="VotingPowerDetail">
        <ActionableLayout
          className="ManaBalance"
          leftAction={<Header sub>{t(`page.balance.mana_label`)}</Header>}
          rightAction={
            <Button basic as={Link} href={BUY_MANA_URL}>
              {t(`page.balance.mana_action`)}
              <Icon name="chevron right" />
            </Button>
          }
        >
          <Card>
            <Card.Content>
              <Header>
                <b>{t(`page.balance.mana_title`)}</b>
              </Header>
              <Loader
                size="tiny"
                className="balance"
                active={manaState.loading || maticManaState.loading || wManaState.loading}
              />
              <Stats
                title={
                  (
                    <Mana inline network={Network.ETHEREUM}>
                      MANA
                    </Mana>
                  ) as any
                }
              >
                <VotingPower value={Math.floor(mana!)} size="medium" />
              </Stats>
              <Stats
                title={
                  (
                    <Mana inline network={Network.MATIC}>
                      MANA
                    </Mana>
                  ) as any
                }
              >
                <VotingPower value={Math.floor(maticMana!)} size="medium" />
              </Stats>
            </Card.Content>
            {wMana! > 0 && (
              <Card.Content style={{ flex: 0, position: 'relative' }}>
                <Stats title={t('page.balance.wrapped_balance_label') || ''}>
                  <VotingPower value={wMana!} size="medium" />
                </Stats>
                {account === accountBalance && (
                  <Button
                    basic
                    loading={unwrapping || (unwrappingTransaction?.status && isPending(unwrappingTransaction?.status!))}
                    onClick={() => unwrap()}
                    style={{ position: 'absolute', top: 0, right: 0, padding: '24px 20px 16px' }}
                  >
                    {t('page.balance.unwrap')}
                  </Button>
                )}
              </Card.Content>
            )}
          </Card>
        </ActionableLayout>
        <ActionableLayout
          className="LandBalance"
          leftAction={<Header sub>{t(`page.balance.land_label`)}</Header>}
          rightAction={
            <Button basic as={Link} href={BUY_LAND_URL} className="mobileOnly">
              {t(`page.balance.estate_action`)}
              <Icon name="chevron right" />
            </Button>
          }
        >
          <Card>
            <Card.Content>
              <Header>
                <b>{t(`page.balance.land_title`)}</b>
              </Header>
              <Loader size="tiny" className="balance" active={landState.loading} />
              <Stats title={t('page.balance.land_balance_label') || ''}>
                {t('page.balance.land_balance', { value: land })}
              </Stats>
              <Stats title={t('page.balance.land_total_label') || ''}>
                <VotingPower value={land! * LAND_MULTIPLIER} size="medium" />
              </Stats>
            </Card.Content>
          </Card>
        </ActionableLayout>
        <ActionableLayout
          className="EstateBalance"
          rightAction={
            <Button basic as={Link} href={BUY_LAND_URL} className="screenOnly">
              {t(`page.balance.estate_action`)}
              <Icon name="chevron right" />
            </Button>
          }
        >
          <Card>
            <Card.Content>
              <Header>
                <b>{t(`page.balance.estate_title`)}</b>
              </Header>
              <Loader size="tiny" className="balance" active={estateState.loading} />
              <Stats title={t(`page.balance.estate_balance_label`) || ''}>
                {t('page.balance.estate_balance', { value: estate })}
              </Stats>
              <Stats title={t(`page.balance.estate_land_label`) || ''}>
                {t('page.balance.estate_land', { value: estateLand })}
              </Stats>
              <Stats title={t(`page.balance.estate_total_label`) || ''}>
                <VotingPower value={estateLand * LAND_MULTIPLIER} size="medium" />
              </Stats>
            </Card.Content>
          </Card>
        </ActionableLayout>
        {ff.flags[FeatureFlags.Ens] && (
          <ActionableLayout
            className="NameBalance"
            leftAction={<Header sub>{t(`page.balance.name_label`)}</Header>}
            rightAction={
              <Button basic as={Link} href={BUY_NAME_URL}>
                {t(`page.balance.name_action`)}
                <Icon name="chevron right" />
              </Button>
            }
          >
            <Card>
              <Card.Content>
                <Header>
                  <b>{t(`page.balance.name_title`)}</b>
                </Header>
                <Loader size="tiny" className="balance" active={ensState.loading} />
                <Stats title={t('page.balance.name_balance_label') || ''}>
                  {t('page.balance.name_balance', { value: ens })}
                </Stats>
                <Stats title={t('page.balance.name_total_label') || ''}>
                  <VotingPower value={ens * NAME_MULTIPLIER} size="medium" />
                </Stats>
              </Card.Content>
            </Card>
          </ActionableLayout>
        )}

        {ff.flags[FeatureFlags.Delegation] && (
          <ActionableLayout
            leftAction={<Header sub>{t(`page.balance.delegated_to_label`)}</Header>}
            rightAction={
              <Button basic as={Link} href={EDIT_DELEGATION} className="mobileOnly">
                {t(`page.balance.delegated_to_action`)}
                <Icon name="chevron right" />
              </Button>
            }
          >
            <Card>
              <Card.Content>
                <Header>
                  <b>{getAuthText(t(`page.balance.delegated_to_title`), t(`page.balance.received_delegations`))}</b>
                </Header>
                <Loader size="tiny" className="balance" active={delegationState.loading || scoresState.loading} />
                <div className="ProfileListContainer">
                  {delegation.delegatedFrom.length > 0 &&
                    delegation.delegatedFrom.map((delegation) => {
                      return (
                        <div className="ProfileContainer">
                          <UserStats
                            sub={false}
                            key={[delegation.delegate, delegation.delegator].join('::')}
                            address={delegation.delegator}
                            size="medium"
                            to={locations.balance({ address: delegation.delegator })}
                          />
                          {scores && typeof scores[delegation.delegator.toLowerCase()] === 'number' && (
                            <VotingPower value={scores[delegation.delegator.toLowerCase()]} size="medium" />
                          )}
                        </div>
                      )
                    })}
                  {delegation.hasMoreDelegatedFrom && (
                    <Button disabled basic style={{ marginBottom: '2em' }}>
                      {t(`page.balance.delegated_to_more`)}
                    </Button>
                  )}
                </div>
                <Stats title={t('page.balance.name_total_label') || ''}>
                  <VotingPower value={delegatedVotingPower} size="medium" />
                </Stats>
              </Card.Content>
            </Card>
          </ActionableLayout>
        )}

        {ff.flags[FeatureFlags.Delegation] && (
          <DelegatedCard account={account} accountBalance={accountBalance} delegation={delegation} />
        )}
      </Container>
    </>
  )
}
