import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ ok: true, route: "/api/attom/property" });
}

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET" });
}