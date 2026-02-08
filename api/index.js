// Vercel serverless function wrapper for Express backend
// This file handles all /api/* requests via Vercel rewrite
import serverless from 'serverless-http';

// Lazy load the Express app to avoid slow initialization on cold starts
let app = null;
let handler = null;

async function getApp() {
  if (!app) {
    // Dynamically import the app only when needed
    const appModule = await import('../server/index.js');
    app = appModule.default;
    
    // Wrap Express app with serverless-http for Vercel compatibility
    handler = serverless(app, {
      binary: ['application/json', 'application/*json', 'image/*'],
    });
  }
  return handler;
}

// Vercel serverless function handler
// The rewrite /api/:path* -> /api/index.js should preserve the original path in req.url
export default async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Get the handler (lazy-loaded)
    const appHandler = await getApp();
    
    // Set timeout to prevent hanging (Vercel has 10s for Hobby, 60s for Pro)
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.error(`[API Handler] Timeout after ${Date.now() - startTime}ms for ${req.method} ${req.url}`);
        res.status(504).json({ 
          data: null, 
          error: 'Request timeout - function took too long to respond',
          timeout: true
        });
      }
    }, 55000); // 55 seconds (leave buffer for Vercel's 60s timeout)
    
    try {
      // Call the serverless handler
      const result = await appHandler(req, res);
      clearTimeout(timeout);
      
      const duration = Date.now() - startTime;
      if (duration > 5000) {
        console.warn(`[API Handler] Slow request: ${req.method} ${req.url} took ${duration}ms`);
      }
      
      return result;
    } catch (handlerError) {
      clearTimeout(timeout);
      throw handlerError;
    }
  } catch (error) {
    console.error('[API Handler] Error:', error);
    console.error('[API Handler] Error details:', {
      message: error.message,
      stack: error.stack,
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
