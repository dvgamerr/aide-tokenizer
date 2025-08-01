import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dbCredentials: {
    url: process.env.PG_MAIN_URL,
  },
  dialect: 'postgresql',
  schema: './provider/schema.js',
})
