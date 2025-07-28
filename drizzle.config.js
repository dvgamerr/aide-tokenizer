import { defineConfig } from 'drizzle-kit'

console.log(process.env.PG_MAIN_URL)

export default defineConfig({
  dbCredentials: {
    url: process.env.PG_MAIN_URL,
  },
  dialect: 'postgresql',
  schema: './provider/schema.js',
})
