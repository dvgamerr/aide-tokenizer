import { LINE_API } from '.'
import { logger } from '../config'

export default async (accessToken, chatId, loadingSeconds) => {
  if (!chatId.match(/^U/)) {
    return // ถ้าไม่ใช่ user chat ให้หยุดทำงาน
  }

  const response = await fetch(`${LINE_API}/chat/loading/start`, {
    body: JSON.stringify({
      chatId,
      loadingSeconds,
    }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  const responseData = await response.json()

  if (!response.ok) {
    logger.warn({
      response: {
        status: response.status,
        statusText: response.statusText,
      },
      responseData,
    })
    throw new Error(`ไม่สามารถเริ่ม loading animation ได้: ${response.statusText} (${response.status})`)
  }

  return responseData
}
