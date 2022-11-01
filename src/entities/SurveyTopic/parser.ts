import SurveyTopicModel from './model'
import { ReactionType, Survey, SurveyTopicAttributes, TopicFeedback } from './types'

const TOPIC_REACTION_CONCAT = ':'
const TOPIC_SEPARATOR = '|'

export class SurveyParser {
  static encode(survey: Survey): string {
    if (!survey || survey.length < 1) return ''

    let encoded = ''
    survey.forEach((topicFeedback, index) => {
      if (index > 0) encoded = encoded.concat(TOPIC_SEPARATOR)
      encoded = encoded.concat(topicFeedback.topic.topic_id + TOPIC_REACTION_CONCAT + topicFeedback.reaction)
    })
    return encoded
  }

  static async decode(encodedSurvey: string): Promise<Survey> {
    if (!encodedSurvey || encodedSurvey.length < 1) return []
    let buffer = encodedSurvey
    let lastTopic = false
    const survey: Survey = []
    while (!lastTopic) {
      const separatorPos = buffer.indexOf(TOPIC_SEPARATOR)
      if (separatorPos === -1) lastTopic = true
      const topicFeedback = buffer.substring(0, lastTopic ? buffer.length : separatorPos)
      survey.push(await SurveyParser.parseTopic(topicFeedback))
      buffer = buffer.substring(separatorPos + 1, buffer.length)
    }

    return survey
  }

  private static async parseTopic(topicFeedback: string): Promise<TopicFeedback> {
    const topicId = topicFeedback.substring(0, topicFeedback.indexOf(TOPIC_REACTION_CONCAT))
    const reaction = topicFeedback.substring(topicFeedback.indexOf(TOPIC_REACTION_CONCAT) + 1, topicFeedback.length)

    const topic = await SurveyTopicModel.findOne<SurveyTopicAttributes>({ id: topicId })
    if (!topic) {
      throw new Error(`Unable to parse topic feedback ${topicFeedback}`)
    }
    return {
      topic: { topic_id: topic.topic_id, label: topic.label },
      reaction: this.getReaction(reaction),
    }
  }

  private static getReaction(reaction: string) {
    if (this.isReactionType(reaction)) return reaction as ReactionType
    else throw new Error(`Unable to parse reaction ${reaction}`)
  }

  private static isReactionType(value: string | null | undefined): boolean {
    switch (value) {
      case ReactionType.EMPTY:
      case ReactionType.HAPPY:
      case ReactionType.INDIFFERENT:
      case ReactionType.ANGRY:
        return true
      default:
        return false
    }
  }
}
