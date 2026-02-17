
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  try {
    const { address1, address2 } = req.body || {};
    if (!address1 || !address2) {
      return res.status(400).json({ status: "error", message: "Missing address1 or address2" });
    }

    const apiKey = process.env.ATTOM_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ status: "error", message: "ATTOM_API_KEY not set" });
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

    // Attempt 1: Strict Normalized
    let p = await queryAttom(address1, address2);

    // Attempt 2: Smart Retry (Mt -> Mount)
    if (!p && address1.toLowerCase().includes(" mt ")) {
      const retryAddress1 = address1.replace(/ mt /i, " Mount ");
      p = await queryAttom(retryAddress1, address2);
    }

    if (!p) {
      return res.status(404).json({ status: "error", source: "attom", message: "Property data unavailable. Enter details manually." });
    }

    // Comprehensive Mapping Logic
    const identifier = p.identifier || {};
    const assessment = p.assessment || {};
    const tax = assessment.tax || p.tax || {};
    const building = p.building || {};
    const rooms = building.rooms || {};
    const size = building.size || {};
    const summary = p.summary || building.summary || {};
    const lot = p.lot || {};
    const area = p.area || {};

    const result = {
      ok: true,
      source: "ATTOM",
      apn: identifier.apn || identifier.apnOrig || p.parcel?.apn || null,
      county: area.countyName || area.countrySecSubdName || null,
      sellerName: assessment.owner?.ownerName1 || null,
      tax: {
        annual: tax.taxAmt ? Number(tax.taxAmt) : null,
        year: tax.taxYear ? Number(tax.taxYear) : null,
        isHomestead: !!tax.homesteadExemp
      },
      snapshot: {
        beds: rooms.bedsCount || null,
        baths: rooms.bathsTotal || rooms.bathsFull || null,
        sqft: size.livingSize || size.bldgSize || size.absTotalSize || null,
        yearBuilt: summary.yearBuilt || null,
        propertyType: summary.propClass || summary.propSubType || null,
        lotSize: lot.lotSizeInSQFT || null
      },
      assessed: {
        total: assessment.assessed?.assdTtlValue || null
      }
    };

    return res.status(200).json(result);
  } catch (e: any) {
    return res.status(500).json({ status: "error", message: "Internal Server Error", details: e.message });
  }
}
