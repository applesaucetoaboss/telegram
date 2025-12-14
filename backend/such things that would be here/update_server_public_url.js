const fs = require('fs');
const path = require('path');

const target = path.resolve(__dirname, '../server.js');
let code = fs.readFileSync(target, 'utf8');

const oldCode = 'const PUBLIC_BASE_INFO = resolvePublicBase(process.env.PUBLIC_URL, process.env.PUBLIC_ORIGIN);';
const newCode = 'const PUBLIC_BASE_INFO = resolvePublicBase(process.env.PUBLIC_URL, process.env.PUBLIC_ORIGIN || process.env.RENDER_EXTERNAL_URL);';

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  fs.writeFileSync(target, code);
  console.log('server.js updated successfully');
} else {
  console.log('server.js already updated or pattern not found');
}
