/**
 * Basic usage example for @honeydiff/node
 */

import * as honeydiff from '../index.js';

async function main() {
  console.log('Honeydiff Node.js Examples\n');

  // Example 1: Quick async comparison
  console.log('1. Quick comparison:');
  let isDifferent = await honeydiff.quickCompare(
    '../../tests/fixtures/screenshots/vizzly-baseline.png',
    '../../tests/fixtures/screenshots/vizzly-with-diff.png'
  );
  console.log(`  Result: ${isDifferent ? 'DIFFERENT' : 'IDENTICAL'}\n`);

  // Example 2: Detailed async comparison
  console.log('2. Detailed comparison with options:');
  let result = await honeydiff.compare(
    '../../tests/fixtures/screenshots/vizzly-baseline.png',
    '../../tests/fixtures/screenshots/vizzly-with-diff.png',
    {
      pixelTolerance: 0,
      antialiasing: true,
      includeSSIM: true,
      includeClusters: true,
    }
  );

  console.log(`  Diff percentage: ${result.diffPercentage.toFixed(2)}%`);
  console.log(`  Different pixels: ${result.diffPixels} / ${result.totalPixels}`);
  console.log(`  AA pixels ignored: ${result.aaPixelsIgnored}`);

  if (result.perceptualScore !== null) {
    console.log(`  SSIM score: ${result.perceptualScore.toFixed(4)}`);
  }

  if (result.boundingBox) {
    console.log(
      `  Bounding box: (${result.boundingBox.x}, ${result.boundingBox.y}) ${result.boundingBox.width}x${result.boundingBox.height}`
    );
  }

  if (result.diffClusters && result.diffClusters.length > 0) {
    console.log(`  Found ${result.diffClusters.length} diff clusters`);
    result.diffClusters.slice(0, 3).forEach((cluster, i) => {
      console.log(
        `    Cluster ${i + 1}: ${cluster.pixelCount} pixels at (${cluster.centerOfMass[0].toFixed(0)}, ${cluster.centerOfMass[1].toFixed(0)})`
      );
    });
  }

  if (result.intensityStats) {
    console.log(`  Intensity stats:`);
    console.log(`    Range: ${result.intensityStats.min}-${result.intensityStats.max}`);
    console.log(
      `    Mean: ${result.intensityStats.mean.toFixed(1)}, Median: ${result.intensityStats.median}`
    );
  }

  console.log();

  // Example 3: Synchronous comparison (for when you need blocking behavior)
  console.log('3. Synchronous comparison:');
  let syncResult = honeydiff.compareSync(
    '../../tests/fixtures/screenshots/vizzly-baseline.png',
    '../../tests/fixtures/screenshots/vizzly-with-diff.png',
    { pixelTolerance: 10 }
  );
  console.log(`  Diff percentage: ${syncResult.diffPercentage.toFixed(2)}%`);
  console.log();

  // Example 4: Get image dimensions
  console.log('4. Get image dimensions:');
  let dimensions = await honeydiff.getDimensions(
    '../../tests/fixtures/screenshots/vizzly-baseline.png'
  );
  console.log(`  Dimensions: ${dimensions.width}x${dimensions.height} pixels`);
  console.log();

  // Example 5: Get dimensions synchronously
  console.log('5. Get dimensions (sync):');
  let syncDimensions = honeydiff.getDimensionsSync(
    '../../tests/fixtures/screenshots/vizzly-with-diff.png'
  );
  console.log(`  Dimensions: ${syncDimensions.width}x${syncDimensions.height} pixels`);
  console.log();

  // Example 6: Generate diff artifacts
  console.log('6. Generate diff artifacts:');
  let artifactResult = await honeydiff.compare(
    '../../tests/fixtures/screenshots/vizzly-baseline.png',
    '../../tests/fixtures/screenshots/vizzly-with-diff.png',
    {
      diffPath: '/tmp/honeydiff-diff.png',
      maskPath: '/tmp/honeydiff-mask.png',
      overlayPath: '/tmp/honeydiff-overlay.png',
      overwrite: true,
    }
  );
  console.log(`  Diff percentage: ${artifactResult.diffPercentage.toFixed(2)}%`);
  console.log(`  Artifacts saved to /tmp/honeydiff-*.png`);
  console.log();

  // Example 7: Accessibility metadata tests
  console.log('7. Accessibility metadata (RGB + luminance + WCAG):');
  let accessibilityResult = await honeydiff.compare(
    '../../tests/fixtures/screenshots/vizzly-baseline.png',
    '../../tests/fixtures/screenshots/vizzly-with-diff.png',
    {
      includeClusters: true,
      includeAccessibilityData: true,
    }
  );

  // Validate accessibility data is present
  if (!accessibilityResult.diffClusters || accessibilityResult.diffClusters.length === 0) {
    throw new Error('Test failed: Expected diff clusters to be present');
  }

  let firstCluster = accessibilityResult.diffClusters[0];
  if (!firstCluster.accessibilityMetadata) {
    throw new Error('Test failed: Expected accessibilityMetadata to be present');
  }

  let meta = firstCluster.accessibilityMetadata;

  // Validate RGB channel differences
  if (typeof meta.avgRDiff !== 'number' || meta.avgRDiff < 0) {
    throw new Error('Test failed: avgRDiff should be a non-negative number');
  }
  if (typeof meta.avgGDiff !== 'number' || meta.avgGDiff < 0) {
    throw new Error('Test failed: avgGDiff should be a non-negative number');
  }
  if (typeof meta.avgBDiff !== 'number' || meta.avgBDiff < 0) {
    throw new Error('Test failed: avgBDiff should be a non-negative number');
  }

  // Validate dominant channel
  if (!['R', 'G', 'B'].includes(meta.dominantChannel)) {
    throw new Error(
      `Test failed: dominantChannel should be R, G, or B, got ${meta.dominantChannel}`
    );
  }

  // Validate luminance values (0.0-1.0 range)
  if (meta.avgBaselineLuminance < 0 || meta.avgBaselineLuminance > 1) {
    throw new Error('Test failed: avgBaselineLuminance should be between 0 and 1');
  }
  if (meta.avgCurrentLuminance < 0 || meta.avgCurrentLuminance > 1) {
    throw new Error('Test failed: avgCurrentLuminance should be between 0 and 1');
  }

  // Validate contrast ratios (1.0-21.0 range)
  if (meta.contrastRatio < 1 || meta.contrastRatio > 21) {
    throw new Error('Test failed: contrastRatio should be between 1 and 21');
  }
  if (meta.minContrastRatio < 1 || meta.minContrastRatio > 21) {
    throw new Error('Test failed: minContrastRatio should be between 1 and 21');
  }
  if (meta.maxContrastRatio < 1 || meta.maxContrastRatio > 21) {
    throw new Error('Test failed: maxContrastRatio should be between 1 and 21');
  }
  if (meta.minContrastRatio > meta.maxContrastRatio) {
    throw new Error('Test failed: minContrastRatio should be <= maxContrastRatio');
  }

  // Validate colorBlindnessImpact is null when not requested
  if (meta.colorBlindnessImpact !== null) {
    throw new Error(
      'Test failed: colorBlindnessImpact should be null when checkColorBlindness is not enabled'
    );
  }

  console.log(
    `  RGB diffs: R=${meta.avgRDiff.toFixed(1)}, G=${meta.avgGDiff.toFixed(1)}, B=${meta.avgBDiff.toFixed(1)}`
  );
  console.log(`  Dominant channel: ${meta.dominantChannel}`);
  console.log(
    `  Luminance: baseline=${meta.avgBaselineLuminance.toFixed(3)}, current=${meta.avgCurrentLuminance.toFixed(3)}`
  );
  console.log(
    `  WCAG contrast: ${meta.contrastRatio.toFixed(2)}:1 (range: ${meta.minContrastRatio.toFixed(2)}-${meta.maxContrastRatio.toFixed(2)})`
  );
  console.log('  All accessibility metadata tests passed!');
  console.log();

  // Example 8: Color blindness checking tests
  console.log('8. Color blindness checking:');
  let cbResult = await honeydiff.compare(
    '../../tests/fixtures/screenshots/vizzly-baseline.png',
    '../../tests/fixtures/screenshots/vizzly-with-diff.png',
    {
      includeClusters: true,
      checkColorBlindness: true,
      colorBlindnessThreshold: 30.0,
    }
  );

  // Validate clusters and accessibility data
  if (!cbResult.diffClusters || cbResult.diffClusters.length === 0) {
    throw new Error('Test failed: Expected diff clusters to be present');
  }

  let cbCluster = cbResult.diffClusters[0];
  if (!cbCluster.accessibilityMetadata) {
    throw new Error(
      'Test failed: Expected accessibilityMetadata to be present when checkColorBlindness is enabled'
    );
  }

  let cbMeta = cbCluster.accessibilityMetadata;

  // Validate colorBlindnessImpact is present
  if (!cbMeta.colorBlindnessImpact) {
    throw new Error(
      'Test failed: Expected colorBlindnessImpact to be present when checkColorBlindness is enabled'
    );
  }

  let impact = cbMeta.colorBlindnessImpact;

  // Validate boolean flags
  if (typeof impact.deuteranopiaVisible !== 'boolean') {
    throw new Error('Test failed: deuteranopiaVisible should be a boolean');
  }
  if (typeof impact.protanopiaVisible !== 'boolean') {
    throw new Error('Test failed: protanopiaVisible should be a boolean');
  }
  if (typeof impact.tritanopiaVisible !== 'boolean') {
    throw new Error('Test failed: tritanopiaVisible should be a boolean');
  }
  if (typeof impact.achromatopsiaVisible !== 'boolean') {
    throw new Error('Test failed: achromatopsiaVisible should be a boolean');
  }

  // Validate visibility score (0.0-1.0 range)
  if (impact.visibilityScore < 0 || impact.visibilityScore > 1) {
    throw new Error('Test failed: visibilityScore should be between 0 and 1');
  }

  console.log(`  Visibility score: ${(impact.visibilityScore * 100).toFixed(0)}%`);
  console.log(`  Deuteranopia visible: ${impact.deuteranopiaVisible}`);
  console.log(`  Protanopia visible: ${impact.protanopiaVisible}`);
  console.log(`  Tritanopia visible: ${impact.tritanopiaVisible}`);
  console.log(`  Achromatopsia visible: ${impact.achromatopsiaVisible}`);
  console.log('  All color blindness tests passed!');
  console.log();

  // Example 9: Test checkColorBlindness automatically enables includeAccessibilityData
  console.log('9. Auto-enable test (checkColorBlindness enables includeAccessibilityData):');
  let autoEnableResult = await honeydiff.compare(
    '../../tests/fixtures/screenshots/vizzly-baseline.png',
    '../../tests/fixtures/screenshots/vizzly-with-diff.png',
    {
      includeClusters: true,
      checkColorBlindness: true,
      // Note: NOT explicitly setting includeAccessibilityData
    }
  );

  if (!autoEnableResult.diffClusters || autoEnableResult.diffClusters.length === 0) {
    throw new Error('Test failed: Expected diff clusters to be present');
  }

  let autoCluster = autoEnableResult.diffClusters[0];
  if (!autoCluster.accessibilityMetadata) {
    throw new Error(
      'Test failed: checkColorBlindness should automatically enable accessibilityMetadata'
    );
  }

  // Should have both accessibility data and color blindness impact
  if (!autoCluster.accessibilityMetadata.colorBlindnessImpact) {
    throw new Error(
      'Test failed: Expected colorBlindnessImpact when checkColorBlindness is enabled'
    );
  }

  console.log('  Accessibility metadata auto-enabled: Yes');
  console.log('  Color blindness data present: Yes');
  console.log('  Auto-enable test passed!');
  console.log();

  // Example 10: Test accessibility data is null when not requested
  console.log('10. Null handling test (accessibility data absent when not requested):');
  let noAccessibilityResult = await honeydiff.compare(
    '../../tests/fixtures/screenshots/vizzly-baseline.png',
    '../../tests/fixtures/screenshots/vizzly-with-diff.png',
    {
      includeClusters: true,
      // Note: NOT setting includeAccessibilityData or checkColorBlindness
    }
  );

  if (!noAccessibilityResult.diffClusters || noAccessibilityResult.diffClusters.length === 0) {
    throw new Error('Test failed: Expected diff clusters to be present');
  }

  let noAccessCluster = noAccessibilityResult.diffClusters[0];
  if (noAccessCluster.accessibilityMetadata !== null) {
    throw new Error('Test failed: accessibilityMetadata should be null when not requested');
  }

  console.log('  Accessibility metadata: null (as expected)');
  console.log('  Null handling test passed!');
  console.log();

  console.log('=== All accessibility binding tests passed! ===\n');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
