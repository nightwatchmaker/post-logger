# POST Logger

Small Node.js HTTP server that accepts POST requests and appends each request body as plaintext to `requests.txt`, with a newline after each request.

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

Opening `/` in a browser serves `index.html`. That page collects browser-visible device information and sends it to the same server as one plaintext POST.

The request body is written as-is, followed by one newline.

## Deploying

This works with Node.js web-service hosts such as Render or Railway. The server respects the host-provided `PORT` environment variable.

Note: many hosted platforms have ephemeral filesystems, so `requests.txt` may not survive restarts or redeploys. Use a database or persistent disk for durable storage.
