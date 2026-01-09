const fs = require('fs');
const path = require('path');

// Find all route.ts files with dynamic params
function findRouteFiles(dir, files = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      // Check if directory contains brackets (dynamic route)
      if (item.name.includes('[') && item.name.includes(']')) {
        findRouteFiles(fullPath, files);
      } else if (!item.name.startsWith('.') && !item.name.startsWith('node_modules')) {
        findRouteFiles(fullPath, files);
      }
    } else if (item.name === 'route.ts' && dir.includes('[')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Fix a single route file
function fixRouteFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Pattern to match function signatures with params
  const patterns = [
    {
      // Match: { params }: { params: { someId: string } }
      regex: /\{ params \}: \{ params: \{ ([^}]+) \} \}/g,
      replacement: '{ params }: { params: Promise<{ $1 }> }'
    },
    {
      // After adding Promise, we need to await params
      regex: /(export async function (?:GET|POST|PUT|DELETE|PATCH)[^{]+\{[^}]*?)(\n\s*)(const session|try|if|const|let|var)/g,
      check: (content) => content.includes('{ params: Promise<'),
      replacement: (match, p1, p2, p3) => {
        if (!p1.includes('await params')) {
          return `${p1}${p2}const resolvedParams = await params${p2}${p3}`;
        }
        return match;
      }
    }
  ];
  
  // Apply first pattern
  if (!content.includes('{ params: Promise<')) {
    content = content.replace(patterns[0].regex, patterns[0].replacement);
    modified = true;
    
    // Extract param names
    const paramMatches = content.match(/{ params }: { params: Promise<{ ([^}]+) }>/);
    if (paramMatches) {
      const paramContent = paramMatches[1];
      const paramNames = paramContent.split(',').map(p => p.trim().split(':')[0]);
      
      // Replace direct params.X usage
      paramNames.forEach(paramName => {
        const paramRegex = new RegExp(`params\\.${paramName}(?![a-zA-Z0-9_])`, 'g');
        if (content.match(paramRegex)) {
          // Add await statement after params declaration
          content = content.replace(
            /(export async function (?:GET|POST|PUT|DELETE|PATCH)[^{]+\{[^}]*?\n)/,
            `$1  const { ${paramNames.join(', ')} } = await params\n`
          );
          
          // Replace params.X with just X
          paramNames.forEach(name => {
            content = content.replace(
              new RegExp(`params\\.${name}(?![a-zA-Z0-9_])`, 'g'),
              name
            );
          });
        }
      });
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

// Main execution
const apiDir = path.join(__dirname, 'app', 'api');
const routeFiles = findRouteFiles(apiDir);

console.log(`Found ${routeFiles.length} route files with dynamic params`);

let fixedCount = 0;
routeFiles.forEach(file => {
  if (fixRouteFile(file)) {
    fixedCount++;
  }
});

console.log(`\n✨ Fixed ${fixedCount} files`);