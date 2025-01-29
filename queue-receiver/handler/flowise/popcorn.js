import { sleep } from '../../provider/helper'
import { pgClient } from '../../../provider/db'
import { flowisePrediction } from '../../../provider/proxy/flowise'

const WAIT_QUOTA = 800
const clientConn = await pgClient()

const AIDE_API_KEY = Bun.env.AIDE_API_KEY
const ANSWER = {
  SERVER_DOWN: {
    EN: "I'm sorry, I can't help you right now.",
    TH: 'ขอโทษค่ะ ไม่สามารถให้บริการในขณะนี้',
  },
}

export default [
  async ({ headers, body }) => {
    let quotaRetry = 3
    const { chatId, question, chatType } = body
    const users = await clientConn.query(
      `
        SELECT u.language FROM users u
        INNER JOIN sessions s ON s.chat_id = u.chat_id AND s.notice_name = u.notice_name
        WHERE api_key = $1
      `,
      [headers['x-api-key']],
    )
    if (!users.rows.length) return new Response(null, { status: 401 })
    const language = users.rows[0].language === 'NA' ? 'EN' : users.rows[0].language

    let result = { answer: ANSWER.SERVER_DOWN[language], language }
    while (quotaRetry > 0) {
      const completion = await flowisePrediction(chatId, JSON.stringify({ type: chatType, question }))
      if (!completion.error) {
        try {
          result = JSON.parse(completion.text)
        } catch {
          result = { answer: completion.text }
        }
        break
      }
      quotaRetry--
      await sleep(WAIT_QUOTA)
    }
    if (users.rows[0].language === 'NA') {
      await clientConn.query(`UPDATE users SET language = $2 WHERE api_key = $1`, [headers['x-api-key'], result.language.toUpperCase()])
    }

    if (result.intent === 'END') {
      await clientConn.query(
        `
          UPDATE sessions s SET session_id = uuid_generate_v4()
          FROM users u WHERE s.chat_id = u.chat_id 
          AND s.notice_name = u.notice_name AND u.api_key = $1
        `,
        [headers['x-api-key']],
      )
    }

    return result
  },
  {
    beforeHandle({ headers, set }) {
      if (!headers['x-api-key'] || headers['x-secret-key'] != AIDE_API_KEY) {
        set.status = 400
        set.headers['WWW-Authenticate'] = `Bearer realm='sign', error="invalid_request"`

        return 'Unauthorized'
      }
    },
  },
]
