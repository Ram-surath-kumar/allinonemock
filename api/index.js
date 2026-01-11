// Vercel serverless function wrapper for Express app
// This imports the Express app from server/index.js
// The app is configured to work both locally and on Vercel
import app from '../server/index.js';

// Export the Express app as a serverless function
export default app;

