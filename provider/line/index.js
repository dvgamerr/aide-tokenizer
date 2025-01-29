export const LINE_API = 'https://api.line.me/v2/bot'
export const getChatId = (e) => (e.source.type === 'user' ? e.source.userId : e.source.groupId || e.source.roomId)
export const getUserId = (e) => e.source.userId
export const getType = (e) => (e.source.type === 'user' ? 'USER' : 'GROUP')
