// Vercel serverless function wrapper for Express backend
// This file handles all /api/* requests via Vercel rewrite
import serverless from 'serverless-http';
import app from '../server/index.js';

// Wrap Express app with serverless-http for Vercel compatibility
const handler = serverless(app, {
  binary: ['application/json', 'application/*json', 'image/*'],
});

// Vercel serverless function handler
// The rewrite /api/:path* -> /api/index.js should preserve the original path in req.url
export default async (req, res) => {
  try {
    // Vercel's rewrite should preserve the original path in req.url
    // So /api/users should still be /api/users when it reaches Express
    // Log for debugging
    console.log(`[API Handler] ${req.method} ${req.url}`);
    
    // Call the serverless handler - this will route to Express
    // serverless-http handles the conversion between Vercel's req/res and Express
    return await handler(req, res);
  } catch (error) {
    console.error('[API Handler] Error:', error);
    console.error('[API Handler] Error details:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method
    });
    
    if (!res.headersSent) {
      res.status(500).json({ 
        data: null, 
        error: 'Internal server error in serverless function',
        message: error.message
      });
    }
    return res;
  }
};
