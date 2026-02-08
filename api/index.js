// Vercel serverless function wrapper for Express backend
// This file handles all /api/* requests via Vercel rewrite
import serverless from 'serverless-http';
import app from '../server/index.js';

// Pre-initialize the handler at module load time (not on first request)
// This allows Vercel to cache the initialized handler between requests
const handler = serverless(app, {
  binary: ['application/json', 'application/*json', 'image/*'],
});

// Vercel serverless function handler
// The rewrite /api/:path* -> /api/index.js should preserve the original path in req.url
export default async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Call the pre-initialized handler
    // This should be fast since handler is cached by Vercel
    const result = await handler(req, res);
    
    const duration = Date.now() - startTime;
    if (duration > 10000) {
      console.warn(`[API Handler] Slow request: ${req.method} ${req.url} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    console.error('[API Handler] Error:', error);
    console.error('[API Handler] Error details:', {
      message: error.message,
      stack: error.stack?.substring(0, 500), // Truncate stack for logs
      url: req.url,
      method: req.method,
      duration: Date.now() - startTime
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
