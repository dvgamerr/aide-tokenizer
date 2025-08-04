import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'

// import { reminder } from '../../../provider/schema.js'
import { costCalculator } from './ai'

export default async ({ body }) => {
  if (!Bun.env.OPENAI_MODEL || !Bun.env.OPENAI_API_KEY) {
    throw new Error('OPENAI environment variable is required')
  }

  const model = new ChatOpenAI({
    maxTokens: 1000,
    model: Bun.env.OPENAI_MODEL,
    // temperature: 0.3,
    // topP: 0.8,
    // frequencyPenalty: 0.1,
    // presencePenalty: 0.1,
    streaming: false,
    temperature: 0.7,
    topP: 0.9,
  })

  const messages = [
    new SystemMessage(`
# Identity and Personality
- Female
- Polite
- Speak Thai language

# Objective:
- Summarize today's situation briefly and give clear, concise advice only when values are high.
- Since this will be done every day, keep it short to avoid being boring. 
- If the values are within the safe range, no need to mention.
- For health safety, PM2.5 and PM10 levels should be less than 37.5 micrograms per cubic meter, and no need to mention.
- Do not use new lines.

# Reference Data:
Today's PM2.5 and PM10 dust status based on data provided by users.
pm2_5: ... | pm10: ...
`),
    new HumanMessage((body.pm2_5 ? `pm2_5: ${body.pm2_5.join()}` : '') + (body.pm10 ? ` | pm10: ${body.pm10.join()}` : '')),
  ]

  const startTime = performance.now()
  const {
    content,
    response_metadata: { tokenUsage },
  } = await model.invoke(messages)

  const endTime = performance.now()
  const elapsed = parseFloat(((endTime - startTime) / 1000).toFixed(2))

  return {
    content,
    cost: costCalculator(tokenUsage),
    elapsed,
  }
}
