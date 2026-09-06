import {
  analyze,
  type CompareOptions,
  compare,
  computeFingerprintSync,
  type DiffAnalysis,
  imagesDiffer,
} from '../index.js';

let options: CompareOptions = {
  threshold: 2,
  antialiasing: true,
  minimumRegionPixels: 2,
};
let result: DiffAnalysis = await compare('baseline.png', 'current.png', options);

console.log(`${result.pixels.changed.total} changed pixels`);
console.log(`${result.difference.regions.length} exact regions`);
console.log(
  `boolean agrees: ${(await imagesDiffer('baseline.png', 'current.png', options)) === result.different}`
);
console.log(`fingerprint: ${computeFingerprintSync(result)?.hash ?? 'identical'}`);

let detailed = await analyze('baseline.png', 'current.png', options);
console.log(`SSIM ${detailed.perception.ssim}, MS-SSIM ${detailed.perception.msSsim}`);
