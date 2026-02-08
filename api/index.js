// Vercel serverless function wrapper for Express backend
// This file routes all /api/* requests to the Express app
import serverless from 'serverless-http';
import app from '../server/index.js';

// Wrap Express app with serverless-http for Vercel compatibility
const handler = serverless(app);

// Vercel serverless function handler
export default async (req, res) => {
  // The request path already includes /api prefix from Vercel rewrite
  // Express app expects /api/* paths, so this should work correctly
  return handler(req, res);
};
