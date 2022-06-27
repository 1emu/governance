const newrelic = require('newrelic')
import metricsDatabase from 'decentraland-gatsby/dist/entities/Database/routes'
import { databaseInitializer } from 'decentraland-gatsby/dist/entities/Database/utils'
import { Logger } from 'decentraland-gatsby/dist/entities/Development/logger'
import manager from 'decentraland-gatsby/dist/entities/Job/index'
import { jobInitializer } from 'decentraland-gatsby/dist/entities/Job/utils'
import metrics from 'decentraland-gatsby/dist/entities/Prometheus/routes'
import RequestError from 'decentraland-gatsby/dist/entities/Route/error'
import handle from 'decentraland-gatsby/dist/entities/Route/handle'
import { withBody, withCors, withDDosProtection, withLogs } from 'decentraland-gatsby/dist/entities/Route/middleware'
import { filesystem, status } from 'decentraland-gatsby/dist/entities/Route/routes'
import { initializeServices } from 'decentraland-gatsby/dist/entities/Server/handler'
import { serverInitializer } from 'decentraland-gatsby/dist/entities/Server/utils'
import express from 'express'

import admin from './entities/Admin/routes'
import committee from './entities/Committee/routes'
import { activateProposals, finishProposal } from './entities/Proposal/jobs'
import proposal from './entities/Proposal/routes'
import sitemap from './entities/Sitemap/routes'
import social from './entities/Social/routes'
import subscription from './entities/Subscription/routes'
import updates from './entities/Updates/routes'
import score from './entities/Votes/routes'

const jobs = manager()
jobs.cron('@eachMinute', activateProposals)
jobs.cron('@eachMinute', finishProposal)

const app = express()
app.set('x-powered-by', false)
app.use(withLogs())
app.use('/api', [
  status(),
  withDDosProtection(),
  withCors(),
  withBody(),
  committee,
  admin,
  proposal,
  score,
  subscription,
  updates,
  handle(async () => {
    throw new RequestError('NotFound', RequestError.NotFound)
  }),
])

app.use(metrics)
app.use(metricsDatabase)
app.get(
  '/metrics/*',
  handle(async () => {
    throw new RequestError('NotFound', RequestError.NotFound)
  })
)

app.use(sitemap)
app.use('/', social)
app.use(filesystem('public', '404.html'))

Logger.subscribe('error', (message: string, data: Record<string, any>) => {
  // console.log('we got an error in the logger subscription, this is good', message, data)
  // console.log("message", message)
  // console.log("data", ...data)
  // console.log("data string", JSON.stringify(data))
  // console.log("data json parse data to string", JSON.parse(data.toString()))
  newrelic.noticeError(new Error(message), data)
})

void initializeServices([
  process.env.DATABASE !== 'false' && databaseInitializer(),
  process.env.JOBS !== 'false' && jobInitializer(jobs),
  process.env.HTTP !== 'false' && serverInitializer(app, process.env.PORT || 4000, process.env.HOST),
])
