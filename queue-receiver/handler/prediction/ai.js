import numeral from 'numeral'

const oneMillion = 1000000
const costRatio = {
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  o1: { input: 15.0, output: 60.0 },
  'o1-mini': { input: 1.1, output: 4.4 },
  'o3-mini': { input: 1.1, output: 4.4 },
}

export const costCalculator = ({ completionTokens, promptTokens }) => {
  const ratio = costRatio[Bun.env.OPENAI_MODEL]

  return numeral((promptTokens / oneMillion) * ratio.input + (completionTokens / oneMillion) * ratio.output).value()
}
