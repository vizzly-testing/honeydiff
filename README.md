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
import { compare, quickCompare } from '@vizzly-testing/honeydiff';

let changed = await quickCompare('baseline.png', 'current.png');

if (changed) {
  console.log('Visual change detected');
}

let result = await compare('baseline.png', 'current.png', {
  threshold: 2.0,
  includeClusters: true,
  diffPath: 'artifacts/diff.png',
  maskPath: 'artifacts/mask.png',
  overlayPath: 'artifacts/overlay.png',
  overwrite: true,
});

console.log(result.isDifferent);
console.log(result.diffPercentage);
console.log(result.diffClusters);
```

## Why Honeydiff?

Most image diff packages stop at basic pixel comparison. Honeydiff gives you the
pieces visual regression systems usually need once screenshots get real:

- CIEDE2000 perceptual color thresholds, with `2.0` as the default.
- Zero perceptual tolerance with `threshold: 0`; disable AA and set
  `minClusterSize: 1` for strict rendered-pixel matching.
- Conservative anti-aliasing detection for font and sub-pixel rendering noise.
- RGBA-aware comparison that detects opacity changes and ignores RGB payload
  hidden behind full transparency.
- Variable-height screenshot support for full-page comparisons.
- Diff, mask, and overlay image artifacts for debugging failures.
- Spatial clusters, intensity stats, SSIM, GMSD, and diff fingerprints.
- WCAG contrast screening and color vision deficiency simulation.
- Async and sync APIs with TypeScript definitions included.

## Common Use

### Compare Two Images

```js
import { compare } from '@vizzly-testing/honeydiff';

let result = await compare('before.png', 'after.png', {
  threshold: 2.0,
});

if (result.isDifferent) {
  console.log(`${result.diffPercentage.toFixed(2)}% of pixels changed`);
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

let result = await compare('baseline.png', 'current.png', {
  diffPath: 'artifacts/diff.png',
  maskPath: 'artifacts/mask.png',
  overlayPath: 'artifacts/overlay.png',
  overwrite: true,
});
```

### Group Differences Into Regions

```js
import { compare } from '@vizzly-testing/honeydiff';

let result = await compare('baseline.png', 'current.png', {
  includeClusters: true,
  minClusterSize: 2,
  clusterMerge: true,
});

for (let cluster of result.diffClusters ?? []) {
  console.log(cluster.pixelCount, cluster.boundingBox);
}
```

### Persist Authoritative Mask Evidence

Use diff-mask evidence when another system needs durable spatial facts
without decoding the generated PNG:

```js
let result = await compare('baseline.png', 'current.png', {
  includeDiffMaskEvidence: true,
  maskPath: 'artifacts/mask.png',
});

console.log(result.diffMaskEvidence?.analysisContractHash);
console.log(result.diffMaskEvidence?.components);
```

The components are exact 8-connected groups of retained mask pixels. They are
separate from `diffClusters`, whose optional merge heuristics are intended for
diagnostic presentation.

### Add Perceptual Metrics

```js
import { compare } from '@vizzly-testing/honeydiff';

let result = await compare('baseline.png', 'current.png', {
  includeSSIM: true,
  includeGMSD: true,
});

console.log(result.perceptualScore);
console.log(result.gmsdScore);
```

### Align One Added Or Removed Block

```js
let result = await compare('baseline.png', 'current.png', {
  alignHeightChanges: true,
  maskPath: 'artifacts/mask.png',
});
```

This opt-in handles one exact added or removed block of rows, such as a banner,
while keeping separate changes below it visible. Ambiguous matches,
bottom-only growth, and comparisons using `maxDiffs` use the normal comparison.
It does not handle multiple blocks, partial-width movement, or fuzzy matching.
An accepted comparison temporarily uses one additional RGBA frame. SSIM and
GMSD compare the unaligned overlapping portions, and the side-by-side overlay
uses the original images.

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
| `threshold` | `2.0` | CIEDE2000 Delta E threshold. Use `0` for zero perceptual tolerance. |
| `antialiasing` | `true` | Ignore likely anti-aliased pixels. |
| `alignHeightChanges` | `false` | Align one conservatively detected added or removed block of rows. |
| `maxDiffs` | unlimited | Stop after a maximum number of differing pixels. Capped results classify from the pixels observed before early exit, without cluster filtering. |
| `includeDiffPixels` | `false` | Return individual differing pixel positions and intensities. |
| `includeClusters` | `false` | Return connected regions of visual change. |
| `includeDiffMaskEvidence` | `false` | Return authoritative diff-mask identity, dimensions, and exact components. |
| `minClusterSize` | `2` | Filter tiny isolated clusters as noise. |
| `clusterMerge` | disabled | Merge nearby clusters into logical text-like regions. |
| `includeSSIM` | `false` | Calculate structural similarity. More expensive on large images. |
| `includeGMSD` | `false` | Calculate fast edge-sensitive structural difference. |
| `diffPath` | unset | Save a highlighted diff image. |
| `maskPath` | unset | Save a binary diff mask. |
| `overlayPath` | unset | Save an overlay comparison image. |
| `overwrite` | `false` | Replace existing artifact files. |

## Result Shape

```ts
interface DiffResult {
  isDifferent: boolean;
  diffPercentage: number;
  totalPixels: number;
  diffPixels: number;
  diffMaskPixels: number;
  diffMaskComplete: boolean;
  maskSemanticsVersion: string;
  diffMaskEvidence: DiffMaskEvidence | null;
  aaPixelsIgnored: number;
  aaPercentage: number;
  boundingBox: BoundingBox | null;
  heightDiff: HeightDiff | null;
  diffPixelsList: DiffPixel[] | null;
  diffClusters: DiffCluster[] | null;
  intensityStats: IntensityStats | null;
  perceptualScore: number | null;
  gmsdScore: number | null;
}
```

`diffPixels` is the raw post-threshold/anti-aliasing count.
`diffMaskPixels` is the retained count represented by the binary mask after
`minClusterSize` filtering. It always matches the mask's nontransparent pixel
count. If `diffMaskComplete` is `false`, `maxDiffs` stopped the scan early;
the partial mask is useful for diagnostics but not complete spatial proof.
Requesting `diffPixelsList` or `diffClusters` never changes that retained result.
`diffMaskEvidence` is returned only when `includeDiffMaskEvidence` is enabled. Its
native analysis hash covers every normalized option that can change retained
pixels, and its component pixel counts sum to `diffMaskPixels`.

The package also exports `version` from its installed manifest and
`maskSemanticsVersion` from the native comparison engine.

See [index.d.ts](./index.d.ts) for the full API surface.

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
  quickCompare,
  quickCompareSync,
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
