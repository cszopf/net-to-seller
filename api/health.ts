import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Health Check Endpoint
 * Used to verify that Vercel is correctly deploying serverless functions
 * and that routing to the /api directory is functional.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  
  return res.status(200).json({
    ok: true,
    service: "net-to-seller",
    timestamp: new Date().toISOString()
  });
}
