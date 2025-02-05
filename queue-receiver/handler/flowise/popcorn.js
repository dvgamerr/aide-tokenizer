import { sleep } from '../../../provider/helper'
import { flowisePrediction } from '../../../provider/proxy/flowise'
const WAIT_QUOTA = 800

const AIDE_API_KEY = Bun.env.AIDE_API_KEY
const ANSWER = {
  SERVER_DOWN: {
    EN: "I'm sorry, I can't help you right now.",
    TH: 'ขอโทษค่ะ ไม่สามารถให้บริการในขณะนี้',
  },
}

export default [
  async ({ db, headers, body }) => {
    try {
      let quotaRetry = 3
      const { chatId, question, chatType } = body
      const users = await db.query(
        `
          SELECT u.language FROM line_users u
          INNER JOIN line_sessions s ON s.chat_id = u.chat_id AND s.notice_name = u.notice_name
          WHERE api_key = $1
        `,
        [headers['x-api-key']],
      )

      if (!users.rowCount) return new Response(null, { status: 401 })
      const language = users.rows[0].language === 'NA' ? 'EN' : users.rows[0].language

      const payload = JSON.stringify({ type: chatType, question, today: new Date().toISOString().substring(0, 10) })

      let result = { answer: ANSWER.SERVER_DOWN[language], language }
      while (quotaRetry > 0) {
        const completion = await flowisePrediction(chatId, payload)
        if (completion.error || completion.statusCode === 429) {
          quotaRetry--
          await sleep(WAIT_QUOTA)
          continue
        }
        try {
          result = JSON.parse(completion.text)
        } catch {
          result = { answer: completion.text }
        }
        break
      }
      if (language === 'NA') {
        await db.query(`UPDATE line_users SET language = $2 WHERE api_key = $1`, [headers['x-api-key'], result.language.toUpperCase()])
      }

      if (result.intention === 'RESET') {
        await db.query(
          `
            UPDATE line_sessions s SET session_id = uuid_generate_v4()
            FROM line_users u WHERE s.chat_id = u.chat_id 
            AND s.notice_name = u.notice_name AND u.api_key = $1
          `,
          [headers['x-api-key']],
        )
      }
      return result
    } catch (ex) {
      console.warn(ex)
      return new Response(ex.toString(), { status: 500 })
    }
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
