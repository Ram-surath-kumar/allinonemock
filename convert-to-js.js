import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to convert TypeScript to JavaScript
function convertTSFile(content) {
  // Remove type annotations
  let converted = content;
  
  // Remove interface declarations
  converted = converted.replace(/export\s+interface\s+\w+[^{]*\{[^}]*\}/gs, '');
  converted = converted.replace(/interface\s+\w+[^{]*\{[^}]*\}/gs, '');
  
  // Remove type annotations from function parameters
  converted = converted.replace(/:\s*[A-Za-z0-9_<>|&\[\]{}?,\s]+(?=\s*[=,)\{])/g, '');
  
  // Remove type annotations from variables
  converted = converted.replace(/:\s*[A-Za-z0-9_<>|&\[\]{}?,\s]+(?=\s*[=;,\n])/g, '');
  
  // Remove 'as' type assertions
  converted = converted.replace(/\s+as\s+[A-Za-z0-9_<>|&\[\]{}?,\s]+/g, '');
  
  // Remove generic type parameters from function declarations
  converted = converted.replace(/<[^>]+>/g, '');
  
  // Remove ReactNode, ReactElement, etc. type imports
  converted = converted.replace(/import\s+.*\s+from\s+['"]react['"];?\s*\n/g, (match) => {
    if (match.includes('ReactNode') || match.includes('ReactElement') || match.includes('FC')) {
      return match.replace(/,\s*(ReactNode|ReactElement|FC|ComponentType)[,}]*/g, '');
    }
    return match;
  });
  
  // Remove type imports
  converted = converted.replace(/import\s+type\s+.*\n/g, '');
  
  // Change .tsx imports to .jsx
  converted = converted.replace(/from\s+['"]@\/([^'"]+)\.tsx['"]/g, "from '@/$1.jsx'");
  converted = converted.replace(/from\s+['"]@\/([^'"]+)\.ts['"]/g, "from '@/$1.js'");
  converted = converted.replace(/from\s+['"]\.\/([^'"]+)\.tsx['"]/g, "from './$1.jsx'");
  converted = converted.replace(/from\s+['"]\.\/([^'"]+)\.ts['"]/g, "from './$1.js'");
  converted = converted.replace(/from\s+['"]\.\.\/([^'"]+)\.tsx['"]/g, "from '../$1.jsx'");
  converted = converted.replace(/from\s+['"]\.\.\/([^'"]+)\.ts['"]/g, "from '../$1.js'");
  
  // Remove '!' non-null assertions
  converted = converted.replace(/!\s*([;,\)\]\}])/g, '$1');
  converted = converted.replace(/!\s*$/gm, '');
  
  return converted;
}

// Function to recursively find and convert files
function convertFiles(dir, extensions = ['.tsx', '.ts']) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other directories
      if (!['node_modules', '.git', 'dist', 'build', 'target'].includes(file)) {
        convertFiles(filePath, extensions);
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const converted = convertTSFile(content);
        
        // Create new file with .jsx or .js extension
        const newExt = ext === '.tsx' ? '.jsx' : '.js';
        const newPath = filePath.replace(ext, newExt);
        
        fs.writeFileSync(newPath, converted, 'utf8');
        console.log(`Converted: ${filePath} -> ${newPath}`);
      }
    }
  }
}

// Start conversion
const srcDir = path.join(__dirname, 'src');
console.log('Starting conversion of TypeScript files to JavaScript...');
convertFiles(srcDir);
console.log('Conversion complete!');

