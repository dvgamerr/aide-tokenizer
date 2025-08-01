# Use the official Bun image
FROM oven/bun:alpine

# Set the working directory
WORKDIR /app

# Copy multiple files into the working directory
COPY drizzle.config.js package.json bun.lockb ./

# Copy entire directories into specific locations
COPY ./drizzle/ ./drizzle/
COPY ./provider/ ./provider/
COPY ./queue-receiver/ ./queue-receiver/

RUN bun i --ignore-scripts --production

EXPOSE 3000
CMD ["bun", "run", "/app/queue-receiver/index.js"]
