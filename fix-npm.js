const fs = require('fs');
const path = require('path');

// List of files to check
const problematicFiles = [
  'node_modules/long/umd/index.js'
];

// Fixes to apply
const fixes = [
  {
    pattern: /catch\s*\{/g,
    replacement: 'catch (e) {'
  },
  // Add more patterns and replacements as needed
];

// Apply fixes
problematicFiles.forEach(filePath => {
  const fullPath = path.resolve(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  fixes.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
      console.log(`Applied fix (${pattern}) to ${filePath}`);
    }
  });
  
  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${filePath}`);
  } else {
    console.log(`No changes needed for ${filePath}`);
  }
});

console.log('Fixes applied. Please rebuild npm packages in the WeChat Developer Tools.'); 