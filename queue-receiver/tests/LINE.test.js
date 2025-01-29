import handlerHealth from '../handler/health'
import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'

describe('HTTP Response', () => {
  it('GET /_healthz', async () => {
    const app = new Elysia().get('/_healthz', handlerHealth)
    const data = await app.handle(new Request('http://localhost/_healthz')).then((res) => res.text())
    expect(data).toBe('☕')
  })
})
