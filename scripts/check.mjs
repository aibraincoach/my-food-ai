// Never log provider responses, URLs, keys, or exception messages.
const required = ['MODEL_API_KEY', 'FDC_API_KEY', 'VERCEL_TOKEN', 'SUPABASE_DB_URL', 'SUPABASE_ACCESS_TOKEN', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY', 'APP_URL'];
for (const name of required) {
  if (!process.env[name]?.trim()) {
    console.log(`FAIL ${name} missing`);
    process.exit(1);
  }
  console.log(`PASS ${name}`);
}
async function check(name, work) {
  try {
    await work();
    console.log(`PASS ${name}`);
  } catch {
    console.log(`FAIL ${name} request_or_response_invalid`);
    process.exitCode = 1;
  }
}
async function get(url, headers = {}) {
  const response = await fetch(url, { headers, redirect: 'error', signal: AbortSignal.timeout(20000) });
  if (response.status !== 200) throw new Error('request failed');
  return response;
}
await check('MODEL_API', async () => {
  const base = (process.env.MODEL_API_BASE_URL || 'https://api.meta.ai/v1').replace(/\/$/, '');
  const response = await get(`${base}/models`, { Authorization: `Bearer ${process.env.MODEL_API_KEY}` });
  const payload = await response.json();
  const models = Array.isArray(payload.data) ? payload.data : [];
  if (!['muse-spark-1.3', 'sam-3.1'].every((id) => models.some((model) => model.id === id))) throw new Error('models absent');
});
await check('FDC_API', async () => {
  const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
  url.search = new URLSearchParams({ query: 'apple', pageSize: '1', api_key: process.env.FDC_API_KEY });
  await get(url);
});
await check('SUPABASE_REST', async () => {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '');
  await get(`${base}/rest/v1/`, { apikey: process.env.SUPABASE_SECRET_KEY });
});
