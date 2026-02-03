/**
 * TypeScript example with full type safety
 */

import { type CompareOptions, compare, type DiffResult, quickCompare } from '../index';

async function main(): Promise<void> {
  console.log('TypeScript Example\n');

  // Quick comparison
  let isDifferent: boolean = await quickCompare(
    '../../tests/fixtures/screenshots/vizzly-baseline.png',
    '../../tests/fixtures/screenshots/vizzly-with-diff.png'
  );
  console.log(`Quick result: ${isDifferent ? 'DIFFERENT' : 'IDENTICAL'}\n`);

  // Detailed comparison with full typing
  let options: CompareOptions = {
    pixelTolerance: 5,
    antialiasing: true,
    includeSSIM: true,
    includeClusters: true,
    includeDiffPixels: false,
  };

  let result: DiffResult = await compare(
    '../../tests/fixtures/screenshots/vizzly-baseline.png',
    '../../tests/fixtures/screenshots/vizzly-with-diff.png',
    options
  );

  console.log('Detailed results:');
  console.log(`  Diff: ${result.diffPercentage.toFixed(2)}%`);
  console.log(`  Different pixels: ${result.diffPixels} / ${result.totalPixels}`);

  // Type-safe access to optional fields
  if (result.perceptualScore !== null) {
    let ssim: number = result.perceptualScore;
    console.log(`  SSIM: ${ssim.toFixed(4)}`);

    if (ssim > 0.95) {
      console.log('  → Perceptually very similar');
    } else if (ssim > 0.8) {
      console.log('  → Somewhat similar');
    } else {
      console.log('  → Perceptually different');
    }
  }

  if (result.boundingBox) {
    console.log(
      `  Changes in region: (${result.boundingBox.x}, ${result.boundingBox.y}) ${result.boundingBox.width}x${result.boundingBox.height}`
    );
  }

  if (result.diffClusters && result.diffClusters.length > 0) {
    console.log(`\nFound ${result.diffClusters.length} separate diff regions:`);
    result.diffClusters.slice(0, 5).forEach((cluster, i) => {
      let [cx, cy] = cluster.centerOfMass;
      console.log(
        `  ${i + 1}. ${cluster.pixelCount} pixels at (${cx.toFixed(0)}, ${cy.toFixed(0)})`
      );
    });
  }

  if (result.intensityStats) {
    console.log('\nIntensity statistics:');
    console.log(`  Range: ${result.intensityStats.min} - ${result.intensityStats.max}`);
    console.log(`  Mean: ${result.intensityStats.mean.toFixed(1)}`);
    console.log(`  Median: ${result.intensityStats.median}`);
    console.log(`  Std Dev: ${result.intensityStats.stdDev.toFixed(1)}`);
  }
}

main().catch((err: Error) => {
  console.error('Error:', err.message);
  process.exit(1);
});
