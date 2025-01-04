# Elysia with Bun runtime

## Getting Started

To get started with this template, simply paste this command into your terminal:

```bash
bun create elysia ./elysia-example
```

## Development

To start the development server run:

```bash
docker run -d --name pgmq -e POSTGRES_PASSWORD=pgmq -p 5432:5432 quay.io/tembo/pgmq-pg:latest
bun run dev
```

Open http://localhost:3000/ with your browser to see the result.
