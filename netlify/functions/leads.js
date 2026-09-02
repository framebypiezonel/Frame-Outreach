// Shared backend for the Frame outreach pipeline.
// Stores one JSON document in Netlify Blobs so every device that opens
// the site reads and writes the same state instead of separate
// per-browser localStorage copies.
const { getStore } = require('@netlify/blobs');

const KEY = 'leads-v1';

exports.handler = async (event) => {
  const store = getStore('frame-outreach');

  if (event.httpMethod === 'GET') {
    const raw = await store.get(KEY);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: raw || JSON.stringify({ leads: [] }),
    };
  }

  if (event.httpMethod === 'PUT' || event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return { statusCode: 400, body: 'Invalid JSON' };
    }
    if (!body || !Array.isArray(body.leads)) {
      return { statusCode: 400, body: 'Expected { leads: [...] }' };
    }
    await store.set(KEY, JSON.stringify(body));
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  }

  return { statusCode: 405, body: 'Method not allowed' };
};
