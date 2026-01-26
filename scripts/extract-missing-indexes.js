// Node.js script to extract Firestore missing index suggestions from emulator logs
// Usage: node scripts/extract-missing-indexes.js <emulator-log-file>

const fs = require('fs');
const path = process.argv[2];
if (!path) {
  console.error('Usage: node extract-missing-indexes.js <emulator-log-file>');
  process.exit(1);
}

const log = fs.readFileSync(path, 'utf8');
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
} else {
  console.log('Suggested indexes:');
  indexes.forEach(idx => {
    console.log(JSON.stringify(idx, null, 2));
  });
}
