export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { address1, address2 } = req.body || {};

    if (!address1 || !address2) {
      return res.status(400).json({ error: "Missing address" });
    }

    const apiKey = process.env.ATTOM_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "ATTOM_API_KEY not set" });
    }

    const url =
      "https://api.developer.attomdata.com/propertyapi/v1.0.0/property/expandedprofile" +
      `?address1=${encodeURIComponent(address1)}` +
      `&address2=${encodeURIComponent(address2)}`;

    const resp = await fetch(url, {
      headers: {
        apikey: apiKey,
        accept: "application/json",
      },
    });

    const text = await resp.text();

    if (!resp.ok) {
      return res.status(502).json({
        error: "ATTOM request failed",
        status: resp.status,
        details: text.slice(0, 500),
      });
    }

    const data = JSON.parse(text);

    return res.status(200).json({ ok: true, data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}