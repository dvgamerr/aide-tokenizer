import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import dayjs from 'dayjs'
import { desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

import { logger } from '../../../provider/config'
import { lottery, lotteryPredict } from '../../../provider/schema'
import { InternalError } from '../../middleware'

// Define the structured output schema using Zod
const PredictionSchema = z.object({
  backThree: z.array(z.string().max(3)).describe('Back three digits predictions (000-999), max 4'),
  backTwo: z.array(z.string().max(2)).describe('Back two digits predictions (00-99), max 5'),
  draw: z.string().describe('draw date in YYYY-MM-DD format'),
  firstPrize: z.array(z.string().max(6)).describe('Six-digit number predictions (000000-999999), max 3'),
  frontThree: z.array(z.string().max(3)).describe('Front  digits predictions (000-999), max 4'),
})

const nextPrizeDate = (date) => {
  const today = date ? (typeof date === 'string' ? dayjs(date) : date) : dayjs()

  if (today.date() < 16) {
    return today.date(16)
  } else {
    return today.add(1, 'month').date(1)
  }
}

const getHistoryDate = () => {
  const round = []
  let date = nextPrizeDate(dayjs().add(-9, 'y'))
  let checkDay = -1
  while (checkDay < 0) {
    round.push(date.format('YYYY-MM-DD'))
    date = nextPrizeDate(date)
    checkDay = date.diff(dayjs(), 'day')
  }

  return round.reverse()
}

const fetchLottery = async (date) => {
  const res = await fetch(`https://api.thairath.co.th/tr-api/phalcon/api-lottery/history${date ? `?date=${date}` : ''}`, {
    headers: {
      accept: '*/*',
      'cache-control': 'public, max-age=60, must-revalidate',
      origin: 'https://www.thairath.co.th',
      referer: 'https://www.thairath.co.th/',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new InternalError(`thairath: ${text}`)
  }
  const { data } = await res.json()
  return data
}

export default async ({ db }) => {
  let history = getHistoryDate()

  const [last] = await db.select().from(lottery).orderBy(desc(lottery.createdAt)).limit(1)
  if (last) history = history.slice(0, history.indexOf(last.draw))

  while (history.length > 0) {
    const date = history.pop()
    let [prize] = await db.select().from(lottery).where(eq(lottery.draw, date))
    if (!prize) {
      const data = await fetchLottery(date)
      const lotteryData = data.map((e) => {
        history.splice(history.indexOf(e.str), 1)
        return {
          backThree: e.prizes['6'],
          backTwo: e.prizes['7'],
          createdAt: new Date(e.announceTs * 1000),
          draw: e.str,
          firstPrize: e.prizes['1'][0],
          frontThree: e.prizes['10'],
        }
      })
      prize = lotteryData[0]
      await db.insert(lottery).values(lotteryData).onConflictDoNothing({ target: lottery.draw })
    }
  }
  const model = new ChatOpenAI({
    maxTokens: 1000,
    model: Bun.env.OPENAI_MODEL,
    streaming: false,
  })

  history = getHistoryDate()

  const example = history.reverse().splice(0, history.length - 4)
  const stats = await db.select().from(lottery).where(inArray(lottery.draw, example))

  const messages = [
    new SystemMessage(`
## 📊 **ระบบทำนายหวยไทยด้วยสถิติ**

### 🎯 วิธีการทำนายที่ต้องทำตาม

คุณเป็น AI ที่เชี่ยวชาญในการวิเคราะห์ข้อมูลสถิติหวยไทย ให้ทำนายตัวเลขโดยใช้หลักการต่อไปนี้:

### 📈 การวิเคราะห์สถิติแบบละเอียด

**สำหรับรางวัลที่ 1 (6 หลัก):**
- วิเคราะห์ความถี่ของแต่ละตัวเลขในแต่ละตำแหน่ง (หลักแสน, หลักหมื่น, หลักพัน, หลักร้อย, หลักสิบ, หลักหน่วย)
- หาลวดลายตัวเลขที่ซ้ำกัน เช่น เลขคู่-คี่, เลขสูง-ต่ำ
- ตรวจสอบช่วงตัวเลขที่ออกบ่อย (000000-333333, 334000-666666, 667000-999999)

**สำหรับเลข 3 ตัวหน้า/หลัง:**
- ดูรูปแบบเลขที่มีตัวเลขซ้ำ (เช่น 111, 122, 100)
- เลือกเลขที่มีสัดส่วนคู่-คี่ที่สมดุล
- หลีกเลี่ยงเลข 3 ตัวที่เพิ่งออกใน 2 งวดล่าสุด

**สำหรับเลข 2 ตัวหลัง:**
- วิเคราะห์ความถี่ตัวเลข 00-99 จากประวัติศาสตร์
- เลือกเลขที่มีสถิติออกสูงแต่ไม่เพิ่งออกใน 1 งวดล่าสุด
- ใช้หลักสมดุลคู่-คี่ และสูง-ต่ำ (00-49 กับ 50-99)

### 📊 ข้อมูลประวัติศาสตร์

รูปแบบ: วันที่ - รางวัลที่1 | 3ตัวหน้า, 3ตัวหลัง | 2ตัวหลัง
${stats.map((e, i) => `${i + 1}. ${textPrize(e)}`).join('\n')}

`),
  ]

  // Bind the schema to the model using withStructuredOutput
  const modelWithStructure = model.withStructuredOutput(PredictionSchema)

  let elapsed = 0
  let correct = 0
  let roundTotal = history.length
  history.push(nextPrizeDate().format('YYYY-MM-DD'))
  console.log({ history })
  history = history.reverse()
  while (history.length > 0) {
    const nextDraw = history.pop()
    let [prize] = await db.select().from(lottery).where(eq(lottery.draw, nextDraw))
    messages.push(new SystemMessage(`please predict the next set of random numbers as of ${nextDraw}. `))

    const startTime = performance.now()
    const predict = await modelWithStructure.invoke(messages)
    messages.push(new AIMessage(`Predict: ${textPrize(predict)}`))
    elapsed += parseFloat((performance.now() - startTime) / 1000)

    logger.info(`draw: ${textPrize(predict)}`)

    if (!prize) {
      const percent = parseFloat(((correct / roundTotal) * 100).toFixed(0))
      logger.info(`Percent: ${percent}%`)
      return {
        elapsed: parseFloat(elapsed.toFixed(2)),
        percent,
        prediction: predict,
        success: true,
      }
    }

    const scoreSix = scorePrize(predict.firstPrize, [prize.firstPrize])
    const scoreFront = scorePrize(predict.frontThree, prize.frontThree)
    const scoreBack = scorePrize(predict.backThree, prize.backThree)
    const scoreTwo = scorePrize(predict.backTwo, prize.backTwo)

    const allIncorrect = !scoreSix && !scoreFront && !scoreBack && !scoreTwo
    const resultMessage = `
        ${scoreSix ? `6-digit is correct: ${scoreSix}` : ''}
        ${scoreFront ? `Front 3-digit is correct: ${scoreFront}` : ''}
        ${scoreBack ? `Back 3-digit is correct: ${scoreBack}` : ''}
        ${scoreTwo ? `Back 2-digit is correct: ${scoreTwo}` : ''}`
    if (!allIncorrect) {
      correct++

      await db.insert(lotteryPredict).values(predict).onConflictDoNothing({ target: lottery.draw })
      logger.info(resultMessage.trim())
    }

    messages.push(
      new HumanMessage(
        allIncorrect
          ? `No predictions were correct, and the correct results were ${textPrize(prize)}`
          : 'Results:\n' + resultMessage.trim(),
      ),
    )
  }

  return {
    elapsed: elapsed.toFixed(2),
    success: true,
  }
}
const textPrize = (e) =>
  `${e.draw} - ${typeof e.firstPrize === 'object' ? e.firstPrize.join(',') : e.firstPrize}|${e.frontThree.join(',')}|${e.backThree.join(',')}|${e.backTwo.join(',')}`
const scorePrize = (predict, prize = []) =>
  predict
    .map((e) => (prize.includes(e) ? e : null))
    .filter((e) => e)
    .join(',')
