
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { address1, address2 } = await req.json();

    if (!address1 || !address2) {
      return NextResponse.json({ error: "Missing address1/address2" }, { status: 400 });
    }

    const apiKey = process.env.ATTOM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ATTOM_API_KEY not set" }, { status: 500 });
    }

    const url = new URL("https://api.developer.attomdata.com/propertyapi/v1.0.0/property/expandedprofile");
    url.searchParams.set("address1", address1);
    url.searchParams.set("address2", address2);

    const resp = await fetch(url.toString(), {
      method: "GET",
      headers: {
        apikey: apiKey,
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        { error: "ATTOM request failed", status: resp.status, details: text.slice(0, 400) },
        { status: 502 }
      );
    }

    const data = await resp.json();
    
    // Defensive normalization
    const p = data?.property?.[0] ?? data?.property ?? null;
    if (!p) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const apn = p?.identifier?.apn || p?.identifier?.apnOrig || p?.parcel?.apn || null;
    const county = p?.area?.countyName || p?.area?.countrySecSubdName || null;
    const taxYear = p?.assessment?.tax?.taxYear || p?.tax?.taxYear || null;
    const taxAmt = p?.assessment?.tax?.taxAmt || p?.tax?.taxAmt || null;
    const assessedTotal = p?.assessment?.assessed?.assdTtlValue || null;

    return NextResponse.json({
      ok: true,
      source: "ATTOM",
      apn,
      county,
      tax: { year: taxYear ? Number(taxYear) : null, annual: taxAmt ? Number(taxAmt) : null },
      assessed: { total: assessedTotal ? Number(assessedTotal) : null },
      rawAvailable: true,
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Server error", details: e?.message }, { status: 500 });
  }
}
