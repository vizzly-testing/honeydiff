# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.1] - 2026-01-09

## What's Changed

### Changed
- **Performance**: SSIM calculation is now 5x faster using integral images and parallel processing (#21)
  - Full HD (1920×1080) images: 239ms → 51ms (4.7× speedup)
  - 640×480 images: 35ms → 8.3ms (4.2× speedup)
- **Performance**: Skip SSIM calculation for identical images, saving ~250M operations per comparison (#20)
  - When images have no differences (or only anti-aliasing artifacts), SSIM returns 1.0 immediately
  - Particularly beneficial for visual regression test suites where most screenshots match their baselines

### Fixed
- Clean up duplicate entries in package.json files list

**Full Changelog**: https://github.com/vizzly-testing/honeydiff/compare/v0.8.0...v0.8.1

## [0.8.0] - 2026-01-03

## What's Changed

### Added
- **Custom diff mask colors**: New `diffMaskColor` option allows customizing the highlight color in generated mask images. Supports both hex strings (`"ff0000"`, `"#ff0000"`, with optional alpha `"ff0000ff"`) and RGBA arrays (`[255, 0, 0]` or `[255, 0, 0, 255]`). This brings feature parity with the CLI's `--diff-color` flag.

**Full Changelog**: https://github.com/vizzly-testing/honeydiff/compare/v0.7.1...v0.8.0

## [0.7.1] - 2025-12-11

## What's Changed

### Fixed
- Add missing JavaScript exports for image metadata functions (`getImageMetadata`, `getImageMetadataSync`, `getImageMetadataFromFile`, `getImageMetadataFromFileSync`) that were added in v0.7.0 but not properly exported

**Full Changelog**: https://github.com/vizzly-testing/honeydiff/compare/v0.7.0...v0.7.1

## [0.7.0] - 2025-12-11

## What's Changed

### Added
- **Image Metadata API** - New functions to extract image dimensions, file size, and format without performing comparison
  - `getImageMetadata(buffer)` / `getImageMetadataSync(buffer)` - Extract metadata from Buffer
  - `getImageMetadataFromFile(path)` / `getImageMetadataFromFileSync(path)` - Extract metadata from file path
  - Returns `ImageMetadata` with `width`, `height`, `fileSizeBytes`, and `format` properties
  - Useful for storage tracking and billing purposes without needing to scan cloud storage buckets

**Full Changelog**: https://github.com/vizzly-testing/honeydiff/compare/v0.6.0...v0.7.0

## [0.6.0] - 2025-12-10

## What's Changed

### Added
- **Noise filtering with `minClusterSize` option** - New option to filter out single-pixel rendering variance while catching real visual changes. Defaults to `2` (filters isolated pixels), can be set to `1` for exact matching or `3+` for more permissive detection. Clustering is automatically enabled when `minClusterSize > 1`.

### Changed
- **`isDifferent` now respects noise filtering** - When `minClusterSize` is set, small clusters below the threshold are filtered out, meaning `isDifferent` may be `false` even when `diffPixels > 0` (those pixels were classified as noise)
- **`diffPixels` reports raw count** - The raw pixel count is now unaffected by `minClusterSize` filtering, showing all differing pixels including those filtered as noise
- **Documentation improvements** - Added comprehensive documentation for the `minClusterSize` option in TypeScript types and README, including a behavior table and usage examples

### Fixed
- Height differences now always count regardless of clustering (structural changes are never filtered as noise)

**Full Changelog**: https://github.com/vizzly-testing/honeydiff/compare/v0.5.0...v0.6.0

## [0.5.0] - 2025-12-04

## What's Changed

### Changed

**⚠️ BREAKING CHANGE: Switched from YIQ to CIEDE2000 for perceptual color comparison**

The image comparison algorithm has been upgraded to use the industry-standard CIEDE2000 (Delta E) metric, providing superior perceptual accuracy compared to the previous YIQ approach.

**API Changes:**
- **Removed:** `colorThreshold` option (0.0-1.0 scale)
- **Removed:** `pixelTolerance` option (0-255 scale)
- **Removed:** `ignoreColors` option
- **Added:** `threshold` option using CIEDE2000 Delta E units with intuitive perceptual scale:
  - `0.0` = Exact pixel matching (strictest)
  - `1.0` = Just Noticeable Difference (JND) - barely perceptible to trained observers
  - `2.0` = **Recommended default** - ignores sub-pixel rendering variance, catches real differences
  - `3.0+` = Permissive - high tolerance for rendering variations

**Migration Guide:**
```typescript
// Before (v0.4.x)
const result = await compare('baseline.png', 'current.png', {
  pixelTolerance: 10,      // ❌ Removed
  colorThreshold: 0.1,     // ❌ Removed
  ignoreColors: false      // ❌ Removed
});

// After (v0.5.0)
const result = await compare('baseline.png', 'current.png', {
  threshold: 2.0           // ✅ CIEDE2000 Delta E units (new default)
});
```

**Benefits:**
- More accurate perceptual color difference detection
- Aligns with CIE standards used in color science
- Better handling of subtle color variations
- Improved anti-aliasing detection accuracy

**Full Changelog**: https://github.com/vizzly-testing/honeydiff/compare/v0.4.3...v0.5.0

## [0.4.3] - 2025-12-01

## What's Changed

### Fixed
- Fixed ESM module loading error by renaming platform loader to `.cjs` extension. The package uses `"type": "module"` in package.json, which caused Node.js to incorrectly treat the CommonJS platform loader as ESM, resulting in import errors. The loader now uses the correct `.cjs` extension.

### Changed
- Updated Windows build infrastructure to use Blacksmith runners for improved performance

**Full Changelog**: https://github.com/vizzly-testing/honeydiff/compare/v0.4.2...v0.4.3

## [0.4.2] - 2025-12-01

## What's Changed

### Fixed
- **ESM exports now work correctly in published package** - Fixed critical bug where ESM imports were broken in consuming projects (e.g., `import { compare } from '@vizzly-testing/honeydiff'` threw `SyntaxError: The requested module does not provide an export named 'compare'`). The package loader now auto-detects whether to use platform-specific binaries (published package) or the local development build. (#14)

**Full Changelog**: https://github.com/vizzly-testing/honeydiff/compare/v0.4.1...v0.4.2

## [0.4.1] - 2025-11-30

## What's Changed

### Changed
- CHANGELOG.md is now included in the npm package, providing version history for offline reference

**Full Changelog**: https://github.com/vizzly-testing/honeydiff/compare/v0.4.0...v0.4.1

## [0.4.0] - 2025-11-30

### Breaking Changes
- **ESM-only package**: Switched from CommonJS (`module.exports`) to native ES modules (`export`). If you're using CommonJS, you'll need to use dynamic `import()` or update your project to ESM.

### Added
- Color blindness simulation API for accessibility testing:
  - `simulateColorBlindness` / `simulateColorBlindnessSync` - Simulate how images appear to users with color vision deficiencies
  - `saveColorBlindnessSimulation` / `saveColorBlindnessSimulationSync` - Save simulated images to disk
  - `saveAllColorBlindnessSimulations` / `saveAllColorBlindnessSimulationsSync` - Generate all CVD type simulations at once
  - `analyzeWcagForCvd` / `analyzeWcagForCvdSync` - Analyze WCAG contrast for a specific color blindness type
  - `analyzeWcagAllCvd` / `analyzeWcagAllCvdSync` - Analyze WCAG contrast across all color blindness types
  - `getColorBlindnessTypes` - Get list of supported color blindness types (protanopia, deuteranopia, tritanopia, achromatopsia)

**Full Changelog**: https://github.com/vizzly-testing/honeydiff/compare/v0.3.1...v0.4.0

## [0.3.1] - 2025-11-15

### Fixed
- Fixed release workflow to properly export WCAG functions (`analyzeWcagContrast`, `analyzeWcagContrastSync`, `saveWcagOverlay`, `saveWcagOverlaySync`)

**Full Changelog**: https://github.com/vizzly-testing/honeydiff/compare/v0.3.0...v0.3.1

## [0.3.0] - 2025-11-15

### Added
- WCAG accessibility testing API for analyzing color contrast compliance
- `analyzeWcagContrast` / `analyzeWcagContrastSync` - Analyze images for WCAG color contrast violations
- `saveWcagOverlay` / `saveWcagOverlaySync` - Generate visual overlays highlighting contrast issues

**Full Changelog**: https://github.com/vizzly-testing/honeydiff/compare/v0.2.1...v0.3.0

## [0.2.1] - 2025-11-11

### Changed
- Improved README documentation for better user experience

**Full Changelog**: https://github.com/vizzly-testing/honeydiff/compare/v0.2.0...v0.2.1

## [0.2.0] - 2025-11-10

### Added
- Node.js bindings for accessibility features (ignore colors mode, anti-aliasing detection settings)
- Comprehensive accessibility features for visual regression testing

**Full Changelog**: https://github.com/vizzly-testing/honeydiff/compare/v0.1.1...v0.2.0

## [0.1.1] - 2025-10-25

### Added
- `getDimensions` / `getDimensionsSync` API to retrieve image dimensions without loading full image into memory

**Full Changelog**: https://github.com/vizzly-testing/honeydiff/compare/v0.1.0...v0.1.1

## [0.1.0] - 2025-10-21

### Added
- Initial release of `@vizzly-testing/honeydiff` Node.js bindings
- Native Rust bindings via Neon for high-performance image diffing
- `compare` / `compareSync` - Full image comparison with all options
- `quickCompare` / `quickCompareSync` - Fast comparison returning only diff count and match status
- Support for macOS ARM64, Linux x64/ARM64, and Windows x64
- Async and sync variants of all APIs
- TypeScript definitions included
- 1.1B pixels/sec throughput for Full HD images

**Full Changelog**: https://github.com/vizzly-testing/honeydiff/releases/tag/v0.1.0
