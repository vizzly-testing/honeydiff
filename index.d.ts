/** Data-only Node.js API for Honeydiff image analysis. */

export type ImageInput = string | Buffer;

export interface ImageSize {
  width: number;
  height: number;
}

export interface BoundingBox extends ImageSize {
  x: number;
  y: number;
}

export interface Centroid {
  x: number;
  y: number;
}

export interface PopulationSummary {
  count: number;
  fraction: number;
  bounds: BoundingBox | null;
  centroid: Centroid | null;
}

export interface ComponentSizeSummary {
  min: number;
  max: number;
  mean: number;
  standardDeviation: number;
}

export interface SmallRegionSummary extends PopulationSummary {
  componentCount: number;
  componentSizes: ComponentSizeSummary | null;
}

export interface PixelAnalysis {
  total: number;
  renderedEqual: number;
  suppressed: {
    belowThreshold: PopulationSummary;
    antialiasing: PopulationSummary;
    smallRegions: SmallRegionSummary;
  };
  changed: {
    total: number;
    visual: number;
    structural: number;
    added: number;
    removed: number;
  };
}

export interface SpatialSummary {
  bounds: BoundingBox;
  pixelCount: number;
  density: number;
  centroid: Centroid;
  perimeter: number;
}

export interface DeltaESummary {
  sampleCount: number;
  min: number;
  max: number;
  mean: number;
  standardDeviation: number;
}

export interface DiffRegion {
  spatial: SpatialSummary;
  visualPixels: number;
  addedPixels: number;
  removedPixels: number;
  appearance: DeltaESummary | null;
}

export interface DiffAnalysis {
  different: boolean;
  settings: {
    threshold: number;
    antialiasing: boolean;
    minimumRegionPixels: number;
    alignHeightChanges: boolean;
  };
  images: {
    baseline: ImageSize;
    current: ImageSize;
    canvas: ImageSize;
  };
  pixels: PixelAnalysis;
  difference: {
    fraction: number;
    spatial: SpatialSummary | null;
    appearance: DeltaESummary | null;
    regions: DiffRegion[];
  };
  heightChange: {
    direction: 'added' | 'removed';
    rowCount: number;
    startRow: number;
    alignmentApplied: boolean;
  } | null;
}

export interface PerceptionAnalysis {
  ssim: number;
  msSsim: number;
  gmsd: number;
  measured: {
    width: number;
    pairedRows: number;
    baselineExcludedRows: number;
    currentExcludedRows: number;
  };
}

export interface ImageAnalysis {
  comparison: DiffAnalysis;
  perception: PerceptionAnalysis;
}

export interface CompareOptions {
  /** CIEDE2000 threshold. Default: 2. */
  threshold?: number;
  /** Ignore detected raster anti-aliasing movement. Default: true. */
  antialiasing?: boolean;
  /** Smallest retained 8-connected visual region. Default: 2. */
  minimumRegionPixels?: number;
  /** Detect and align one unambiguous inserted or removed row block. Default: false. */
  alignHeightChanges?: boolean;
}

export interface ArtifactOutput {
  diffPath?: string;
  maskPath?: string;
  sideBySidePath?: string;
  overwrite?: boolean;
  /** Opaque artifact color as six-digit hex or integer RGB channels. */
  color?: string | [number, number, number];
}

export const version: string;
/**
 * Set one process-wide HoneyDiff compute budget before the first operation.
 * Repeating the same value is safe; changing it after work starts throws.
 */
export function configureThreads(threads: number): void;
export function compare(
  baseline: ImageInput,
  current: ImageInput,
  options?: CompareOptions,
  output?: ArtifactOutput
): Promise<DiffAnalysis>;
export function compareSync(
  baseline: ImageInput,
  current: ImageInput,
  options?: CompareOptions,
  output?: ArtifactOutput
): DiffAnalysis;
export function imagesDiffer(
  baseline: ImageInput,
  current: ImageInput,
  options?: CompareOptions
): Promise<boolean>;
export function imagesDifferSync(
  baseline: ImageInput,
  current: ImageInput,
  options?: CompareOptions
): boolean;
export function analyze(
  baseline: ImageInput,
  current: ImageInput,
  options?: CompareOptions,
  output?: ArtifactOutput
): Promise<ImageAnalysis>;
export function analyzeSync(
  baseline: ImageInput,
  current: ImageInput,
  options?: CompareOptions,
  output?: ArtifactOutput
): ImageAnalysis;

export interface ImageDimensions {
  width: number;
  height: number;
}
export interface ImageMetadata extends ImageDimensions {
  fileSizeBytes: number;
  format: string | null;
}
export function getDimensions(image: ImageInput): Promise<ImageDimensions>;
export function getDimensionsSync(image: ImageInput): ImageDimensions;
export function getImageMetadata(image: Buffer): Promise<ImageMetadata>;
export function getImageMetadataSync(image: Buffer): ImageMetadata;
export function getImageMetadataFromFile(path: string): Promise<ImageMetadata>;
export function getImageMetadataFromFileSync(path: string): ImageMetadata;

export interface WcagOptions {
  edgeThreshold?: number;
  minRegionSize?: number;
  maxContrastThreshold?: number;
  checkAA?: boolean;
  checkAAA?: boolean;
}
export interface ContrastViolation {
  boundingBox: BoundingBox;
  pixels: [number, number][];
  centerOfMass: [number, number];
  pixelCount: number;
  foregroundColor: [number, number, number, number];
  backgroundColor: [number, number, number, number];
  foregroundLuminance: number;
  backgroundLuminance: number;
  contrastRatio: number;
  minContrastRatio: number;
  maxContrastRatio: number;
  failsAaNormal: boolean;
  failsAaLarge: boolean;
  failsAaaNormal: boolean;
  failsAaaLarge: boolean;
}
export interface WcagAnalysis {
  totalEdges: number;
  aaNormalPass: number;
  aaLargePass: number;
  aaaNormalPass: number;
  aaaLargePass: number;
  violations: ContrastViolation[];
  aaNormalPassPercentage: number;
  aaLargePassPercentage: number;
  aaaNormalPassPercentage: number;
  aaaLargePassPercentage: number;
}
export interface WcagOutputOptions {
  highlightColor?: [number, number, number, number];
  overwrite?: boolean;
}
export function analyzeWcagContrast(
  image: ImageInput,
  options?: WcagOptions
): Promise<WcagAnalysis>;
export function analyzeWcagContrastSync(image: ImageInput, options?: WcagOptions): WcagAnalysis;
export function saveWcagOverlay(
  image: ImageInput,
  analysis: WcagAnalysis,
  outputPath: string,
  options?: WcagOutputOptions
): Promise<void>;
export function saveWcagOverlaySync(
  image: ImageInput,
  analysis: WcagAnalysis,
  outputPath: string,
  options?: WcagOutputOptions
): void;

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
export interface ColorBlindnessTypeInfo {
  type: string;
  name: string;
  description: string;
  prevalence: string;
}
export interface CvdWcagReport {
  normalVision: WcagAnalysis;
  protanopia: WcagAnalysis;
  deuteranopia: WcagAnalysis;
  tritanopia: WcagAnalysis;
  hasAnyViolations: boolean;
  totalViolations: number;
  cvdOnlyViolationCount: number;
}
export function simulateColorBlindness(
  image: ImageInput,
  type: ColorBlindnessType
): Promise<Buffer>;
export function simulateColorBlindnessSync(image: ImageInput, type: ColorBlindnessType): Buffer;
export function saveColorBlindnessSimulation(
  image: ImageInput,
  type: ColorBlindnessType,
  outputPath: string
): Promise<void>;
export function saveColorBlindnessSimulationSync(
  image: ImageInput,
  type: ColorBlindnessType,
  outputPath: string
): void;
export function saveAllColorBlindnessSimulations(
  image: ImageInput,
  outputPrefix: string,
  extension?: string
): Promise<void>;
export function saveAllColorBlindnessSimulationsSync(
  image: ImageInput,
  outputPrefix: string,
  extension?: string
): void;
export function analyzeWcagForCvd(
  image: ImageInput,
  type: ColorBlindnessType,
  options?: WcagOptions
): Promise<WcagAnalysis>;
export function analyzeWcagForCvdSync(
  image: ImageInput,
  type: ColorBlindnessType,
  options?: WcagOptions
): WcagAnalysis;
export function analyzeWcagAllCvd(image: ImageInput, options?: WcagOptions): Promise<CvdWcagReport>;
export function analyzeWcagAllCvdSync(image: ImageInput, options?: WcagOptions): CvdWcagReport;
export function getColorBlindnessTypes(): ColorBlindnessTypeInfo[];

export type DiffMagnitude = 'tiny' | 'small' | 'medium' | 'large' | 'massive';
export interface DiffFingerprint {
  regionCount: number;
  regionPositions: [number, number][];
  regionSizes: number[];
  meanDeltaE: number | null;
  averageDensity: number;
  zoneMask: number;
  diffMagnitude: DiffMagnitude;
  hash: string;
}
export function computeFingerprintSync(analysis: DiffAnalysis): DiffFingerprint | null;
export function fingerprintSimilaritySync(left: DiffFingerprint, right: DiffFingerprint): number;
export function fingerprintHashSync(fingerprint: DiffFingerprint): string;
