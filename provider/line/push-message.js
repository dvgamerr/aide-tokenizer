import { LINE_API } from '.'
import { logger } from '../config'

export default async (accessToken, chatId, messages) => {
  const payload = {
    messages: prepareMessages(messages),
    to: chatId,
  }

  const response = await fetch(`${LINE_API}/message/push`, {
    body: JSON.stringify(payload),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  const responseData = await response.json()

  if (!response.ok) {
    logger.debug({
      payload,
      response: {
        status: response.status,
        statusText: response.statusText,
      },
      responseData,
    })
    throw new Error(`ไม่สามารถส่งข้อความได้: ${response.statusText} (${response.status})`)
  }

  return responseData
}

function prepareMessages(messages) {
  if (typeof messages === 'string') {
    return [{ text: messages, type: 'text' }]
  }

  return messages.map((message) => {
    if (!message.type) {
      return { ...message, type: 'text' }
    }
    return message
  })
}
