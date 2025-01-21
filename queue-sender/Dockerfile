# Use the official Bun image
FROM oven/bun:alpine

# Set the working directory
WORKDIR /app

# Copy multiple files into the working directory
COPY package.json bun.lockb ./

# Copy entire directories into specific locations
COPY ./provider/ ./provider/
COPY ./queue-sender/ ./queue-sender/

RUN bun i --ignore-scripts --production

EXPOSE 3000
CMD ["bun", "run", "/app/queue-sender/index.js"]
