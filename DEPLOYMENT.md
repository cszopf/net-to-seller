# Vercel Deployment Guide

To ensure the Net to Seller API functions are correctly deployed and reachable, the following configuration must be maintained in the Vercel Dashboard.

## Project Settings

- **Framework Preset**: Other (or Vite)
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## API Routing Requirements

All serverless functions must be located in the `/api` directory at the project root.

1. `api/health.ts` - Used for runtime connectivity checks.
2. `api/attom/property.ts` - Main property data lookup.

## Verification Checklist

After every deployment, verify the following:

1. **Health Check**: Visit `https://your-domain.com/api/health`. It must return a `200 OK` JSON response.
2. **ATTOM Route**: `GET https://your-domain.com/api/attom/property` should return `405 Method Not Allowed`, **never** `404 Not Found`.
3. **Admin Banner**: Log in to the `/admin` area. If the "API routes are not deployed" banner appears, the serverless functions are not being picked up by Vercel.

## Troubleshooting 404s

If `/api` routes return 404:
- Ensure `vercel.json` is present at the root and contains the correct rewrites.
- Check that the `api/` folder is at the repository root and not nested inside `src/`.
- Verify the Vercel project's "Root Directory" is set to `./`.
