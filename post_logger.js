#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);
const OUTPUT_FILE = process.env.OUTPUT_FILE || path.join(__dirname, 'requests.txt');
const INDEX_FILE = path.join(__dirname, 'index.html');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

let requestCount = 0;
const geoCache = new Map();

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.headers['x-real-ip'] || req.socket.remoteAddress || 'unknown';
}

async function lookupGeo(ip) {
  if (geoCache.has(ip)) return geoCache.get(ip);

  const unknown = { country: 'unknown', region: 'unknown', city: 'unknown' };
  if (!ip || ip === 'unknown' || ip.startsWith('127.') || ip === '::1' || ip.startsWith('10.') || ip.startsWith('192.168.')) {
    return unknown;
  }

  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`);
    const data = await response.json();
    const geo = data.success === false ? unknown : {
      country: data.country || 'unknown',
      region: data.region || 'unknown',
      city: data.city || 'unknown',
    };
    geoCache.set(ip, geo);
    return geo;
  } catch (error) {
    console.error('IP geolocation lookup failed:', error.message);
    return unknown;
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    fs.readFile(INDEX_FILE, (error, html) => {
      if (error) {
        console.error('Failed to read index.html:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Failed to load the device info page.\n');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });
    return;
  }

  // Browser-based clients, including TurboWarp HTTP extensions, send this
  // preflight request before a cross-origin POST.
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, {
      ...corsHeaders,
      'Content-Type': 'text/plain',
      Allow: 'POST, OPTIONS',
    });
    res.end('Only POST requests are accepted.\n');
    return;
  }

  const chunks = [];

  req.on('data', (chunk) => chunks.push(chunk));

  req.on('end', async () => {
    const body = Buffer.concat(chunks).toString('utf8');
    const clientIp = getClientIp(req);
    const geo = await lookupGeo(clientIp);
    requestCount += 1;
    console.log(`Received POST #${requestCount} from ${clientIp} (${Buffer.byteLength(body, 'utf8')} bytes)`);

    // Record the proxy-provided IP and approximate IP geolocation before the raw browser data.
    const line = `\n--- request ---\nip=${clientIp}\ncountry=${geo.country}\nregion=${geo.region}\ncity=${geo.city}\n${body}\n`;

    fs.appendFile(OUTPUT_FILE, line, (error) => {
      if (error) {
        console.error('Failed to write request body:', error);
        res.writeHead(500, { ...corsHeaders, 'Content-Type': 'text/plain' });
        res.end('Failed to write request body.\n');
        return;
      }

      res.writeHead(200, { ...corsHeaders, 'Content-Type': 'text/plain' });
      res.end('Request body saved.\n');
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'text/plain' });
    res.end('Invalid request.\n');
  });
});

server.listen(PORT, HOST, () => {
  console.log(`POST logger listening on http://${HOST}:${PORT}`);
  console.log(`Writing request bodies to ${OUTPUT_FILE}`);
});
