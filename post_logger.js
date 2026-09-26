#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);
const OUTPUT_FILE = process.env.OUTPUT_FILE || path.join(__dirname, 'requests.txt');

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'text/plain', Allow: 'POST' });
    res.end('Only POST requests are accepted.\n');
    return;
  }

  const chunks = [];

  req.on('data', (chunk) => chunks.push(chunk));

  req.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8');

    // JSON.stringify keeps each request on exactly one physical line,
    // even when the request body itself contains newline characters.
    const line = `${JSON.stringify(body)}\n`;

    fs.appendFile(OUTPUT_FILE, line, (error) => {
      if (error) {
        console.error('Failed to write request body:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Failed to write request body.\n');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Request body saved.\n');
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Invalid request.\n');
  });
});

server.listen(PORT, HOST, () => {
  console.log(`POST logger listening on http://${HOST}:${PORT}`);
  console.log(`Writing request bodies to ${OUTPUT_FILE}`);
});
