# @vizzly-testing/honeydiff

[![npm version](https://img.shields.io/npm/v/@vizzly-testing/honeydiff.svg)](https://www.npmjs.com/package/@vizzly-testing/honeydiff)
[![npm downloads](https://img.shields.io/npm/dm/@vizzly-testing/honeydiff.svg)](https://www.npmjs.com/package/@vizzly-testing/honeydiff)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/vizzly-testing/honeydiff/blob/main/LICENSE)

**Blazingly fast image comparison for visual regression testing in Node.js.** Built with Rust for native performance.

```bash
npm install @vizzly-testing/honeydiff
```

Requires Node.js 22+. Pre-built binaries included for macOS (ARM64), Linux (x64/ARM64), and Windows (x64).

## Why Honeydiff?

- **6x faster than odiff** - Processes 230M+ pixels/sec with multi-core parallelization
- **Smart anti-aliasing** - Filters out rendering artifacts, not actual changes
- **Accessibility built-in** - WCAG contrast analysis for catching accessibility violations
- **Flexible inputs** - Works with file paths or Buffers
- **Full TypeScript support** - Complete type definitions included
- **Advanced analytics** - SSIM perceptual scoring, spatial clustering, intensity stats

Built for production visual regression testing at scale.

## Quick Start

### Basic Comparison

```javascript
const { compare, quickCompare } = require('@vizzly-testing/honeydiff');

// Quick boolean check - are these images different?
if (await quickCompare('baseline.png', 'current.png')) {
  console.log('Visual regression detected!');
}

// Detailed comparison with tolerance
const result = await compare('baseline.png', 'current.png', {
  pixelTolerance: 10,  // Ignore tiny differences
  includeSSIM: true    // Perceptual similarity score
});

console.log(`Diff: ${result.diffPercentage.toFixed(2)}%`);
console.log(`SSIM: ${result.perceptualScore}`);
// Output: Diff: 3.55%, SSIM: 0.9234
```

### TypeScript

```typescript
import { compare, CompareOptions, DiffResult } from '@vizzly-testing/honeydiff';

const options: CompareOptions = {
  pixelTolerance: 5,
  includeSSIM: true,
  includeClusters: true
};

const result: DiffResult = await compare('img1.png', 'img2.png', options);

if (result.diffClusters) {
  console.log(`Found ${result.diffClusters.length} different regions`);
}
```

### Test Integration

**Jest/Vitest**
```javascript
import { quickCompare } from '@vizzly-testing/honeydiff';

test('homepage should match baseline', async () => {
  let screenshot = await page.screenshot();
  let isDifferent = await quickCompare('baseline.png', screenshot);
  expect(isDifferent).toBe(false);
});
```

**Playwright**
```javascript
const { compare } = require('@vizzly-testing/honeydiff');

test('button hover state', async () => {
  await page.hover('[data-testid="submit-button"]');
  let screenshot = await page.screenshot();

  let result = await compare('baseline.png', screenshot, {
    pixelTolerance: 10,
    diffPath: './artifacts/diff.png'
  });

  expect(result.diffPercentage).toBeLessThan(1.0);
});
```

## Core Features

### 1. Performance at Scale

Process 230M pixels/second with automatic multi-core parallelization. Perfect for CI/CD pipelines.

```javascript
// 18.3M pixel screenshot compared in ~79ms
const result = await compare('full-page-baseline.png', 'full-page-current.png');
```

### 2. Smart Anti-Aliasing Detection

Automatically filters out rendering artifacts (font smoothing, sub-pixel differences) while catching real visual changes.

```javascript
const result = await compare('img1.png', 'img2.png', {
  antialiasing: true  // Default: true
});

console.log(`Ignored ${result.aaPixelsIgnored} AA pixels`);
// Output: Ignored 1952904 AA pixels
```

Disable for pixel-perfect matching:
```javascript
const result = await compare('img1.png', 'img2.png', {
  antialiasing: false  // Strict pixel matching
});
```

### 3. Variable Height Screenshots

Perfect for scrollable content - compare full-page screenshots with different heights.

```javascript
// 24,162px vs 24,412px tall images
const result = await compare('full-page-v1.png', 'full-page-v2.png');

if (result.heightDiff) {
  console.log(`Height difference: ${result.heightDiff.height1} vs ${result.heightDiff.height2}`);
  console.log(`Extra pixels: ${result.heightDiff.extraPixels}`);
}
```

### 4. Visual Diff Artifacts

Generate highlighted diff images, binary masks, and overlays for debugging.

```javascript
const result = await compare('baseline.png', 'current.png', {
  diffPath: './artifacts/diff.png',      // Highlighted differences
  maskPath: './artifacts/mask.png',      // Binary diff mask
  overlayPath: './artifacts/overlay.png', // Side-by-side comparison
  overwrite: true
});

console.log('Artifacts saved to ./artifacts/');
```

### 5. Spatial Clustering & Noise Filtering

Group nearby differences into regions and filter out single-pixel noise from rendering variance.

```javascript
const result = await compare('img1.png', 'img2.png', {
  includeClusters: true,
  minClusterSize: 2  // Default: filter single isolated pixels as noise
});

if (result.diffClusters) {
  result.diffClusters.forEach((cluster, i) => {
    console.log(`Region ${i + 1}:`);
    console.log(`  - ${cluster.pixelCount} pixels changed`);
    console.log(`  - Center at (${cluster.centerOfMass[0]}, ${cluster.centerOfMass[1]})`);
    console.log(`  - Bounding box: ${cluster.boundingBox.width}x${cluster.boundingBox.height}`);
    console.log(`  - Average intensity: ${cluster.avgIntensity}`);
  });
}
// Output:
// Region 1:
//   - 12450 pixels changed
//   - Center at (245, 189)
//   - Bounding box: 124x89
//   - Average intensity: 127.3
```

**Noise filtering values:**
| Value | Behavior |
|-------|----------|
| 1 | Exact matching - any different pixel counts |
| 2 | Default - filters single isolated pixels as rendering noise |
| 3+ | More permissive - only larger clusters detected |

### 6. Perceptual Similarity (SSIM)

Beyond pixel counting - measure structural similarity from a human perception perspective.

```javascript
const result = await compare('img1.png', 'img2.png', {
  includeSSIM: true  // Note: Can be slow on large images
});

if (result.perceptualScore !== null) {
  console.log(`SSIM: ${result.perceptualScore.toFixed(3)}`);
  // Output: SSIM: 0.923 (0.0 = different, 1.0 = identical)

  if (result.perceptualScore > 0.95) {
    console.log('Images are perceptually very similar');
  }
}
```

### 7. Tolerance & Color Spaces

**RGB Mode (default)** - Exact matching with pixel tolerance:
```javascript
const result = await compare('img1.png', 'img2.png', {
  pixelTolerance: 10  // Ignore differences below threshold (0-255)
});
```

**YIQ Mode** - Perceptual color matching weighted for human vision:
```javascript
const result = await compare('img1.png', 'img2.png', {
  colorThreshold: 0.1  // YIQ mode (odiff-compatible)
});
```

**Brightness-only Mode** - Ignore color, compare structure:
```javascript
const result = await compare('img1.png', 'img2.png', {
  ignoreColors: true  // Compare brightness/luminance only
});
```

### 8. Buffer Support

Work with in-memory images from screenshots or API responses.

```javascript
const fs = require('fs');

// Compare buffers directly
let img1 = fs.readFileSync('image1.png');
let img2 = fs.readFileSync('image2.png');
let result = await compare(img1, img2, { pixelTolerance: 5 });

// Mix paths and buffers
let screenshot = await page.screenshot();  // Returns Buffer
let result = await compare('baseline.png', screenshot);
```

### 9. Image Dimensions

Fast utility to get image dimensions without loading full image data.

```javascript
const { getDimensions } = require('@vizzly-testing/honeydiff');

let dims = await getDimensions('screenshot.png');
console.log(`Image is ${dims.width}x${dims.height} pixels`);
// Output: Image is 1920x1080 pixels

// Works with buffers too
let buffer = fs.readFileSync('image.png');
let dims = await getDimensions(buffer);
```

### 10. Image Metadata

Get image dimensions, file size, and format detection - useful for storage tracking and billing.

```javascript
const { getImageMetadata, getImageMetadataFromFile } = require('@vizzly-testing/honeydiff');

// From buffer
let buffer = fs.readFileSync('screenshot.png');
let metadata = await getImageMetadata(buffer);
console.log(`Image: ${metadata.width}x${metadata.height}`);
console.log(`Size: ${metadata.fileSizeBytes} bytes`);
console.log(`Format: ${metadata.format}`);
// Output: Image: 1920x1080
//         Size: 245760 bytes
//         Format: png

// From file (gets accurate file size from disk)
let metadata = await getImageMetadataFromFile('screenshot.png');
console.log(`${metadata.width}x${metadata.height}, ${metadata.fileSizeBytes} bytes`);
```

### 11. Diff Fingerprinting

Group similar diffs across comparisons with fingerprinting. Perfect for batch-approving the same visual change that appears on multiple pages (e.g., header/footer updates).

```javascript
const { compare, computeFingerprintSync, fingerprintSimilaritySync, fingerprintHashSync } = require('@vizzly-testing/honeydiff');

// Compare images with clustering enabled
let result = await compare('baseline.png', 'current.png', {
  includeClusters: true
});

// Compute fingerprint
let fingerprint = computeFingerprintSync(result, 1920, 1080);

if (fingerprint) {
  console.log(`Hash: ${fingerprint.hash}`);
  console.log(`Zones affected: ${fingerprint.zoneMask.toString(2).padStart(16, '0')}`);
  console.log(`Cluster count: ${fingerprint.clusterCount}`);
  console.log(`Magnitude: ${fingerprint.diffMagnitude}`);
}
```

**Grouping similar diffs:**
```javascript
// Group diffs by hash for batch approval
let groups = new Map();

for (let comparison of comparisons) {
  let fp = computeFingerprintSync(comparison.result, width, height);
  if (fp) {
    let hash = fingerprintHashSync(fp);
    if (!groups.has(hash)) groups.set(hash, []);
    groups.get(hash).push(comparison);
  }
}

// Find groups with multiple similar diffs
for (let [hash, items] of groups) {
  if (items.length > 1) {
    console.log(`Found ${items.length} similar diffs with hash ${hash}`);
  }
}
```

**Similarity scoring:**
```javascript
// Compare two fingerprints (0.0 = different, 1.0 = identical)
let similarity = fingerprintSimilaritySync(fp1, fp2);

if (similarity > 0.8) {
  console.log('These diffs are likely the same visual change');
}
```

**Fingerprint properties:**
- `clusterCount` - Number of distinct change regions
- `clusterPositions` - Normalized positions (0.0-1.0)
- `clusterSizes` - Relative sizes (area ratio)
- `zoneMask` - 4x4 grid (16 zones) showing affected regions
- `diffMagnitude` - Bucketed size: `tiny`, `small`, `medium`, `large`, `massive`
- `hash` - Pre-computed coarse hash for fast grouping

## Accessibility Features

Built-in WCAG color contrast analysis and color blindness simulation to catch accessibility violations in screenshots and UI designs.

### WCAG Contrast Analysis

Analyze entire images for WCAG color contrast violations - perfect for catching accessibility issues in screenshots and UI designs.

```javascript
const { analyzeWcagContrast, saveWcagOverlay } = require('@vizzly-testing/honeydiff');

// Analyze a screenshot for accessibility violations
let analysis = await analyzeWcagContrast('screenshot.png', {
  edgeThreshold: 60,      // Edge detection sensitivity (0-255)
  minRegionSize: 50,      // Minimum violation region size (pixels)
  checkAA: true,          // Check WCAG AA (4.5:1 normal, 3.0:1 large)
  checkAAA: true          // Check WCAG AAA (7.0:1 normal, 4.5:1 large)
});

console.log(`Total edges analyzed: ${analysis.totalEdges}`);
console.log(`AA normal text pass rate: ${analysis.aaNormalPassPercentage.toFixed(1)}%`);
console.log(`Found ${analysis.violations.length} violations`);

// Examine violations
analysis.violations.forEach((violation, i) => {
  console.log(`\nViolation ${i + 1}:`);
  console.log(`  Location: (${violation.boundingBox.x}, ${violation.boundingBox.y})`);
  console.log(`  Contrast ratio: ${violation.contrastRatio.toFixed(2)}:1`);
  console.log(`  Foreground: rgb(${violation.foregroundColor.slice(0,3).join(', ')})`);
  console.log(`  Background: rgb(${violation.backgroundColor.slice(0,3).join(', ')})`);
  console.log(`  Fails AA normal: ${violation.failsAaNormal}`);
  console.log(`  Fails AAA normal: ${violation.failsAaaNormal}`);
});

// Generate visual overlay showing violations
await saveWcagOverlay('screenshot.png', analysis, 'violations.png', {
  highlightColor: [255, 0, 0, 180]  // Semi-transparent red
});
```

**Advanced filtering:**
```javascript
let analysis = await analyzeWcagContrast('screenshot.png', {
  edgeThreshold: 80,           // Higher = fewer false positives
  minRegionSize: 100,          // Ignore tiny regions
  maxContrastThreshold: 3.5,   // Only flag severe violations
  checkAA: true,
  checkAAA: false
});

console.log(`AA pass rate: ${analysis.aaNormalPassPercentage.toFixed(1)}%`);
```

### Color Blindness Simulation

Simulate how your UI appears to users with color vision deficiencies. Uses the scientifically accurate Brettel, Viénot & Mollon 1997 algorithm.

**Supported CVD types:**
- `protanopia` - Red-blind (~1% of males)
- `deuteranopia` - Green-blind (~1% of males, most common)
- `tritanopia` - Blue-blind (~0.003% of population)
- `achromatopsia` - Complete color blindness (grayscale only)

```javascript
const {
  simulateColorBlindness,
  saveColorBlindnessSimulation,
  saveAllColorBlindnessSimulations,
  getColorBlindnessTypes
} = require('@vizzly-testing/honeydiff');

// Get CVD type information
let types = getColorBlindnessTypes();
types.forEach(cvd => {
  console.log(`${cvd.name}: ${cvd.description} (${cvd.prevalence})`);
});

// Simulate and get buffer (useful for in-memory operations)
let simulated = await simulateColorBlindness('chart.png', 'deuteranopia');
fs.writeFileSync('chart-deuteranopia.png', simulated);

// Or save directly to file
await saveColorBlindnessSimulation('ui.png', 'protanopia', 'ui-protanopia.png');

// Generate all simulations at once
// Creates: dashboard_protanopia.png, dashboard_deuteranopia.png,
//          dashboard_tritanopia.png, dashboard_achromatopsia.png
await saveAllColorBlindnessSimulations('dashboard.png', 'dashboard', 'png');
```

### CVD-Aware WCAG Analysis

Analyze contrast accessibility specifically for colorblind users. This catches issues that only appear when colors are perceived differently.

```javascript
const { analyzeWcagForCvd, analyzeWcagAllCvd } = require('@vizzly-testing/honeydiff');

// Analyze for a specific CVD type
let analysis = await analyzeWcagForCvd('ui.png', 'deuteranopia', {
  checkAA: true,
  checkAAA: false
});

if (analysis.violations.length > 0) {
  console.log(`Found ${analysis.violations.length} contrast issues for red-green colorblind users`);
}

// Comprehensive report for all CVD types
let report = await analyzeWcagAllCvd('dashboard.png', {
  checkAA: true,
  checkAAA: true
});

console.log('Accessibility Report:');
console.log(`Normal vision:  ${report.normalVision.violations.length} violations`);
console.log(`Protanopia:     ${report.protanopia.violations.length} violations`);
console.log(`Deuteranopia:   ${report.deuteranopia.violations.length} violations`);
console.log(`Tritanopia:     ${report.tritanopia.violations.length} violations`);
console.log(`Total: ${report.totalViolations} violations`);
console.log(`CVD-only issues: ~${report.cvdOnlyViolationCount}`);

if (report.hasAnyViolations) {
  console.log('Accessibility issues detected!');
}
```

**Test integration:**
```javascript
test('UI colors work for colorblind users', async () => {
  let screenshot = await page.screenshot();

  // Comprehensive CVD accessibility check
  let report = await analyzeWcagAllCvd(screenshot, { checkAA: true });

  expect(report.hasAnyViolations).toBe(false);
  expect(report.deuteranopia.aaNormalPassPercentage).toBeGreaterThan(95);
});
```

## Complete API Reference

### Async Functions (Recommended)

**`compare(img1, img2, options?): Promise<DiffResult>`**

Full comparison with detailed results.

**`quickCompare(img1, img2): Promise<boolean>`**

Fast boolean check - returns true if different, false if identical.

**`getDimensions(img): Promise<{ width: number, height: number }>`**

Get image dimensions without loading full image data.

**`getImageMetadata(buffer): Promise<ImageMetadata>`**

Get image metadata (dimensions, file size, format) from a buffer.

**`getImageMetadataFromFile(path): Promise<ImageMetadata>`**

Get image metadata from a file path. File size is read from disk for accuracy.

### Sync Functions (Blocks Event Loop)

**`compareSync(img1, img2, options?): DiffResult`**

Synchronous comparison. Use only when blocking behavior is required.

**`quickCompareSync(img1, img2): boolean`**

Synchronous boolean check.

**`getDimensionsSync(img): { width: number, height: number }`**

Synchronous dimension retrieval.

**`getImageMetadataSync(buffer): ImageMetadata`**

Synchronous metadata retrieval from buffer.

**`getImageMetadataFromFileSync(path): ImageMetadata`**

Synchronous metadata retrieval from file.

### Diff Fingerprint Functions (Sync only)

**`computeFingerprintSync(diffResult, width, height): DiffFingerprint | null`**

Compute a fingerprint from a diff result. Requires `includeClusters: true` in compare options. Returns null if no clusters.

**`fingerprintSimilaritySync(fp1, fp2): number`**

Compare two fingerprints. Returns 0.0 (different) to 1.0 (identical).

**`fingerprintHashSync(fingerprint): string`**

Get coarse hash for fast grouping. Returns 16-char hex string.

### Input Types

All functions accept:
- `string` - File path to PNG image
- `Buffer` - Image data in memory

### CompareOptions

```typescript
interface CompareOptions {
  // Basic options
  pixelTolerance?: number;              // 0-255, ignore diffs below threshold (default: 0)
  colorThreshold?: number;              // 0.0-1.0, YIQ mode threshold (default: 0.0 = RGB)
  antialiasing?: boolean;               // Ignore AA artifacts (default: true)
  ignoreColors?: boolean;               // Brightness only (default: false)
  maxDiffs?: number;                    // Stop after N diffs (default: unlimited)

  // Analysis options
  includeDiffPixels?: boolean;          // List all diff pixels (memory intensive, default: false)
  includeClusters?: boolean;            // Spatial clustering (default: false)
  includeSSIM?: boolean;                // SSIM perceptual score (slow, default: false)
  minClusterSize?: number;              // Filter clusters smaller than this (default: 2)

  // Accessibility options
  includeAccessibilityData?: boolean;   // RGB, luminance, WCAG (default: false)
  checkColorBlindness?: boolean;        // Color blindness simulation (default: false)
  colorBlindnessThreshold?: number;     // Visibility threshold 0-255 (default: 30.0)

  // Output options
  diffPath?: string;                    // Save diff image path
  maskPath?: string;                    // Save mask image path
  overlayPath?: string;                 // Save overlay image path
  overwrite?: boolean;                  // Overwrite existing files (default: false)
  diffMaskColor?: string | number[];    // Highlight color: hex or [r,g,b,a] (default: "ff0000")
}
```

### DiffResult

```typescript
interface DiffResult {
  // Basic metrics
  isDifferent: boolean;                 // Are images different? (respects minClusterSize filtering)
  diffPercentage: number;               // 0.0-100.0
  totalPixels: number;
  diffPixels: number;                   // Raw count (unaffected by minClusterSize filtering)

  // Anti-aliasing
  aaPixelsIgnored: number;
  aaPercentage: number;                 // 0.0-100.0

  // Spatial info
  boundingBox: BoundingBox | null;      // Rectangle containing all diffs
  heightDiff: HeightDiff | null;        // Height difference info

  // Advanced analysis
  diffPixelsList: DiffPixel[] | null;   // Null unless includeDiffPixels enabled
  diffClusters: DiffCluster[] | null;   // Null unless includeClusters enabled
  intensityStats: IntensityStats | null; // Null unless includeDiffPixels enabled
  perceptualScore: number | null;       // 0.0-1.0, null unless includeSSIM enabled
}
```

See [index.d.ts](./index.d.ts) for complete type definitions.

## Performance

Benchmarked on 18.3M pixel screenshots (750 x 24,162 px):

| Operation | Time | Throughput |
|-----------|------|------------|
| Basic RGB comparison | ~79ms | 231.8M pixels/sec |
| With anti-aliasing | ~88ms | 208M pixels/sec |
| YIQ color space | ~89ms | 206M pixels/sec |
| With artifacts (diff/mask/overlay) | ~432ms | 42.4M pixels/sec |

**vs odiff:** 6.0x faster (79ms vs 474ms)

Multi-core parallelization: 215-309% CPU utilization across cores.

*Benchmarked on Apple M-series Mac.*

## Common Patterns

### CI/CD Integration

```javascript
const { compare } = require('@vizzly-testing/honeydiff');

async function visualRegressionTest() {
  let result = await compare('baseline.png', 'current.png', {
    pixelTolerance: 10,
    maxDiffs: 1000,  // Early exit for fast failure
    diffPath: process.env.CI ? './artifacts/diff.png' : undefined
  });

  if (result.isDifferent && result.diffPercentage > 1.0) {
    console.error(`Visual regression: ${result.diffPercentage.toFixed(2)}% changed`);
    process.exit(1);
  }
}
```

### Progressive Enhancement

```javascript
// Start with quick check
if (await quickCompare('baseline.png', 'current.png')) {
  // Only run expensive analysis if different
  let result = await compare('baseline.png', 'current.png', {
    includeClusters: true,
    includeSSIM: true,
    diffPath: './diff.png'
  });

  // Detailed analysis and reporting
  reportVisualRegression(result);
}
```

### Tolerance Thresholds

```javascript
const result = await compare('baseline.png', 'current.png', {
  pixelTolerance: 10
});

if (result.diffPercentage > 5.0) {
  console.error('FAIL: Major visual regression');
  process.exit(1);
} else if (result.diffPercentage > 1.0) {
  console.warn('WARN: Minor visual changes detected');
} else {
  console.log('PASS: Visual test passed');
}
```

## Troubleshooting

**Module not found errors**
- Ensure Node.js 22+ is installed
- Verify your platform is supported (macOS ARM64, Linux x64/ARM64, Windows x64)
- Try `npm install` again to download pre-built binaries

**Large memory usage with `includeDiffPixels`**
- This option stores every different pixel's position and intensity
- Disable for large images with many differences
- Only enable if you need detailed pixel-level data

**Slow performance with `includeSSIM`**
- SSIM calculation is O(width × height × window²)
- Only enable when perceptual scoring is needed
- Consider running SSIM only on failed comparisons

**Anti-aliasing too aggressive**
- Set `antialiasing: false` for stricter pixel matching
- Adjust `pixelTolerance` instead for controlled flexibility

## Use Cases

- **Visual Regression Testing** - Catch unintended UI changes in CI/CD
- **Screenshot Validation** - Compare generated screenshots against baselines
- **Accessibility Testing** - Validate WCAG contrast and color blindness visibility
- **Design QA** - Ensure implementations match design specifications
- **Cross-browser Testing** - Detect rendering differences across browsers
- **A/B Testing** - Measure visual differences between variants
- **Responsive Design** - Compare layouts across viewports

## Examples

See [examples/](./examples/) directory:
- [basic.js](./examples/basic.js) - Core features and comparison options
- [buffers.js](./examples/buffers.js) - Working with in-memory images
- [typescript.ts](./examples/typescript.ts) - TypeScript integration
- [wcag.js](./examples/wcag.js) - WCAG contrast analysis
- [color-blindness.js](./examples/color-blindness.js) - CVD simulation and accessibility

## License

MIT License

Built with native Rust for maximum performance.
