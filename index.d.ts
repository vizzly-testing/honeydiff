/**
 * TypeScript definitions for @vizzly-testing/honeydiff
 * High-performance image diffing for Node.js
 */

// ============================================================================
// Core Types
// ============================================================================

export interface BoundingBox {
  /** X coordinate of top-left corner */
  x: number;
  /** Y coordinate of top-left corner */
  y: number;
  /** Width of the bounding box */
  width: number;
  /** Height of the bounding box */
  height: number;
}

export interface HeightDiff {
  /** Height of the first image in pixels */
  height1: number;
  /** Height of the second image in pixels */
  height2: number;
  /** Number of extra pixels due to height difference */
  extraPixels: number;
}

export interface DiffPixel {
  /** X coordinate of the differing pixel */
  x: number;
  /** Y coordinate of the differing pixel */
  y: number;
  /** Intensity of the difference (0-255, higher = more different) */
  intensity: number;
}

export interface IntensityStats {
  /** Maximum difference intensity observed (0-255) */
  max: number;
  /** Minimum difference intensity observed (0-255) */
  min: number;
  /** Mean (average) difference intensity */
  mean: number;
  /** Median difference intensity */
  median: number;
  /** Standard deviation of difference intensities */
  stdDev: number;
}

export interface DiffCluster {
  /** Number of pixels in this cluster */
  pixelCount: number;
  /** Center of mass [x, y] coordinates */
  centerOfMass: [number, number];
  /** Average intensity of differences in this cluster */
  avgIntensity: number;
  /** Bounding box containing this cluster */
  boundingBox: BoundingBox;
}

export interface DiffResult {
  /**
   * Whether the images are different based on the comparison threshold
   * Note: This respects minClusterSize filtering - small clusters may be filtered as noise
   */
  isDifferent: boolean;
  /** Percentage of pixels that differ (0.0 - 100.0) */
  diffPercentage: number;
  /** Total number of pixels compared */
  totalPixels: number;
  /**
   * Number of pixels that differ (raw count, unaffected by minClusterSize filtering)
   * Note: This may be > 0 even when isDifferent is false if small clusters were filtered as noise
   */
  diffPixels: number;
  /** Number of pixels ignored due to anti-aliasing detection */
  aaPixelsIgnored: number;
  /** Percentage of pixels ignored as anti-aliasing (0.0 - 100.0) */
  aaPercentage: number;
  /** Bounding box containing all differences (null if identical) */
  boundingBox: BoundingBox | null;
  /** Height difference information (null if same height) */
  heightDiff: HeightDiff | null;
  /** List of differing pixels with positions and intensities (null unless includeDiffPixels is enabled) */
  diffPixelsList: DiffPixel[] | null;
  /** Clustered groups of connected differing pixels (null unless includeClusters is enabled) */
  diffClusters: DiffCluster[] | null;
  /** Statistical metrics about difference intensities (null unless includeDiffPixels is enabled) */
  intensityStats: IntensityStats | null;
  /** SSIM (Structural Similarity Index) perceptual score 0.0-1.0 (null unless includeSSIM is enabled) */
  perceptualScore: number | null;
  /**
   * GMSD (Gradient Magnitude Similarity Deviation) score (null unless includeGMSD is enabled)
   * Lower values (closer to 0.0) indicate more similar images
   * Typical range: 0.0 to ~0.3 for natural images
   */
  gmsdScore: number | null;
}

// ============================================================================
// Options
// ============================================================================

/**
 * Options for merging nearby clusters
 *
 * These heuristics are designed to merge fragmented text regions (like individual
 * characters in a date string) into logical regions while avoiding merging
 * unrelated visual changes.
 *
 * Inspired by the Stroke Width Transform (SWT) text detection algorithm:
 * Epshtein, B., Ofek, E., & Wexler, Y. (2010). "Detecting Text in Natural Scenes
 * with Stroke Width Transform." CVPR 2010.
 */
export interface ClusterMergeOptions {
  /**
   * Maximum horizontal distance to merge clusters in same Y-band (pixels)
   *
   * Clusters within this horizontal distance and overlapping Y-ranges
   * will be merged. Suitable for merging characters in text.
   * @default 15
   */
  horizontalDistance?: number;

  /**
   * Maximum vertical tolerance for "same Y-band" (pixels)
   *
   * Clusters with Y-ranges within this tolerance of each other are
   * considered to be on the same line.
   * @default 5
   */
  yBandTolerance?: number;

  /**
   * Maximum height ratio between clusters to allow merging
   *
   * Prevents merging clusters of very different sizes (e.g., a word
   * with a large image). Based on SWT heuristic.
   * @default 2.0
   */
  maxHeightRatio?: number;

  /**
   * Maximum width ratio between clusters to allow merging
   *
   * Additional SWT-inspired heuristic to prevent merging dissimilar
   * regions.
   * @default 3.0
   */
  maxWidthRatio?: number;
}

export interface CompareOptions {
  /**
   * Perceptual color difference threshold using CIEDE2000 (Delta E units)
   *
   * The CIEDE2000 standard provides intuitive, perceptually uniform thresholds:
   * - 0.0 = Exact pixel matching (strictest)
   * - 1.0 = Just Noticeable Difference (JND) - barely perceptible to trained observers
   * - 2.0 = Recommended default - ignores sub-pixel rendering variance, catches real differences
   * - 3.0+ = Permissive - high tolerance for rendering variations
   *
   * @default 2.0
   */
  threshold?: number;

  /**
   * Enable anti-aliasing detection to ignore AA differences
   * @default true
   */
  antialiasing?: boolean;

  /**
   * Maximum number of differences to detect before stopping
   * @default undefined (unlimited)
   */
  maxDiffs?: number;

  /**
   * Include list of differing pixels with positions and intensities
   * WARNING: This can use significant memory for images with many differences
   * @default false
   */
  includeDiffPixels?: boolean;

  /**
   * Include clustered groups of connected differing pixels
   * Automatically enables includeDiffPixels if not already enabled
   * Clusters are sorted by size (largest first)
   * @default false
   */
  includeClusters?: boolean;

  /**
   * Calculate SSIM (Structural Similarity Index) perceptual score
   * WARNING: SSIM can be computationally expensive on large images
   * @default false
   */
  includeSSIM?: boolean;

  /**
   * Calculate GMSD (Gradient Magnitude Similarity Deviation) score
   *
   * GMSD is very fast and highly sensitive to edge/structural changes.
   * Useful for detecting border thickness changes, font weight shifts,
   * and icon updates.
   *
   * **Note:** GMSD requires images with identical dimensions. For variable-height
   * comparisons, `gmsdScore` will be `null`. Use SSIM for variable-height images.
   *
   * Reference: Xue et al. 2014 - "Gradient Magnitude Similarity Deviation:
   * A Highly Efficient Perceptual Image Quality Index"
   *
   * @default false
   */
  includeGMSD?: boolean;

  /**
   * Minimum cluster size to count as a real difference
   *
   * Clusters smaller than this threshold are filtered out as noise.
   * This helps ignore run-to-run rendering variance (scattered single pixels)
   * while still catching real visual changes (grouped pixel differences).
   *
   * - 1 = Exact matching - any different pixel counts
   * - 2 = Default - filters single isolated pixels as noise
   * - 3+ = More permissive - only larger clusters detected
   *
   * When set to a value > 1, clustering is automatically enabled.
   * @default 2
   */
  minClusterSize?: number;

  /**
   * Merge nearby clusters into logical regions
   *
   * When enabled, nearby clusters are merged using horizontal-biased heuristics
   * that work well for text regions. This helps consolidate fragmented text
   * changes (e.g., "2024-01-01" showing as 59 clusters) into logical regions.
   *
   * Automatically enables clustering when set.
   *
   * @default undefined (no merging)
   *
   * @example
   * ```typescript
   * // Simple: enable merging with sensible defaults
   * { clusterMerge: true }
   *
   * // Advanced: tune the merging behavior
   * { clusterMerge: { horizontalDistance: 20, yBandTolerance: 10 } }
   * ```
   */
  clusterMerge?: boolean | ClusterMergeOptions;

  /**
   * Path to save the diff image (highlighted differences)
   * @default undefined
   */
  diffPath?: string;

  /**
   * Path to save the mask image (binary diff mask)
   * @default undefined
   */
  maskPath?: string;

  /**
   * Path to save the overlay image (side-by-side comparison)
   * @default undefined
   */
  overlayPath?: string;

  /**
   * Whether to overwrite existing output files
   * @default false
   */
  overwrite?: boolean;

  /**
   * Color to use for highlighting differences in diff/mask output
   *
   * Accepts either:
   * - Hex string: "ff0000", "#ff0000", "ff0000ff" (with alpha)
   * - RGBA array: [255, 0, 0] or [255, 0, 0, 255]
   *
   * @default "ff0000" (red)
   *
   * @example
   * ```typescript
   * // Green highlight using hex
   * { diffMaskColor: "00ff00" }
   *
   * // Blue with 50% transparency using RGBA array
   * { diffMaskColor: [0, 0, 255, 128] }
   *
   * // Magenta using hex with #
   * { diffMaskColor: "#ff00ff" }
   * ```
   */
  diffMaskColor?: string | [number, number, number] | [number, number, number, number];
}

// ============================================================================
// Input Types
// ============================================================================

/** Image input can be a file path or a Buffer containing image data */
export type ImageInput = string | Buffer;

// ============================================================================
// API Functions
// ============================================================================

/**
 * Compare two images asynchronously (recommended)
 *
 * @param img1 - First image (file path or Buffer)
 * @param img2 - Second image (file path or Buffer)
 * @param options - Comparison options
 * @returns Promise resolving to detailed diff results
 *
 * @example
 * ```typescript
 * const result = await compare('baseline.png', 'current.png', {
 *   threshold: 2.0,  // CIEDE2000 Delta E (default)
 *   includeSSIM: true
 * });
 *
 * console.log(`Diff: ${result.diffPercentage.toFixed(2)}%`);
 * console.log(`SSIM: ${result.perceptualScore}`);
 * ```
 */
export function compare(
  img1: ImageInput,
  img2: ImageInput,
  options?: CompareOptions
): Promise<DiffResult>;

/**
 * Quick asynchronous comparison (returns only boolean)
 *
 * @param img1 - First image (file path or Buffer)
 * @param img2 - Second image (file path or Buffer)
 * @returns Promise resolving to true if different, false if identical
 *
 * @example
 * ```typescript
 * if (await quickCompare('baseline.png', 'current.png')) {
 *   console.log('Visual regression detected!');
 * }
 * ```
 */
export function quickCompare(img1: ImageInput, img2: ImageInput): Promise<boolean>;

/**
 * Compare two images synchronously (blocks event loop)
 *
 * Use this only when you need blocking behavior.
 * For most cases, prefer the async compare() function.
 *
 * @param img1 - First image (file path or Buffer)
 * @param img2 - Second image (file path or Buffer)
 * @param options - Comparison options
 * @returns Detailed diff results
 *
 * @example
 * ```typescript
 * const result = compareSync('baseline.png', 'current.png', {
 *   threshold: 3.0,  // More lenient threshold
 *   includeClusters: true
 * });
 *
 * if (result.diffClusters) {
 *   console.log(`Found ${result.diffClusters.length} diff regions`);
 * }
 * ```
 */
export function compareSync(
  img1: ImageInput,
  img2: ImageInput,
  options?: CompareOptions
): DiffResult;

/**
 * Quick synchronous comparison (returns only boolean, blocks event loop)
 *
 * @param img1 - First image (file path or Buffer)
 * @param img2 - Second image (file path or Buffer)
 * @returns true if different, false if identical
 *
 * @example
 * ```typescript
 * if (quickCompareSync('baseline.png', 'current.png')) {
 *   console.log('Images differ');
 * }
 * ```
 */
export function quickCompareSync(img1: ImageInput, img2: ImageInput): boolean;

// ============================================================================
// Dimensions API
// ============================================================================

export interface ImageDimensions {
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
}

export interface ImageMetadata {
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Size of the image data in bytes */
  fileSizeBytes: number;
  /** Detected image format (e.g., "png", "jpeg", "webp") or null if unknown */
  format: string | null;
}

/**
 * Get image dimensions asynchronously (recommended)
 *
 * Fast utility to retrieve image width and height without loading the full image data.
 * Useful for pre-flight checks before comparison.
 *
 * @param img - Image (file path or Buffer)
 * @returns Promise resolving to { width, height } in pixels
 *
 * @example
 * ```typescript
 * const dims = await getDimensions('screenshot.png');
 * console.log(`Image is ${dims.width}x${dims.height} pixels`);
 * // Output: Image is 1920x1080 pixels
 * ```
 */
export function getDimensions(img: ImageInput): Promise<ImageDimensions>;

/**
 * Get image dimensions synchronously (blocks event loop)
 *
 * Fast utility to retrieve image width and height without loading the full image data.
 * Use this only when you need blocking behavior.
 *
 * @param img - Image (file path or Buffer)
 * @returns { width, height } in pixels
 *
 * @example
 * ```typescript
 * const dims = getDimensionsSync('screenshot.png');
 * console.log(`Image is ${dims.width}x${dims.height} pixels`);
 * // Output: Image is 1920x1080 pixels
 * ```
 */
export function getDimensionsSync(img: ImageInput): ImageDimensions;

// ============================================================================
// Image Metadata API
// ============================================================================

/**
 * Get image metadata asynchronously (recommended)
 *
 * Retrieves image dimensions, file size, and format detection.
 * Useful for storage tracking and billing purposes.
 *
 * @param img - Image Buffer
 * @returns Promise resolving to ImageMetadata
 *
 * @example
 * ```typescript
 * const buffer = fs.readFileSync('screenshot.png');
 * const metadata = await getImageMetadata(buffer);
 * console.log(`Image: ${metadata.width}x${metadata.height}`);
 * console.log(`Size: ${metadata.fileSizeBytes} bytes`);
 * console.log(`Format: ${metadata.format}`);
 * // Output: Image: 1920x1080
 * //         Size: 245760 bytes
 * //         Format: png
 * ```
 */
export function getImageMetadata(img: Buffer): Promise<ImageMetadata>;

/**
 * Get image metadata synchronously (blocks event loop)
 *
 * Retrieves image dimensions, file size, and format detection.
 * Use this only when you need blocking behavior.
 *
 * @param img - Image Buffer
 * @returns ImageMetadata
 *
 * @example
 * ```typescript
 * const buffer = fs.readFileSync('screenshot.png');
 * const metadata = getImageMetadataSync(buffer);
 * console.log(`${metadata.width}x${metadata.height}, ${metadata.fileSizeBytes} bytes`);
 * ```
 */
export function getImageMetadataSync(img: Buffer): ImageMetadata;

/**
 * Get image metadata from file asynchronously (recommended)
 *
 * Retrieves image dimensions, file size (from disk), and format detection.
 * The file size is read from filesystem metadata for accuracy.
 *
 * @param path - Path to the image file
 * @returns Promise resolving to ImageMetadata
 *
 * @example
 * ```typescript
 * const metadata = await getImageMetadataFromFile('screenshot.png');
 * console.log(`Image: ${metadata.width}x${metadata.height}`);
 * console.log(`Size: ${metadata.fileSizeBytes} bytes`);
 * console.log(`Format: ${metadata.format}`);
 * ```
 */
export function getImageMetadataFromFile(path: string): Promise<ImageMetadata>;

/**
 * Get image metadata from file synchronously (blocks event loop)
 *
 * Retrieves image dimensions, file size (from disk), and format detection.
 * Use this only when you need blocking behavior.
 *
 * @param path - Path to the image file
 * @returns ImageMetadata
 *
 * @example
 * ```typescript
 * const metadata = getImageMetadataFromFileSync('screenshot.png');
 * console.log(`${metadata.width}x${metadata.height}, ${metadata.fileSizeBytes} bytes`);
 * ```
 */
export function getImageMetadataFromFileSync(path: string): ImageMetadata;

// ============================================================================
// WCAG Accessibility API
// ============================================================================

/**
 * Options for WCAG color contrast analysis
 */
export interface WcagOptions {
  /**
   * Edge detection threshold (0-255)
   * Differences below this threshold are not considered edges
   * @default 60
   */
  edgeThreshold?: number;

  /**
   * Minimum region size (in pixels)
   * Regions smaller than this are filtered out to reduce noise
   * @default 50
   */
  minRegionSize?: number;

  /**
   * Maximum contrast threshold
   * Regions with contrast above this are excluded (gradient filtering)
   * @default 3.5
   */
  maxContrastThreshold?: number;

  /**
   * Check WCAG AA compliance (4.5:1 for normal text, 3.0:1 for large text)
   * @default true
   */
  checkAA?: boolean;

  /**
   * Check WCAG AAA compliance (7.0:1 for normal text, 4.5:1 for large text)
   * @default false
   */
  checkAAA?: boolean;
}

/**
 * A single WCAG color contrast violation region
 */
export interface ContrastViolation {
  /** Bounding box containing this violation region */
  boundingBox: BoundingBox;

  /** List of pixel coordinates [x, y] in this violation */
  pixels: [number, number][];

  /** Center of mass [x, y] of the violation region */
  centerOfMass: [number, number];

  /** Number of pixels in this violation */
  pixelCount: number;

  /** Foreground color [r, g, b, a] (0-255) */
  foregroundColor: [number, number, number, number];

  /** Background color [r, g, b, a] (0-255) */
  backgroundColor: [number, number, number, number];

  /** Foreground relative luminance (0.0-1.0, sRGB) */
  foregroundLuminance: number;

  /** Background relative luminance (0.0-1.0, sRGB) */
  backgroundLuminance: number;

  /** Average contrast ratio for this region (1.0-21.0) */
  contrastRatio: number;

  /** Minimum contrast ratio in this region (worst case) */
  minContrastRatio: number;

  /** Maximum contrast ratio in this region (best case) */
  maxContrastRatio: number;

  /** Whether this region fails WCAG AA for normal text (< 4.5:1) */
  failsAaNormal: boolean;

  /** Whether this region fails WCAG AA for large text (< 3.0:1) */
  failsAaLarge: boolean;

  /** Whether this region fails WCAG AAA for normal text (< 7.0:1) */
  failsAaaNormal: boolean;

  /** Whether this region fails WCAG AAA for large text (< 4.5:1) */
  failsAaaLarge: boolean;
}

/**
 * Complete WCAG accessibility analysis result
 */
export interface WcagAnalysis {
  /** Total number of edges analyzed */
  totalEdges: number;

  /** Number of edges passing WCAG AA for normal text */
  aaNormalPass: number;

  /** Number of edges passing WCAG AA for large text */
  aaLargePass: number;

  /** Number of edges passing WCAG AAA for normal text */
  aaaNormalPass: number;

  /** Number of edges passing WCAG AAA for large text */
  aaaLargePass: number;

  /** List of contrast violations found */
  violations: ContrastViolation[];

  /** Percentage of edges passing WCAG AA for normal text (0.0-100.0) */
  aaNormalPassPercentage: number;

  /** Percentage of edges passing WCAG AA for large text (0.0-100.0) */
  aaLargePassPercentage: number;

  /** Percentage of edges passing WCAG AAA for normal text (0.0-100.0) */
  aaaNormalPassPercentage: number;

  /** Percentage of edges passing WCAG AAA for large text (0.0-100.0) */
  aaaLargePassPercentage: number;
}

/**
 * Analyze WCAG color contrast accessibility asynchronously (recommended)
 *
 * Detects text/content edges in an image and checks if they meet WCAG contrast requirements.
 * This is useful for catching accessibility issues in screenshots and UI designs.
 *
 * @param img - Image to analyze (file path or Buffer)
 * @param options - WCAG analysis options
 * @returns Promise resolving to detailed accessibility analysis
 *
 * @example
 * ```typescript
 * const analysis = await analyzeWcagContrast('screenshot.png', {
 *   edgeThreshold: 60,
 *   checkAA: true,
 *   checkAAA: true
 * });
 *
 * console.log(`Total edges: ${analysis.totalEdges}`);
 * console.log(`AA pass rate: ${analysis.aaNormalPassPercentage.toFixed(1)}%`);
 * console.log(`Found ${analysis.violations.length} violations`);
 *
 * for (let violation of analysis.violations.slice(0, 5)) {
 *   console.log(`Region at (${violation.boundingBox.x}, ${violation.boundingBox.y})`);
 *   console.log(`  Contrast: ${violation.contrastRatio.toFixed(2)}:1`);
 *   console.log(`  Fails AA: ${violation.failsAaNormal}`);
 * }
 * ```
 */
export function analyzeWcagContrast(img: ImageInput, options?: WcagOptions): Promise<WcagAnalysis>;

/**
 * Analyze WCAG color contrast accessibility synchronously (blocks event loop)
 *
 * Use this only when you need blocking behavior.
 * For most cases, prefer the async analyzeWcagContrast() function.
 *
 * @param img - Image to analyze (file path or Buffer)
 * @param options - WCAG analysis options
 * @returns Detailed accessibility analysis
 *
 * @example
 * ```typescript
 * const analysis = analyzeWcagContrastSync('screenshot.png', {
 *   minRegionSize: 50
 * });
 *
 * if (analysis.violations.length > 0) {
 *   console.log('Accessibility issues found!');
 * }
 * ```
 */
export function analyzeWcagContrastSync(img: ImageInput, options?: WcagOptions): WcagAnalysis;

/**
 * Options for saving WCAG overlay images
 */
export interface WcagOutputOptions {
  /**
   * Highlight color for violations [r, g, b, a] (0-255)
   * @default [255, 0, 0, 180] (semi-transparent red)
   */
  highlightColor?: [number, number, number, number];

  /**
   * Whether to overwrite existing output file
   * @default false
   */
  overwrite?: boolean;
}

/**
 * Save WCAG violation overlay image asynchronously (recommended)
 *
 * Generates an image with contrast violations highlighted in red (or custom color).
 * Useful for visual debugging of accessibility issues.
 *
 * @param img - Original image (file path or Buffer)
 * @param analysis - WCAG analysis result from analyzeWcagContrast()
 * @param outputPath - Path to save the overlay image
 * @param options - Output options
 * @returns Promise that resolves when the file is saved
 *
 * @example
 * ```typescript
 * const analysis = await analyzeWcagContrast('screenshot.png');
 *
 * await saveWcagOverlay(
 *   'screenshot.png',
 *   analysis,
 *   'violations-overlay.png',
 *   { highlightColor: [255, 0, 0, 180] }
 * );
 *
 * console.log('Overlay saved to violations-overlay.png');
 * ```
 */
export function saveWcagOverlay(
  img: ImageInput,
  analysis: WcagAnalysis,
  outputPath: string,
  options?: WcagOutputOptions
): Promise<void>;

/**
 * Save WCAG violation overlay image synchronously (blocks event loop)
 *
 * Use this only when you need blocking behavior.
 * For most cases, prefer the async saveWcagOverlay() function.
 *
 * @param img - Original image (file path or Buffer)
 * @param analysis - WCAG analysis result from analyzeWcagContrastSync()
 * @param outputPath - Path to save the overlay image
 * @param options - Output options
 *
 * @example
 * ```typescript
 * const analysis = analyzeWcagContrastSync('screenshot.png');
 * saveWcagOverlaySync('screenshot.png', analysis, 'violations.png');
 * ```
 */
export function saveWcagOverlaySync(
  img: ImageInput,
  analysis: WcagAnalysis,
  outputPath: string,
  options?: WcagOutputOptions
): void;

// ============================================================================
// Color Vision Deficiency (CVD) Simulation API
// ============================================================================

/**
 * Types of color vision deficiency (color blindness) that can be simulated.
 *
 * - `protanopia` - Red-blind (~1% of males). Reds appear dark/muddy, red-green confusion.
 * - `deuteranopia` - Green-blind (~1% of males, most common). Greens shift toward red/brown.
 * - `tritanopia` - Blue-blind (~0.003% of population). Blues appear greenish, yellow-purple confusion.
 * - `achromatopsia` - Complete color blindness (very rare). Only luminance is perceived.
 *
 * Short aliases are also accepted: `protan`, `deutan`, `tritan`, `achroma`, `monochromacy`
 */
export type ColorBlindnessType =
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'achromatopsia'
  | 'protan'
  | 'deutan'
  | 'tritan'
  | 'achroma'
  | 'monochromacy';

/**
 * Information about a color blindness type
 */
export interface ColorBlindnessTypeInfo {
  /** The canonical type identifier (e.g., "protanopia") */
  type: string;
  /** Human-readable name (e.g., "Protanopia") */
  name: string;
  /** Description of what colors are affected */
  description: string;
  /** Approximate prevalence in the population */
  prevalence: string;
}

/**
 * Comprehensive WCAG analysis report for all color vision deficiency types.
 *
 * Contains WCAG contrast analysis for normal vision and all three main types
 * of dichromatic color blindness (protanopia, deuteranopia, tritanopia).
 */
export interface CvdWcagReport {
  /** WCAG analysis for normal (typical) color vision */
  normalVision: WcagAnalysis;

  /** WCAG analysis simulating protanopia (red-blind) */
  protanopia: WcagAnalysis;

  /** WCAG analysis simulating deuteranopia (green-blind) */
  deuteranopia: WcagAnalysis;

  /** WCAG analysis simulating tritanopia (blue-blind) */
  tritanopia: WcagAnalysis;

  /** Whether any CVD type has violations */
  hasAnyViolations: boolean;

  /** Total number of violations across all CVD types */
  totalViolations: number;

  /**
   * Estimated count of violations unique to colorblind users.
   * These are violations present in CVD analysis but not in normal vision.
   */
  cvdOnlyViolationCount: number;
}

/**
 * Simulate color blindness for an image asynchronously (recommended)
 *
 * Transforms the input image to show how it appears to someone with the
 * specified type of color vision deficiency. Uses the Brettel, Viénot & Mollon
 * 1997 algorithm, which is considered the gold standard for CVD simulation.
 *
 * @param img - Image to transform (file path or Buffer)
 * @param cvdType - Type of color blindness to simulate
 * @returns Promise resolving to a Buffer containing the simulated PNG image
 *
 * @example
 * ```typescript
 * import { simulateColorBlindness } from '@vizzly-testing/honeydiff';
 * import fs from 'fs';
 *
 * // Simulate how an image appears to someone with red-green color blindness
 * const simulated = await simulateColorBlindness('chart.png', 'deuteranopia');
 *
 * // Save the result
 * fs.writeFileSync('chart-deuteranopia.png', simulated);
 *
 * // Or use directly with image comparison
 * const result = await compare('chart.png', simulated);
 * ```
 */
export function simulateColorBlindness(
  img: ImageInput,
  cvdType: ColorBlindnessType
): Promise<Buffer>;

/**
 * Simulate color blindness for an image synchronously (blocks event loop)
 *
 * Use this only when you need blocking behavior.
 * For most cases, prefer the async simulateColorBlindness() function.
 *
 * @param img - Image to transform (file path or Buffer)
 * @param cvdType - Type of color blindness to simulate
 * @returns Buffer containing the simulated PNG image
 *
 * @example
 * ```typescript
 * const simulated = simulateColorBlindnessSync('button.png', 'protanopia');
 * fs.writeFileSync('button-protanopia.png', simulated);
 * ```
 */
export function simulateColorBlindnessSync(img: ImageInput, cvdType: ColorBlindnessType): Buffer;

/**
 * Simulate and save color blindness image to file asynchronously (recommended)
 *
 * Convenience function that simulates CVD and saves the output in one step.
 *
 * @param img - Image to transform (file path or Buffer)
 * @param cvdType - Type of color blindness to simulate
 * @param outputPath - Path where the simulated image should be saved
 * @returns Promise that resolves when the file is saved
 *
 * @example
 * ```typescript
 * // Save a single simulation
 * await saveColorBlindnessSimulation('ui.png', 'deuteranopia', 'ui-deutan.png');
 *
 * // Generate simulations for all types you care about
 * for (const type of ['protanopia', 'deuteranopia', 'tritanopia']) {
 *   await saveColorBlindnessSimulation('ui.png', type, `ui-${type}.png`);
 * }
 * ```
 */
export function saveColorBlindnessSimulation(
  img: ImageInput,
  cvdType: ColorBlindnessType,
  outputPath: string
): Promise<void>;

/**
 * Simulate and save color blindness image to file synchronously (blocks event loop)
 *
 * Use this only when you need blocking behavior.
 *
 * @param img - Image to transform (file path or Buffer)
 * @param cvdType - Type of color blindness to simulate
 * @param outputPath - Path where the simulated image should be saved
 *
 * @example
 * ```typescript
 * saveColorBlindnessSimulationSync('chart.png', 'tritanopia', 'chart-tritan.png');
 * ```
 */
export function saveColorBlindnessSimulationSync(
  img: ImageInput,
  cvdType: ColorBlindnessType,
  outputPath: string
): void;

/**
 * Generate and save all CVD simulations to files asynchronously (recommended)
 *
 * Generates simulated images for all CVD types (protanopia, deuteranopia,
 * tritanopia, achromatopsia), saving each with a suffix indicating the type.
 *
 * @param img - Image to transform (file path or Buffer)
 * @param outputPrefix - Base path for output files (without extension)
 * @param extension - File extension to use (default: "png")
 * @returns Promise that resolves when all files are saved
 *
 * @example
 * ```typescript
 * // Creates: dashboard_protanopia.png, dashboard_deuteranopia.png,
 * //          dashboard_tritanopia.png, dashboard_achromatopsia.png
 * await saveAllColorBlindnessSimulations('dashboard.png', 'dashboard', 'png');
 *
 * // With different extension
 * await saveAllColorBlindnessSimulations('ui.png', './artifacts/ui', 'jpg');
 * ```
 */
export function saveAllColorBlindnessSimulations(
  img: ImageInput,
  outputPrefix: string,
  extension?: string
): Promise<void>;

/**
 * Generate and save all CVD simulations to files synchronously (blocks event loop)
 *
 * Use this only when you need blocking behavior.
 *
 * @param img - Image to transform (file path or Buffer)
 * @param outputPrefix - Base path for output files (without extension)
 * @param extension - File extension to use (default: "png")
 *
 * @example
 * ```typescript
 * saveAllColorBlindnessSimulationsSync('button.png', 'button');
 * ```
 */
export function saveAllColorBlindnessSimulationsSync(
  img: ImageInput,
  outputPrefix: string,
  extension?: string
): void;

/**
 * Analyze WCAG contrast for a specific color blindness type asynchronously (recommended)
 *
 * Simulates the image as seen by someone with the specified color vision
 * deficiency, then runs WCAG contrast analysis. This finds contrast violations
 * that only appear for colorblind users - critical for inclusive design.
 *
 * @param img - Image to analyze (file path or Buffer)
 * @param cvdType - Type of color blindness to simulate
 * @param options - WCAG analysis options
 * @returns Promise resolving to WCAG analysis results for the simulated image
 *
 * @example
 * ```typescript
 * // Check if colors are distinguishable for deuteranopia users
 * const analysis = await analyzeWcagForCvd('ui.png', 'deuteranopia', {
 *   checkAA: true,
 *   checkAAA: false
 * });
 *
 * if (analysis.violations.length > 0) {
 *   console.log(`Found ${analysis.violations.length} contrast issues`);
 *   console.log('for users with red-green color blindness');
 * }
 * ```
 */
export function analyzeWcagForCvd(
  img: ImageInput,
  cvdType: ColorBlindnessType,
  options?: WcagOptions
): Promise<WcagAnalysis>;

/**
 * Analyze WCAG contrast for a specific color blindness type synchronously (blocks event loop)
 *
 * Use this only when you need blocking behavior.
 *
 * @param img - Image to analyze (file path or Buffer)
 * @param cvdType - Type of color blindness to simulate
 * @param options - WCAG analysis options
 * @returns WCAG analysis results for the simulated image
 *
 * @example
 * ```typescript
 * const analysis = analyzeWcagForCvdSync('chart.png', 'protanopia');
 * console.log(`Pass rate: ${analysis.aaNormalPassPercentage.toFixed(1)}%`);
 * ```
 */
export function analyzeWcagForCvdSync(
  img: ImageInput,
  cvdType: ColorBlindnessType,
  options?: WcagOptions
): WcagAnalysis;

/**
 * Analyze WCAG contrast for all CVD types asynchronously (recommended)
 *
 * Runs WCAG contrast analysis for normal vision and all three main types of
 * dichromatic color blindness. This provides a comprehensive accessibility
 * report covering the majority of color vision deficiencies.
 *
 * @param img - Image to analyze (file path or Buffer)
 * @param options - WCAG analysis options (same options used for all analyses)
 * @returns Promise resolving to a report containing WCAG analysis for each vision type
 *
 * @example
 * ```typescript
 * const report = await analyzeWcagAllCvd('dashboard.png', {
 *   checkAA: true,
 *   checkAAA: true
 * });
 *
 * console.log('Accessibility Report:');
 * console.log(`Normal vision violations: ${report.normalVision.violations.length}`);
 * console.log(`Protanopia violations: ${report.protanopia.violations.length}`);
 * console.log(`Deuteranopia violations: ${report.deuteranopia.violations.length}`);
 * console.log(`Tritanopia violations: ${report.tritanopia.violations.length}`);
 *
 * if (report.hasAnyViolations) {
 *   console.log(`\nTotal issues found: ${report.totalViolations}`);
 *   console.log(`Issues only affecting colorblind users: ~${report.cvdOnlyViolationCount}`);
 * }
 * ```
 */
export function analyzeWcagAllCvd(img: ImageInput, options?: WcagOptions): Promise<CvdWcagReport>;

/**
 * Analyze WCAG contrast for all CVD types synchronously (blocks event loop)
 *
 * Use this only when you need blocking behavior.
 *
 * @param img - Image to analyze (file path or Buffer)
 * @param options - WCAG analysis options
 * @returns Report containing WCAG analysis for each vision type
 *
 * @example
 * ```typescript
 * const report = analyzeWcagAllCvdSync('ui.png');
 *
 * if (report.hasAnyViolations) {
 *   console.log('Accessibility issues detected!');
 * }
 * ```
 */
export function analyzeWcagAllCvdSync(img: ImageInput, options?: WcagOptions): CvdWcagReport;

/**
 * Get metadata about all supported color blindness types
 *
 * Returns information about each CVD type including name, description,
 * and prevalence. Useful for building UI selectors or generating reports.
 *
 * @returns Array of color blindness type information
 *
 * @example
 * ```typescript
 * const types = getColorBlindnessTypes();
 *
 * for (const cvd of types) {
 *   console.log(`${cvd.name} (${cvd.type})`);
 *   console.log(`  ${cvd.description}`);
 *   console.log(`  Affects: ${cvd.prevalence}`);
 * }
 *
 * // Output:
 * // Protanopia (protanopia)
 * //   Red-blind: reds appear dark, red-green confusion
 * //   Affects: ~1% of males
 * // Deuteranopia (deuteranopia)
 * //   Green-blind: greens shift to brown, red-green confusion
 * //   Affects: ~1% of males
 * // ...
 * ```
 */
export function getColorBlindnessTypes(): ColorBlindnessTypeInfo[];

// ============================================================================
// Diff Fingerprint API
// ============================================================================

/**
 * Magnitude of a diff, bucketed into categories
 */
export type DiffMagnitude = 'tiny' | 'small' | 'medium' | 'large' | 'massive';

/**
 * A compact fingerprint representing a diff's key characteristics.
 * Used for grouping similar diffs across comparisons.
 */
export interface DiffFingerprint {
  /** Number of clusters (distinct change regions) */
  clusterCount: number;

  /** Normalized positions of cluster centers (0.0-1.0 relative to image dimensions) */
  clusterPositions: [number, number][];

  /** Normalized sizes of clusters (area as ratio of total image area) */
  clusterSizes: number[];

  /** Average intensity across all clusters (0-255 scale) */
  avgIntensity: number;

  /** Average cluster density (pixels / bounding_box_area) */
  avgDensity: number;

  /**
   * Spatial distribution hash using a 4x4 grid (16 zones).
   * Each bit represents whether that zone contains a cluster center.
   */
  zoneMask: number;

  /** Overall diff percentage bucketed into categories */
  diffMagnitude: DiffMagnitude;

  /** Pre-computed coarse hash for fast grouping (hex string) */
  hash: string;
}

/**
 * Compute a fingerprint from a diff result (synchronous)
 *
 * Creates a compact fingerprint that can be used to identify and group similar diffs
 * across different image comparisons. Requires that the diff result was computed with
 * `includeClusters: true`.
 *
 * @param diffResult - The result from a compare() call with clusters enabled
 * @param imageWidth - Width of the compared images in pixels
 * @param imageHeight - Height of the compared images in pixels
 * @returns A DiffFingerprint object, or null if no clusters are present
 *
 * @example
 * ```typescript
 * const result = await compare('baseline.png', 'current.png', {
 *   includeClusters: true
 * });
 *
 * const fingerprint = computeFingerprintSync(result, 1920, 1080);
 * if (fingerprint) {
 *   console.log(`Hash: ${fingerprint.hash}`);
 *   console.log(`Zones: ${fingerprint.zoneMask.toString(2).padStart(16, '0')}`);
 * }
 * ```
 */
export function computeFingerprintSync(
  diffResult: DiffResult,
  imageWidth: number,
  imageHeight: number
): DiffFingerprint | null;

/**
 * Compare two fingerprints and return a similarity score (synchronous)
 *
 * Returns a score from 0.0 (completely different) to 1.0 (identical).
 * The similarity is computed using weighted factors:
 * - Zone mask overlap (40%): Same regions affected
 * - Cluster count similarity (20%): Similar number of change regions
 * - Diff magnitude match (15%): Similar overall change size
 * - Density similarity (15%): Similar change patterns (solid vs scattered)
 * - Intensity similarity (10%): Similar change intensity
 *
 * @param fp1 - First fingerprint to compare
 * @param fp2 - Second fingerprint to compare
 * @returns Similarity score from 0.0 to 1.0
 *
 * @example
 * ```typescript
 * const similarity = fingerprintSimilaritySync(fp1, fp2);
 * if (similarity > 0.8) {
 *   console.log('These diffs are likely the same change!');
 * }
 * ```
 */
export function fingerprintSimilaritySync(fp1: DiffFingerprint, fp2: DiffFingerprint): number;

/**
 * Get the coarse hash of a fingerprint (synchronous)
 *
 * Returns a hex string that can be used for fast exact-match grouping.
 * Diffs with the same coarse hash are very likely to be the same visual change.
 *
 * The hash combines:
 * - Zone mask (16 bits): Which regions are affected
 * - Diff magnitude (3 bits): Overall change size
 * - Cluster count bucket (2 bits): Number of change regions
 *
 * @param fingerprint - The fingerprint to hash
 * @returns A 16-character hex string
 *
 * @example
 * ```typescript
 * const hash = fingerprintHashSync(fingerprint);
 * console.log(`Hash: ${hash}`); // e.g., "0000000000000021"
 *
 * // Use for grouping
 * const groups = new Map<string, DiffFingerprint[]>();
 * for (const fp of fingerprints) {
 *   const h = fingerprintHashSync(fp);
 *   if (!groups.has(h)) groups.set(h, []);
 *   groups.get(h)!.push(fp);
 * }
 * ```
 */
export function fingerprintHashSync(fingerprint: DiffFingerprint): string;
