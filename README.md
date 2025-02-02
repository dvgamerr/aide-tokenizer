# Aide Tokenizer

This project consists of two main components: `queue-sender` and `queue-receiver`. These components work together to handle message queuing and processing.

## Initialization

To initialize the database, run the following command:

```sh
goose up
```

## Environment Variables

- `PORT`: The port on which the server will run (default: 3000).

## Setup

1. Ensure you have PostgreSQL installed and running.
2. Create the necessary tables by running the `queue-receiver` script.
3. Start the `queue-sender` script to begin processing messages.
4. Start the `queue-receiver` server to handle incoming messages.

## Usage

- Send a POST request to `/:channel/:bot_name` with the appropriate message body to queue a message.
- Use the `/id` and `/raw` commands within the message body to get specific responses.
