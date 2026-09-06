/**
 * @vizzly-testing/honeydiff - Native Node.js bindings for Honeydiff
 */

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

let addon;
let packageMetadata = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// Try to load the native addon:
// 1. First try load-platform.cjs (exists in published npm package with multi-platform binaries)
// 2. Fall back to index.node (exists in local development builds)
const platformLoaderPath = join(__dirname, 'load-platform.cjs');

if (existsSync(platformLoaderPath)) {
  // Published package: use platform-specific loader (CommonJS)
  addon = require(platformLoaderPath);
} else {
  // Local development: use directly built index.node
  try {
    addon = require('./index.node');
  } catch (e) {
    throw new Error(
      '@vizzly-testing/honeydiff: Failed to load native binary.\n' +
        'If developing locally, run "cargo build --release" first.\n' +
        'Original error: ' +
        e.message
    );
  }
}

// Core comparison API
export const compare = addon.compare;
export const compareSync = addon.compareSync;
export const imagesDiffer = addon.imagesDiffer;
export const imagesDifferSync = addon.imagesDifferSync;
export const analyze = addon.analyze;
export const analyzeSync = addon.analyzeSync;
export const configureThreads = addon.configureThreads;
export const getDimensions = addon.getDimensions;
export const getDimensionsSync = addon.getDimensionsSync;
export const version = packageMetadata.version;

// Image Metadata API
export const getImageMetadata = addon.getImageMetadata;
export const getImageMetadataSync = addon.getImageMetadataSync;
export const getImageMetadataFromFile = addon.getImageMetadataFromFile;
export const getImageMetadataFromFileSync = addon.getImageMetadataFromFileSync;

// Screenshot Contrast Screening API
export const analyzeWcagContrast = addon.analyzeWcagContrast;
export const analyzeWcagContrastSync = addon.analyzeWcagContrastSync;
export const saveWcagOverlay = addon.saveWcagOverlay;
export const saveWcagOverlaySync = addon.saveWcagOverlaySync;

// Color Vision Deficiency (CVD) Simulation API
export const simulateColorBlindness = addon.simulateColorBlindness;
export const simulateColorBlindnessSync = addon.simulateColorBlindnessSync;
export const saveColorBlindnessSimulation = addon.saveColorBlindnessSimulation;
export const saveColorBlindnessSimulationSync = addon.saveColorBlindnessSimulationSync;
export const saveAllColorBlindnessSimulations = addon.saveAllColorBlindnessSimulations;
export const saveAllColorBlindnessSimulationsSync = addon.saveAllColorBlindnessSimulationsSync;
export const analyzeWcagForCvd = addon.analyzeWcagForCvd;
export const analyzeWcagForCvdSync = addon.analyzeWcagForCvdSync;
export const analyzeWcagAllCvd = addon.analyzeWcagAllCvd;
export const analyzeWcagAllCvdSync = addon.analyzeWcagAllCvdSync;
export const getColorBlindnessTypes = addon.getColorBlindnessTypes;

// Diff fingerprints are pure derivatives of the returned analysis.
export function computeFingerprintSync(analysis) {
  let regions = analysis.difference.regions;
  if (regions.length === 0) return null;

  let width = analysis.images.canvas.width;
  let height = analysis.images.canvas.height;
  let canvasArea = width * height;
  let regionPositions = regions.map(({ spatial }) => [
    spatial.centroid.x / width,
    spatial.centroid.y / height,
  ]);
  let regionSizes = regions.map(
    ({ spatial }) => (spatial.bounds.width * spatial.bounds.height) / canvasArea
  );
  let averageDensity =
    regions.reduce((total, region) => total + region.spatial.density, 0) / regions.length;
  let zoneMask = regions.reduce((mask, region) => {
    let zoneX = Math.min(3, Math.floor((region.spatial.centroid.x / width) * 4));
    let zoneY = Math.min(3, Math.floor((region.spatial.centroid.y / height) * 4));
    return mask | (1 << (zoneY * 4 + zoneX));
  }, 0);
  let fraction = analysis.difference.fraction;
  let diffMagnitude =
    fraction < 0.001
      ? 'tiny'
      : fraction < 0.01
        ? 'small'
        : fraction < 0.05
          ? 'medium'
          : fraction < 0.2
            ? 'large'
            : 'massive';
  let fingerprint = {
    regionCount: regions.length,
    regionPositions,
    regionSizes,
    meanDeltaE: analysis.difference.appearance?.mean ?? null,
    averageDensity,
    zoneMask,
    diffMagnitude,
    hash: '',
  };
  fingerprint.hash = fingerprintHashSync(fingerprint);
  return fingerprint;
}

export function fingerprintSimilaritySync(left, right) {
  let intersection = left.zoneMask & right.zoneMask;
  let union = left.zoneMask | right.zoneMask;
  let bitCount = (value) => {
    let count = 0;
    for (let remaining = value; remaining !== 0; remaining >>>= 1) count += remaining & 1;
    return count;
  };
  let weighted = (bitCount(intersection) / Math.max(1, bitCount(union))) * 40;
  let weights = 40;
  weighted += (1 / (1 + Math.abs(left.regionCount - right.regionCount) * 0.5)) * 20;
  weights += 20;
  weighted += (left.diffMagnitude === right.diffMagnitude ? 1 : 0) * 15;
  weights += 15;
  weighted += (1 / (1 + Math.abs(left.averageDensity - right.averageDensity) * 5)) * 15;
  weights += 15;
  if (left.meanDeltaE !== null && right.meanDeltaE !== null) {
    weighted += (1 / (1 + Math.abs(left.meanDeltaE - right.meanDeltaE) / 10)) * 10;
    weights += 10;
  }
  return weighted / weights;
}

export function fingerprintHashSync(fingerprint) {
  let magnitude = ['tiny', 'small', 'medium', 'large', 'massive'].indexOf(
    fingerprint.diffMagnitude
  );
  if (magnitude === -1) throw new TypeError('Invalid diffMagnitude');
  let countBucket =
    fingerprint.regionCount === 1
      ? 0
      : fingerprint.regionCount <= 3
        ? 1
        : fingerprint.regionCount <= 10
          ? 2
          : 3;
  let value = fingerprint.zoneMask * 32 + magnitude * 4 + countBucket;
  return value.toString(16).padStart(16, '0');
}
