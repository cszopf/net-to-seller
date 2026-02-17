
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

    // Build the URL for the expanded profile API
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
    
    // Normalize data structure for the frontend
    const p = data?.property?.[0] ?? data?.property ?? null;
    if (!p) {
      return res.status(404).json({ error: "No property found at this address", data: null });
    }

    const apn = p?.identifier?.apn || p?.identifier?.apnOrig || p?.parcel?.apn || null;
    const county = p?.area?.countyName || p?.area?.countrySecSubdName || null;
    const taxYear = p?.assessment?.tax?.taxYear || p?.tax?.taxYear || null;
    const taxAmt = p?.assessment?.tax?.taxAmt || p?.tax?.taxAmt || null;
    const assessedTotal = p?.assessment?.assessed?.assdTtlValue || null;

    return res.status(200).json({ 
      ok: true, 
      source: "ATTOM",
      apn,
      county,
      tax: { year: taxYear ? Number(taxYear) : null, annual: taxAmt ? Number(taxAmt) : null },
      assessed: { total: assessedTotal ? Number(assessedTotal) : null }
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
