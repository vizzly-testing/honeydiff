/**
 * WCAG Accessibility Testing Example
 *
 * Demonstrates how to analyze images for WCAG color contrast violations
 * and generate visual overlays showing problematic regions.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeWcagContrast, saveWcagOverlay } from '../index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('=== WCAG Accessibility Testing Demo ===\n');

  // Example 1: Basic WCAG analysis
  console.log('1. Running basic WCAG AA analysis...');
  try {
    let analysis = await analyzeWcagContrast(
      path.join(__dirname, '../../../tests/fixtures/screenshots/vizzly-baseline.png'),
      {
        edgeThreshold: 60,
        minRegionSize: 50,
        checkAA: true,
        checkAAA: false,
      }
    );

    console.log(`   Total edges detected: ${analysis.totalEdges}`);
    console.log(`   AA normal text pass rate: ${analysis.aaNormalPassPercentage.toFixed(1)}%`);
    console.log(`   AA large text pass rate: ${analysis.aaLargePassPercentage.toFixed(1)}%`);
    console.log(`   Violations found: ${analysis.violations.length}\n`);

    if (analysis.violations.length > 0) {
      console.log('   Top 5 violations by size:');
      for (let i = 0; i < Math.min(5, analysis.violations.length); i++) {
        let violation = analysis.violations[i];
        console.log(
          `   ${i + 1}. Region at (${violation.boundingBox.x}, ${violation.boundingBox.y})`
        );
        console.log(`      Contrast ratio: ${violation.contrastRatio.toFixed(2)}:1`);
        console.log(`      Pixels affected: ${violation.pixelCount}`);
        console.log(
          `      Fails AA normal: ${violation.failsAaNormal}, Fails AA large: ${violation.failsAaLarge}`
        );
      }
      console.log();
    }
  } catch (error) {
    console.error('   Error:', error.message);
  }

  // Example 2: WCAG AAA analysis (stricter)
  console.log('2. Running strict WCAG AAA analysis...');
  try {
    let analysis = await analyzeWcagContrast(
      path.join(__dirname, '../../../tests/fixtures/screenshots/vizzly-baseline.png'),
      {
        edgeThreshold: 60,
        minRegionSize: 50,
        checkAA: true,
        checkAAA: true,
      }
    );

    console.log(`   Total edges detected: ${analysis.totalEdges}`);
    console.log(`   AAA normal text pass rate: ${analysis.aaaNormalPassPercentage.toFixed(1)}%`);
    console.log(`   AAA large text pass rate: ${analysis.aaaLargePassPercentage.toFixed(1)}%`);
    console.log(`   AAA violations found: ${analysis.violations.length}\n`);
  } catch (error) {
    console.error('   Error:', error.message);
  }

  // Example 3: Generate visual overlay
  console.log('3. Generating visual overlay...');
  try {
    let analysis = await analyzeWcagContrast(
      path.join(__dirname, '../../../tests/fixtures/screenshots/vizzly-baseline.png'),
      {
        checkAA: true,
        checkAAA: false,
      }
    );

    let outputPath = path.join(__dirname, '../wcag-violations.png');

    await saveWcagOverlay(
      path.join(__dirname, '../../../tests/fixtures/screenshots/vizzly-baseline.png'),
      analysis,
      outputPath,
      {
        highlightColor: [255, 0, 0, 180], // Semi-transparent red
      }
    );

    console.log(`   ✓ Overlay saved to: ${outputPath}\n`);
  } catch (error) {
    console.error('   Error:', error.message);
  }

  // Example 4: Synchronous API (for simple scripts)
  console.log('4. Using synchronous API...');
  try {
    const { analyzeWcagContrastSync } = require('../index.js');

    let analysis = analyzeWcagContrastSync(
      path.join(__dirname, '../../../tests/fixtures/screenshots/vizzly-baseline.png'),
      {
        edgeThreshold: 80, // More lenient threshold
        minRegionSize: 100, // Larger regions only
      }
    );

    console.log(`   Total edges: ${analysis.totalEdges}`);
    console.log(`   Violations: ${analysis.violations.length}`);
    console.log(`   Pass rate: ${analysis.aaNormalPassPercentage.toFixed(1)}%\n`);
  } catch (error) {
    console.error('   Error:', error.message);
  }

  // Example 5: Detailed violation analysis
  console.log('5. Analyzing violation details...');
  try {
    let analysis = await analyzeWcagContrast(
      path.join(__dirname, '../../../tests/fixtures/screenshots/vizzly-baseline.png')
    );

    if (analysis.violations.length > 0) {
      let violation = analysis.violations[0];

      console.log('   First violation details:');
      console.log(`   - Location: (${violation.boundingBox.x}, ${violation.boundingBox.y})`);
      console.log(`   - Size: ${violation.boundingBox.width}x${violation.boundingBox.height}`);
      console.log(
        `   - Center: (${violation.centerOfMass[0].toFixed(1)}, ${violation.centerOfMass[1].toFixed(1)})`
      );
      console.log(`   - Foreground color: rgba(${violation.foregroundColor.join(', ')})`);
      console.log(`   - Background color: rgba(${violation.backgroundColor.join(', ')})`);
      console.log(`   - Foreground luminance: ${violation.foregroundLuminance.toFixed(3)}`);
      console.log(`   - Background luminance: ${violation.backgroundLuminance.toFixed(3)}`);
      console.log(
        `   - Contrast ratio: ${violation.contrastRatio.toFixed(2)}:1 (${violation.minContrastRatio.toFixed(2)} - ${violation.maxContrastRatio.toFixed(2)})`
      );
      console.log(`   - Pixel count: ${violation.pixelCount}`);
      console.log('   - WCAG Status:');
      console.log(`     AA Normal (4.5:1): ${violation.failsAaNormal ? '❌ FAIL' : '✓ PASS'}`);
      console.log(`     AA Large (3.0:1): ${violation.failsAaLarge ? '❌ FAIL' : '✓ PASS'}`);
      console.log(`     AAA Normal (7.0:1): ${violation.failsAaaNormal ? '❌ FAIL' : '✓ PASS'}`);
      console.log(`     AAA Large (4.5:1): ${violation.failsAaaLarge ? '❌ FAIL' : '✓ PASS'}`);
    }
  } catch (error) {
    console.error('   Error:', error.message);
  }

  console.log('\n=== Demo Complete ===');
}

main().catch(console.error);
