# Use the official Bun image
FROM oven/bun:latest

# Set the working directory
WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install
COPY . .

EXPOSE 3000
CMD ["bun", "run", "./src/index.js"]
