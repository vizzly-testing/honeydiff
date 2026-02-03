/**
 * Example: Using Buffers instead of file paths
 */

import fs from 'node:fs';
import * as honeydiff from '../index.js';

async function main() {
  console.log('Buffer Example\n');

  // Load images as buffers
  let img1Buffer = fs.readFileSync('../../tests/fixtures/screenshots/vizzly-baseline.png');
  let img2Buffer = fs.readFileSync('../../tests/fixtures/screenshots/vizzly-with-diff.png');

  console.log(`Loaded buffers: ${img1Buffer.length} and ${img2Buffer.length} bytes\n`);

  // Compare using buffers
  let result = await honeydiff.compare(img1Buffer, img2Buffer, {
    pixelTolerance: 0,
    includeSSIM: true,
  });

  console.log('Comparison result:');
  console.log(`  Different: ${result.isDifferent}`);
  console.log(`  Diff percentage: ${result.diffPercentage.toFixed(2)}%`);
  console.log(`  SSIM: ${result.perceptualScore?.toFixed(4) || 'N/A'}`);

  // Mixed: buffer + file path
  console.log('\nMixed comparison (buffer + file path):');
  let mixedResult = await honeydiff.compare(
    img1Buffer,
    '../../tests/fixtures/screenshots/vizzly-with-diff.png'
  );
  console.log(`  Diff percentage: ${mixedResult.diffPercentage.toFixed(2)}%`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
