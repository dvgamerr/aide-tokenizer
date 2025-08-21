import numeral from 'numeral'

const oneMillion = 1000000
const costRatio = {
  'gpt-4o': { input: 2.5, output: 1.25 },
  'gpt-4o-mini': { input: 0.15, output: 0.075 },
  'gpt-5': { input: 1.25, output: 0.125 },
  'gpt-5-mini': { input: 0.25, output: 0.025 },
}

export const costCalculator = ({ completionTokens, promptTokens }) => {
  const ratio = costRatio[Bun.env.OPENAI_MODEL]

  return numeral((promptTokens / oneMillion) * ratio.input + (completionTokens / oneMillion) * ratio.output).value()
}
