const fs = require('fs');
const path = require('path');

function getFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = dir + '/' + file;
    if (fs.statSync(name).isDirectory()) {
      if (!name.includes('node_modules')) {
        getFiles(name, filesList);
      }
    } else {
      if (name.endsWith('.jsx') || name.endsWith('.js')) {
        filesList.push(name);
      }
    }
  }
  return filesList;
}

const files = getFiles('src');
for (const file of files) {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace constant declarations
  if (content.includes('const BACKEND = "http://localhost:5000"')) {
    content = content.replace(/const BACKEND = "http:\/\/localhost:5000";?/g, 'const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";');
    changed = true;
  }
  
  // Replace inline template string fetches
  if (content.includes('fetch(`http://localhost:5000')) {
    content = content.replace(/fetch\(`http:\/\/localhost:5000/g, 'fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}');
    changed = true;
  }
  
  // Replace inline string fetches
  if (content.includes('fetch("http://localhost:5000')) {
    content = content.replace(/fetch\("http:\/\/localhost:5000/g, 'fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}');
    content = content.replace(/"\)/g, '`)'); // E.g. /api/movies") -> /api/movies`)
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + file);
  }
}
