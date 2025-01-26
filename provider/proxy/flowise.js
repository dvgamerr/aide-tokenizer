import pkg from '../../package.json'
const WAIT_QUOTA = 800

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const ANSWER = {
  SERVER_DOWN: {
    en: "I'm sorry, I can't help you right now.",
    th: 'ขอโทษค่ะ ไม่สามารถให้บริการในขณะนี้',
  },
}

export const flowisePrediction = async (sessionId, question, language = 'th', settings = {}) => {
  let quotaRetry = 3
  const { baseUrl, chatflowId, apiKey } = settings
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': `aide-${pkg.name}/${pkg.version}`,
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ chatId: sessionId, question }),
  }
  let result = { answer: ANSWER.SERVER_DOWN[language], language }
  while (quotaRetry > 0) {
    const completion = await fetch(`${baseUrl}/api/v1/prediction/${chatflowId}`, options).then((res) => res.json())
    if (!completion.error) {
      try {
        result = JSON.parse(completion.text)
      } catch {
        result = { answer: completion.text, language }
      }
      break
    }
    quotaRetry--
    await sleep(WAIT_QUOTA)
  }

  return result
}

export const flowiseDeleteSession = async (sessionId, settings = {}) => {
  const { baseUrl, chatflowId, apiKey } = settings
  const options = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': `aide-${pkg.name}/${pkg.version}`,
      Authorization: `Bearer ${apiKey}`,
    },
  }
  const url = `${baseUrl}/api/v1/chatmessage/${chatflowId}?chatflowid=${chatflowId}&chatId=${sessionId}&sessionId=${sessionId}`

  return await fetch(url, options).then((res) => res.json())
}
