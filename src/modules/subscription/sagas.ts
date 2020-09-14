import { Cast, Voting } from '@aragon/connect-voting'
import { loadCastsSuccess, LoadCastsSuccessAction } from 'modules/cast/actions'
import { loadVotesSuccess, LoadVotesSuccessAction } from 'modules/vote/actions'
import { Vote } from 'modules/vote/types'
import { aggregatedVote } from 'modules/vote/utils'
import { EventChannel, eventChannel } from 'redux-saga'
import { put, takeLatest, select, take, fork } from 'redux-saga/effects'
import { PayloadAction } from 'typesafe-actions/dist/types'
import {
  SUBSCRIBE_VOTE_REQUEST,
  SUBSCRIBE_VOTING_REQUEST,
  UNSUBSCRIBE_REQUEST,
  UnsubscribeRequestAction,
  SubscribeVotingRequestAction,
  SubscribeVoteRequestAction,
  unsubscribeFailure,
  unsubscribeSuccess,
  subscribeVoteFailure,
  subscribeVoteSuccess,
  subscribeVotingFailure,
  subscribeVotingSuccess
} from './actions'
import { getData } from './selectors'
import { Subscription } from './types'

export function* subscriptionSaga() {
  yield takeLatest(UNSUBSCRIBE_REQUEST, unsubscribe)
  yield takeLatest(SUBSCRIBE_VOTING_REQUEST, subscribeVoting)
  yield takeLatest(SUBSCRIBE_VOTE_REQUEST, subscribeVote)
}

function* unsubscribe(action: UnsubscribeRequestAction) {
  const subscriptions: string[] = []
  const errors: [string, string][] = []
  const data: Record<string, Subscription> = yield select(getData)

  for (const subscription of action.payload.subscriptions) {
    try {
      if (data[subscription]) {
        data[subscription].close()
      }
      subscriptions.push(subscription)
    } catch (e) {
      errors.push([ subscription, e.message ])
    }
  }

  if (subscriptions.length > 0) {
    yield put(unsubscribeSuccess(subscriptions))
  }

  if (errors.length > 0) {
    yield put(unsubscribeFailure(Object.fromEntries(errors)))
  }
}

function* subscribe(channel: EventChannel<PayloadAction<any, any>>) {
  try {
    while (true) {
      const action = yield take(channel)
      yield put(action)
    }
  } finally {
    // subscription terminated
  }
}

function createVotingSubscription(voting: Voting) {
  return eventChannel<LoadVotesSuccessAction>(emit => {
    return voting.onVotes({}, (_: null, votes: Vote[]) => {
      Promise.all(votes.map(aggregatedVote))
        .then((votes) => Object.fromEntries(votes.map(vote => [vote.id, vote])))
        .then((record) => emit(loadVotesSuccess(record)))
        .catch(console.error)
    }).unsubscribe
  })
}

function* subscribeVoting(action: SubscribeVotingRequestAction) {
  const data: Record<string, Subscription> = yield select(getData)
  const subscriptions: [string, Subscription][] = []
  const errors: [string, string][] = []

  for (const [id, voting] of Object.entries(action.payload)) {
    if (data[id]) {
      data[id].close()
    }

    try {
      const subscription = createVotingSubscription(voting)
      subscriptions.push([ id, subscription ])
      yield fork(subscribe, subscription)
    } catch (err) {
      errors.push([id, err.message])
    }
  }

  if (subscriptions.length > 0) {
    yield put(subscribeVotingSuccess(Object.fromEntries(subscriptions)))
  }

  if (errors.length > 0) {
    yield put(subscribeVotingFailure(Object.fromEntries(errors)))
  }
}

function createVoteSubscription(vote: Vote) {
  return eventChannel<LoadCastsSuccessAction>(emit => {
    return vote.onCasts({}, (_: null, casts: Cast[]) => {
      emit(loadCastsSuccess({ [vote.id]: casts }))
    }).unsubscribe
  })
}

function* subscribeVote(action: SubscribeVoteRequestAction) {
  const data: Record<string, Subscription> = yield select(getData)
  const subscriptions: [string, Subscription][] = []
  const errors: [string, string][] = []

  for (const [id, vote] of Object.entries(action.payload)) {
    if (data[id]) {
      data[id].close()
    }

    try {
      const subscription = createVoteSubscription(vote)
      yield fork(subscribe, subscription)
      subscriptions.push([ id, subscription ])
    } catch (err) {
      errors.push([id, err.message])
    }
  }

  if (subscriptions.length > 0) {
    yield put(subscribeVoteSuccess(Object.fromEntries(subscriptions)))
  }

  if (errors.length > 0) {
    yield put(subscribeVoteFailure(Object.fromEntries(errors)))
  }
}