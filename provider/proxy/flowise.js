import pkg from '../../package.json'

const baseUrl = Bun.env.FLOWISE_API
const chatflowId = Bun.env.FLOWISE_ID
const apiKey = Bun.env.FLOWISE_KEY

export const flowisePrediction = async (chatId, question) => {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': `aide-${pkg.name}/${pkg.version}`,
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ chatId, question }),
  }

  return fetch(`${baseUrl}/api/v1/prediction/${chatflowId}`, options).then((res) => res.json())
}

export const flowiseDeleteSession = async (sessionId) => {
  const options = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': `aide-${pkg.name}/${pkg.version}`,
      Authorization: `Bearer ${apiKey}`,
    },
  }
  const url = `${baseUrl}/api/v1/chatmessage/${chatflowId}?chatflowid=${chatflowId}&chatId=${sessionId}&sessionId=${sessionId}`

  return fetch(url, options).then((res) => res.json())
}
