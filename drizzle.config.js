import { defineConfig } from 'drizzle-kit'

console.log(process.env.PG_MAIN_URL)

export default defineConfig({
  schema: './provider/schema.js',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.PG_MAIN_URL,
  },
})
