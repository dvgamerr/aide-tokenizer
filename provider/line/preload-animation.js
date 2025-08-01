import { LINE_API } from '.'
import { logger } from '../helper'

export default async (accessToken, chatId, loadingSeconds) => {
  // ตรวจสอบว่าเป็น user chat หรือไม่ (ต้องขึ้นต้นด้วย 'U')
  if (!chatId.match(/^U/)) {
    return // ถ้าไม่ใช่ user chat ให้หยุดทำงาน
  }

  // ส่งคำขอไปยัง LINE API เพื่อเริ่มแสดง loading animation
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

  // แปลงผลลัพธ์เป็น JSON
  const responseData = await response.json()

  // ตรวจสอบว่าคำขอสำเร็จหรือไม่
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
