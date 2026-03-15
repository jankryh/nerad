export default async function handler(req, res) {
  const apiKey = process.env.PID_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'Missing PID_API_KEY environment variable on Vercel.',
    });
  }

  const upstreamUrl = new URL('https://api.golemio.cz/v2/pid/departureboards');

  for (const [key, value] of Object.entries(req.query)) {
    if (Array.isArray(value)) {
      value.forEach((item) => upstreamUrl.searchParams.append(key, String(item)));
    } else if (value !== undefined) {
      upstreamUrl.searchParams.append(key, String(value));
    }
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: req.method,
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
    res.setHeader('cache-control', 's-maxage=15, stale-while-revalidate=45');
    return res.status(upstreamResponse.status).send(text);
  } catch (error) {
    console.error('Vercel PID proxy failed:', error);
    return res.status(502).json({
      error: 'Failed to reach Golemio PID API.',
    });
  }
}
