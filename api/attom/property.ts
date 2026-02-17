
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * ATTOM Property Lookup Endpoint (Deployment Verification)
 * 
 * This route verifies that Vercel is correctly deploying serverless 
 * functions and handling /api paths.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Ensure response is always JSON to prevent HTML parsing errors on the client
  res.setHeader('Content-Type', 'application/json');

  // 1. Verify environment configuration
  if (!process.env.ATTOM_API_KEY) {
    return res.status(500).json({ error: "ATTOM_API_KEY not set" });
  }

  // 2. Validate request method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 3. Simple success response to prove route is reachable and live
  return res.status(200).json({ 
    ok: true, 
    message: "api route live" 
  });
}
