# POST Logger

Small Node.js HTTP server that accepts POST requests and appends each request body as one JSON-encoded line in `requests.txt`.

## Run locally

```sh
node post_logger.js
```

The server listens on `0.0.0.0` and uses port `3000` by default. Override it with `PORT`:

```sh
PORT=3001 node post_logger.js
```

## Test

```sh
curl -X POST -d 'hello world' http://localhost:3000/
```

The request body is JSON-encoded so bodies containing newline characters still occupy exactly one line in `requests.txt`.

## Deploying

This works with Node.js web-service hosts such as Render or Railway. The server respects the host-provided `PORT` environment variable.

Note: many hosted platforms have ephemeral filesystems, so `requests.txt` may not survive restarts or redeploys. Use a database or persistent disk for durable storage.
