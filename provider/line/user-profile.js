import { LINE_API } from '.'
import { logger } from '../config'

export default async (accessToken, userId) => {
  const response = await fetch(`${LINE_API}/profile/${userId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  })

  const responseData = await response.json()

  if (!response.ok) {
    logger.debug({
      response: {
        status: response.status,
        statusText: response.statusText,
      },
      responseData,
      userId,
    })
    throw new Error(`ไม่สามารถดึงข้อมูลโปรไฟล์ได้: ${response.statusText} (${response.status})`)
  }

  return responseData
}
