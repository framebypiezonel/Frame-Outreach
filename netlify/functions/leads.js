// Shared backend for the Frame outreach pipeline.
// Stores one JSON document in Netlify Blobs so every device that opens
// the site reads and writes the same state instead of separate
// per-browser localStorage copies.
const { getStore } = require('@netlify/blobs');

const KEY = 'leads-v1';

// Netlify normally injects Blobs credentials into the function automatically.
// On some sites/plans that automatic wiring doesn't happen, so fall back to
// explicit config: SITE_ID is always present in the function environment;
// BLOBS_TOKEN is a Netlify personal access token you add as a site
// environment variable (Site configuration → Environment variables).
function makeStore() {
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
  const token = process.env.BLOBS_TOKEN;
  if (siteID && token) {
    return getStore({ name: 'frame-outreach', siteID, token });
  }
  return getStore('frame-outreach');
}

exports.handler = async (event) => {
  let store;
  try {
    store = makeStore();
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'blobs_not_configured',
        message: 'Set a BLOBS_TOKEN environment variable in Netlify (see README).',
      }),
    };
  }

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
