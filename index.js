/**
 * @vizzly-testing/honeydiff - Native Node.js bindings for Honeydiff
 */

import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

let addon;

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
export const quickCompare = addon.quickCompare;
export const compareSync = addon.compareSync;
export const quickCompareSync = addon.quickCompareSync;
export const getDimensions = addon.getDimensions;
export const getDimensionsSync = addon.getDimensionsSync;

// Image Metadata API
export const getImageMetadata = addon.getImageMetadata;
export const getImageMetadataSync = addon.getImageMetadataSync;
export const getImageMetadataFromFile = addon.getImageMetadataFromFile;
export const getImageMetadataFromFileSync = addon.getImageMetadataFromFileSync;

// WCAG Accessibility API
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
