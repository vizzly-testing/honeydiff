# @vizzly-testing/honeydiff

[![npm version](https://img.shields.io/npm/v/@vizzly-testing/honeydiff.svg)](https://www.npmjs.com/package/@vizzly-testing/honeydiff)
[![npm downloads](https://img.shields.io/npm/dm/@vizzly-testing/honeydiff.svg)](https://www.npmjs.com/package/@vizzly-testing/honeydiff)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/vizzly-testing/honeydiff/blob/main/LICENSE)

Fast image comparison for visual regression testing in Node.js.

Honeydiff is a native Rust image diff engine packaged for Node. It is built for
the messy parts of visual testing: anti-aliased text, full-page screenshots,
small rendering noise, diff artifacts, spatial clusters, perceptual metrics, and
accessibility checks.

<p align="center">
  <img src="./assets/honeydiff-mascot-diff-drizzle.png" alt="Diff Drizzle, the Honeydiff Vizzly bear mascot" width="320" />
</p>

```bash
npm install @vizzly-testing/honeydiff
```

Requires Node.js 22+. Prebuilt binaries are included for macOS ARM64, Linux
x64/ARM64, and Windows x64.

## Quick Start

```js
import { compare, imagesDiffer } from '@vizzly-testing/honeydiff';

let options = {
  threshold: 2,
  antialiasing: true,
  minimumRegionPixels: 2,
  alignHeightChanges: false,
};

let result = await compare('baseline.png', 'current.png', options);

console.log(result.different);
console.log(result.pixels.changed.total);
console.log(result.difference.regions);
console.log(await imagesDiffer('baseline.png', 'current.png', options));
```

## Why Honeydiff?

Most image diff packages stop at basic pixel comparison. Honeydiff gives you the
pieces visual regression systems usually need once screenshots get real:

- CIEDE2000 perceptual color thresholds, with `2.0` as the default.
- Zero perceptual tolerance with `threshold: 0`; disable AA and set
  `minimumRegionPixels: 1` for strict rendered-pixel matching.
- Conservative anti-aliasing detection for font and sub-pixel rendering noise.
- RGBA-aware comparison that detects opacity changes and ignores RGB payload
  hidden behind full transparency.
- Variable-height screenshot support for full-page comparisons.
- Diff, mask, and side-by-side image artifacts for debugging failures.
- Exact region data, Delta E summaries, SSIM, MS-SSIM, GMSD, and diff fingerprints.
- WCAG contrast screening and color vision deficiency simulation.
- Async and sync APIs with TypeScript definitions included.

## Common Use

### Compare Two Images

```js
import { compare } from '@vizzly-testing/honeydiff';

let result = await compare('before.png', 'after.png');

if (result.different) {
  console.log(`${result.pixels.changed.total} pixels changed`);
}
```

### Use Buffers

```js
import { readFile } from 'node:fs/promises';
import { compare } from '@vizzly-testing/honeydiff';

let baseline = await readFile('baseline.png');
let current = await readFile('current.png');

let result = await compare(baseline, current);
```

### Generate Review Artifacts

```js
import { compare } from '@vizzly-testing/honeydiff';

let result = await compare(
  'baseline.png',
  'current.png',
  {},
  {
    diffPath: 'artifacts/diff.png',
    maskPath: 'artifacts/mask.png',
    sideBySidePath: 'artifacts/side-by-side.png',
    overwrite: true,
  }
);
```

Artifact settings are a separate fourth argument. Honeydiff writes the files
from the same comparison state but doesn't put image data in the result.

### Inspect Changed Regions

```js
import { compare } from '@vizzly-testing/honeydiff';

let result = await compare('baseline.png', 'current.png');

for (let region of result.difference.regions) {
  console.log(region.pixels, region.bounds, region.deltaE);
}
```

### Add Perceptual Metrics

```js
import { analyze } from '@vizzly-testing/honeydiff';

let result = await analyze('baseline.png', 'current.png');

console.log(result.perception.ssim);
console.log(result.perception.msSsim);
console.log(result.perception.gmsd);
```

### Bound CPU Usage

Use one process-wide limit when Honeydiff runs inside a worker service:

```bash
HONEYDIFF_THREADS=4 node visual-tests.js
```

Applications that cannot set the environment before startup can configure the
same limit before their first operation:

```js
import { configureThreads } from '@vizzly-testing/honeydiff';

configureThreads(4);
```

Repeating the same value is safe. Changing it after Honeydiff work starts
throws instead of silently creating an oversubscribed pool.

### Align One Added Or Removed Block

```js
let result = await compare('baseline.png', 'current.png', {
  alignHeightChanges: true,
});
```

This opt-in handles one exact added or removed block of rows, such as a banner,
while keeping separate changes below it visible. Ambiguous matches and
bottom-only growth use the normal comparison. It does not handle multiple
blocks, partial-width movement, or fuzzy matching. `analyze` applies the same
accepted row mapping before it calculates perceptual scores.

### Screenshot Contrast

```js
import { analyzeWcagContrast } from '@vizzly-testing/honeydiff';

let report = await analyzeWcagContrast('screenshot.png');

console.log(report.violations.length);
console.log(report.aaNormalPassPercentage);
console.log(report.violations);
```

### Simulate Color Vision Deficiency

```js
import {
  saveColorBlindnessSimulation,
} from '@vizzly-testing/honeydiff';

await saveColorBlindnessSimulation(
  'screenshot.png',
  'deuteranopia',
  'screenshot-deuteranopia.png'
);
```

## Options

| Option | Default | Notes |
| --- | --- | --- |
| `threshold` | `2` | CIEDE2000 tolerance. Use `0` for zero perceptual tolerance. |
| `antialiasing` | `true` | Suppress conservative raster-coverage movement. |
| `minimumRegionPixels` | `2` | Suppress smaller 8-connected visual regions. |
| `alignHeightChanges` | `false` | Align one unambiguous inserted or removed row block. |

There are no include flags. `compare` always returns its complete data.

## Result Shape

The result separates every pixel into rendered-equal, suppressed, visual-change,
or structural-change populations. Those counts always add up to `pixels.total`.

`difference.regions` contains exact maximal 8-connected retained regions with
bounds, centroid, density, perimeter, visual/structural composition, and real
Delta E statistics where visual samples exist. `heightChange` explains added or
removed rows and whether alignment was applied.

The result is JSON-native data. It never contains a `Buffer`, base64 image,
packed mask, bitmap-sized array, or per-pixel coordinate list. See
[`index.d.ts`](./index.d.ts) for the complete shape.

## Thresholds

Honeydiff uses CIEDE2000 Delta E for perceptual color difference.

| Threshold | Meaning |
| --- | --- |
| `0` | No Delta E tolerance; AA and cluster filtering still apply if enabled. |
| `1` | Barely noticeable color changes. |
| `2` | Recommended default for UI screenshots. |
| `3+` | More tolerant of rendering differences. |

The default is intentionally practical for browser and app screenshots: it
filters tiny rendering variance while still catching meaningful UI changes.

The cited algorithms and standards are listed in the repo's
[References](https://github.com/vizzly-testing/honeydiff/blob/main/docs/REFERENCES.md), including CIEDE2000, SSIM, MS-SSIM,
GMSD, Brettel CVD simulation, sRGB, and WCAG contrast math.

## Performance

Current local benchmark snapshots:

| Scenario | Result |
| --- | ---: |
| Vizzly screenshot default comparison | ~2.81ms |
| Vizzly screenshot strict/no-AA comparison | ~2.18ms |
| Tall screenshot default comparison | ~147ms |
| Tall screenshot strict/no-AA comparison | ~4.34ms |
| 1080p isolated SSIM | ~14.7ms |
| 1080p isolated GMSD | ~10.9ms |

See [benchmarks/BENCHMARK_RESULTS.md](https://github.com/vizzly-testing/honeydiff/blob/main/benchmarks/BENCHMARK_RESULTS.md)
for the current benchmark notes.

## API Overview

```js
import {
  analyze,
  analyzeSync,
  analyzeWcagAllCvd,
  analyzeWcagContrast,
  analyzeWcagForCvd,
  compare,
  compareSync,
  computeFingerprintSync,
  fingerprintHashSync,
  fingerprintSimilaritySync,
  getColorBlindnessTypes,
  getDimensions,
  getDimensionsSync,
  getImageMetadata,
  getImageMetadataFromFile,
  getImageMetadataFromFileSync,
  getImageMetadataSync,
  imagesDiffer,
  imagesDifferSync,
  saveAllColorBlindnessSimulations,
  saveColorBlindnessSimulation,
  saveWcagOverlay,
  simulateColorBlindness,
} from '@vizzly-testing/honeydiff';
```

## Development

```bash
pnpm install
cargo build --release
cargo test
```

The package is ESM-first and release packages include native binaries under
`platforms/*.node`.

## License

MIT
