const fs = require('fs');
const path = './src/app/modules/dashboard/dashboard.service.js';
let content = fs.readFileSync(path, 'utf8');

// Replace the status logic in getAllAuctions
content = content.replace(
  /\.\.\.\(query\.status \? \{ status: query\.status \} : \{ status: \{ \$ne: "pending" \} \}\),/g,
  "...(query.status && query.status !== 'all' ? { status: query.status } : { status: { $ne: 'pending' } }),"
);

fs.writeFileSync(path, content);
console.log('Patched dashboard.service.js');
