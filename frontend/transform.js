import fs from 'fs';
import * as esbuild from 'esbuild';

const tsxCode = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const result = esbuild.transformSync(tsxCode, {
  loader: 'tsx',
  jsx: 'preserve'
});

fs.writeFileSync('src/pages/Dashboard.jsx', result.code);
console.log('Successfully transpiled Dashboard.tsx to Dashboard.jsx');
