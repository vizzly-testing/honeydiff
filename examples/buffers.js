import fs from 'node:fs';
import { compare } from '../index.js';

let baseline = fs.readFileSync(process.argv[2] ?? 'baseline.png');
let current = fs.readFileSync(process.argv[3] ?? 'current.png');
let result = await compare(baseline, current);

console.log(`Different: ${result.different}`);
console.log(`Changed fraction: ${result.difference.fraction}`);
