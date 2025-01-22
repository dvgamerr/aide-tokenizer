const LINE_API = 'https://api.line.me/v2/bot'

export const getChatId = (e) => (e.source.type === 'user' ? e.source.userId : e.source.groupId || e.source.roomId)

export const preloadAnimation = async (accessToken, chatId, loadingSeconds) => {
  const res = await fetch(`${LINE_API}/chat/loading/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ chatId, loadingSeconds }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(data) || `Failed ${res.statusText} (${res.status})`)

  return data
}

export const pushMessage = async (accessToken, userId, message) => {
  const res = await fetch(`${LINE_API}/message/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: 'text', text: message }],
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.log({ res, data })
    throw new Error(data || `Failed ${res.statusText} (${res.status})`)
  }

  return data
}
export const userProfile = async (accessToken, userId) => {
  const res = await fetch(`${LINE_API}/profile/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const data = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(data) || `Failed ${res.statusText} (${res.status})`)

  return data
}
