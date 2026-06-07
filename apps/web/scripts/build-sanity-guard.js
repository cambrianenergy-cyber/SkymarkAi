#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

function checkTsconfig(tsconfigPath, requiredAliases) {
  if (!fs.existsSync(tsconfigPath)) {
    console.error(`❌ Missing tsconfig: ${tsconfigPath}`);
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  const paths = config.compilerOptions && config.compilerOptions.paths;
  if (!paths) {
    console.error(`❌ No paths found in ${tsconfigPath}`);
    process.exit(1);
  }
  for (const alias in requiredAliases) {
    if (!paths[alias] || JSON.stringify(paths[alias]) !== JSON.stringify(requiredAliases[alias])) {
      console.error(`❌ Alias ${alias} is missing or incorrect in ${tsconfigPath}`);
      process.exit(1);
    }
  }
}

const rootTsconfig = path.join(__dirname, '..', 'tsconfig.json');
const webTsconfig = path.join(__dirname, 'apps', 'web', 'tsconfig.json');

const rootAliases = {
  '@/*': ['./*'],
  '@lib/*': ['lib/*']
};
const webAliases = {
  '@/*': ['./*'],
  '@lib/*': ['../lib/*'],
  '@workers/*': ['./workers/*']
};

checkTsconfig(rootTsconfig, rootAliases);
checkTsconfig(webTsconfig, webAliases);

console.log('✅ Build sanity guard: All aliases and configs are correct.');
