const ALLOWED_PARAMS = new Set(['ids[]', 'limit', 'minutesAfter', 'minutesBefore', 'mode', 'order']);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.PID_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  const upstreamUrl = new URL('https://api.golemio.cz/v2/pid/departureboards');

  for (const [key, value] of Object.entries(req.query)) {
    if (!ALLOWED_PARAMS.has(key)) continue;

    if (Array.isArray(value)) {
      value.forEach((item) => upstreamUrl.searchParams.append(key, String(item)));
    } else if (value !== undefined) {
      upstreamUrl.searchParams.append(key, String(value));
    }
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Access-Token': apiKey,
      },
    });

    const text = await upstreamResponse.text();
    const contentType =
      upstreamResponse.headers.get('content-type') ||
      'application/json; charset=utf-8';

    res.setHeader('content-type', contentType);
    const isScheduled = req.query.minutesBefore !== undefined;
    res.setHeader('cache-control', isScheduled
      ? 's-maxage=60, stale-while-revalidate=120'
      : 's-maxage=15, stale-while-revalidate=45'
    );
    return res.status(upstreamResponse.status).send(text);
  } catch {
    return res.status(502).json({ error: 'Upstream API unavailable.' });
  }
}
