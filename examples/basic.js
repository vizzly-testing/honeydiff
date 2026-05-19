/**
 * Basic usage example for @vizzly-testing/honeydiff
 */

import * as honeydiff from '../index.js';

let baseline = '../../tests/fixtures/screenshots/vizzly-baseline.png';
let current = '../../tests/fixtures/screenshots/vizzly-with-diff.png';

async function main() {
  console.log('Honeydiff Node.js examples\n');

  console.log('1. Quick comparison');
  let isDifferent = await honeydiff.quickCompare(baseline, current);
  console.log(`  Result: ${isDifferent ? 'DIFFERENT' : 'IDENTICAL'}\n`);

  console.log('2. Detailed comparison');
  let result = await honeydiff.compare(baseline, current, {
    threshold: 0,
    antialiasing: true,
    includeSSIM: true,
    includeGMSD: true,
    includeClusters: true,
    includeDiffPixels: true,
    minClusterSize: 1,
  });

  console.log(`  Diff percentage: ${result.diffPercentage.toFixed(2)}%`);
  console.log(`  Different pixels: ${result.diffPixels} / ${result.totalPixels}`);
  console.log(`  AA pixels ignored: ${result.aaPixelsIgnored}`);

  if (result.perceptualScore !== null) {
    console.log(`  SSIM score: ${result.perceptualScore.toFixed(4)}`);
  }

  if (result.gmsdScore !== null) {
    console.log(`  GMSD score: ${result.gmsdScore.toFixed(4)}`);
  }

  if (result.boundingBox) {
    console.log(
      `  Bounding box: (${result.boundingBox.x}, ${result.boundingBox.y}) ${result.boundingBox.width}x${result.boundingBox.height}`
    );
  }

  if (result.diffClusters && result.diffClusters.length > 0) {
    console.log(`  Found ${result.diffClusters.length} diff clusters`);
    for (let [index, cluster] of result.diffClusters.slice(0, 3).entries()) {
      console.log(
        `    Cluster ${index + 1}: ${cluster.pixelCount} pixels at (${cluster.centerOfMass[0].toFixed(0)}, ${cluster.centerOfMass[1].toFixed(0)})`
      );
    }
  }

  console.log('\n3. Synchronous comparison');
  let syncResult = honeydiff.compareSync(baseline, current, {
    threshold: 2,
    includeClusters: true,
  });
  console.log(`  Diff percentage: ${syncResult.diffPercentage.toFixed(2)}%`);

  console.log('\n4. Image dimensions');
  let dimensions = await honeydiff.getDimensions(baseline);
  console.log(`  Dimensions: ${dimensions.width}x${dimensions.height}`);

  console.log('\n5. Diff artifacts');
  let artifactResult = await honeydiff.compare(baseline, current, {
    threshold: 0,
    diffPath: '/tmp/honeydiff-diff.png',
    maskPath: '/tmp/honeydiff-mask.png',
    overlayPath: '/tmp/honeydiff-side-by-side.png',
    overwrite: true,
  });
  console.log(`  Artifact diff percentage: ${artifactResult.diffPercentage.toFixed(2)}%`);
  console.log('  Artifacts saved to /tmp/honeydiff-*.png');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
