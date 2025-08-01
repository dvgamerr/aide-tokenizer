import { describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'

import handlerHealth from '../handler/health'

describe('Elysia', () => {
  it('GET /_healthz', async () => {
    const app = new Elysia().get('/_healthz', handlerHealth)
    const data = await app.handle(new Request('http://localhost/_healthz')).then((res) => res.text())
    expect(data).toBe('☕')
  })
})
