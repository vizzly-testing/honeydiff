import { analyze, compare, imagesDiffer } from '../index.js';

let baseline = process.argv[2];
let current = process.argv[3];
if (!baseline || !current) {
  throw new Error('Usage: node examples/basic.js <baseline.png> <current.png>');
}
let options = { threshold: 2, antialiasing: true, minimumRegionPixels: 2 };
let result = await compare(baseline, current, options);

console.log(`Different: ${result.different}`);
console.log(`Changed: ${result.pixels.changed.total} / ${result.pixels.total}`);
console.log(`Regions: ${result.difference.regions.length}`);
console.log(
  `Boolean agrees: ${(await imagesDiffer(baseline, current, options)) === result.different}`
);

let detailed = await analyze(baseline, current, options);
console.log(`SSIM: ${detailed.perception.ssim.toFixed(4)}`);
console.log(`MS-SSIM: ${detailed.perception.msSsim.toFixed(4)}`);
console.log(`GMSD: ${detailed.perception.gmsd.toFixed(4)}`);
