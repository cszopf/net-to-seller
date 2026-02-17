
export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { address1, address2 } = req.body || {};

    if (!address1 || !address2) {
      return res.status(400).json({ error: "Missing address1 or address2" });
    }

    const apiKey = process.env.ATTOM_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "ATTOM_API_KEY not set" });
    }

    const endpoints = [
      "https://api.developer.attomdata.com/propertyapi/v1.0.0/property/expandedprofile",
      "https://api.developer.attomdata.com/propertyapi/v1.0.0/property/detail",
      "https://api.developer.attomdata.com/propertyapi/v1.0.0/property/basicprofile"
    ];

    async function queryAttom(a1: string, a2: string) {
      for (const baseUrl of endpoints) {
        try {
          const url = new URL(baseUrl);
          url.searchParams.set("address1", a1);
          url.searchParams.set("address2", a2);

          const resp = await fetch(url.toString(), {
            headers: {
              apikey: apiKey!,
              accept: "application/json",
            },
          });

          if (resp.ok) {
            const data = await resp.json();
            const p = data?.property?.[0] ?? data?.property ?? null;
            if (p) return p;
          }
        } catch (e) {
          console.error(`Error querying ${baseUrl}:`, e);
        }
      }
      return null;
    }

    // Attempt 1: Normalized Address
    let property = await queryAttom(address1, address2);

    // Attempt 2: Smart Retry (Mt -> Mount)
    if (!property && address1.toLowerCase().includes(" mt ")) {
      const retryAddress1 = address1.replace(/ mt /i, " Mount ");
      property = await queryAttom(retryAddress1, address2);
    }

    if (!property) {
      return res.status(404).json({ error: "Property data unavailable. Enter details manually." });
    }

    // Improved Data Normalization
    const apn = property?.identifier?.apn || property?.identifier?.apnOrig || property?.parcel?.apn || null;
    const county = property?.area?.countyName || property?.area?.countrySecSubdName || null;
    const taxYear = property?.assessment?.tax?.taxYear || property?.tax?.taxYear || null;
    const taxAmt = property?.assessment?.tax?.taxAmt || property?.tax?.taxAmt || null;
    const assessedTotal = property?.assessment?.assessed?.assdTtlValue || null;

    return res.status(200).json({ 
      ok: true, 
      source: "ATTOM",
      apn,
      county,
      tax: { 
        year: taxYear ? Number(taxYear) : null, 
        annual: taxAmt ? Number(taxAmt) : null 
      },
      assessed: { total: assessedTotal ? Number(assessedTotal) : null },
      normalizedSent: { address1, address2 }
    });
  } catch (e: any) {
    return res.status(500).json({ error: "Internal Server Error", details: e.message });
  }
}
