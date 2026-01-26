// Node.js script to extract missing Firestore index suggestions from emulator logs and update firestore.indexes.json
// Usage: node scripts/update-firestore-indexes.js emulator.log firestore.indexes.json

const fs = require('fs');
const logPath = process.argv[2];
const indexesPath = process.argv[3];
if (!logPath || !indexesPath) {
  console.error('Usage: node update-firestore-indexes.js <emulator-log-file> <firestore.indexes.json>');
  process.exit(1);
}

const log = fs.readFileSync(logPath, 'utf8');
const indexRegex = /Composite Index\s*\(([^)]+)\):\s*\n([\s\S]*?)(?=\n\n|$)/g;
const indexes = [];
let match;
while ((match = indexRegex.exec(log)) !== null) {
  const details = match[2].trim();
  // Extract JSON from suggested index block
  const jsonMatch = details.match(/fields:\s*([\s\S]*?)\n\s*queryScope: ([A-Z]+)/);
  if (jsonMatch) {
    const fieldsRaw = jsonMatch[1].replace(/\s+/g, ' ');
    const fields = fieldsRaw.split(',').map(f => {
      const [fieldPath, order] = f.trim().split(' ');
      return { fieldPath, order };
    });
    indexes.push({
      fields,
      queryScope: jsonMatch[2].trim()
    });
  }
}
if (indexes.length === 0) {
  console.log('No missing index suggestions found.');
  process.exit(0);
}

const indexesJson = JSON.parse(fs.readFileSync(indexesPath, 'utf8'));
indexes.forEach(idx => {
  // Avoid duplicates
  if (!indexesJson.indexes.some(existing => JSON.stringify(existing.fields) === JSON.stringify(idx.fields) && existing.queryScope === idx.queryScope)) {
    indexesJson.indexes.push(idx);
    console.log('Added index:', JSON.stringify(idx, null, 2));
  } else {
    console.log('Index already exists:', JSON.stringify(idx, null, 2));
  }
});
fs.writeFileSync(indexesPath, JSON.stringify(indexesJson, null, 2));
console.log('firestore.indexes.json updated.');
