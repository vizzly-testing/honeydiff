/**
 * Color Vision Deficiency (CVD) Simulation Example
 *
 * Demonstrates how to simulate color blindness for images and run
 * accessibility analysis to ensure your UI works for all users.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analyzeWcagAllCvd,
  analyzeWcagForCvd,
  getColorBlindnessTypes,
  saveAllColorBlindnessSimulations,
  saveColorBlindnessSimulation,
  simulateColorBlindness,
} from '../index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('=== Color Vision Deficiency (CVD) Simulation Demo ===\n');

  let testImage = path.join(__dirname, '../../../tests/fixtures/screenshots/vizzly-baseline.png');

  // Example 1: Get information about CVD types
  console.log('1. Available color blindness types:\n');
  let types = getColorBlindnessTypes();
  for (let cvd of types) {
    console.log(`   ${cvd.name} (${cvd.type})`);
    console.log(`     ${cvd.description}`);
    console.log(`     Affects: ${cvd.prevalence}\n`);
  }

  // Example 2: Simulate a single CVD type and get buffer
  console.log('2. Simulating deuteranopia (red-green color blindness)...');
  try {
    let simulatedBuffer = await simulateColorBlindness(testImage, 'deuteranopia');
    console.log(`   Generated ${simulatedBuffer.length} bytes of simulated image data`);

    // Save the buffer if you want
    let outputPath = path.join(__dirname, '../cvd-deuteranopia.png');
    fs.writeFileSync(outputPath, simulatedBuffer);
    console.log(`   Saved to: ${outputPath}\n`);
  } catch (error) {
    console.error('   Error:', error.message, '\n');
  }

  // Example 3: Save CVD simulation directly to file
  console.log('3. Saving protanopia simulation to file...');
  try {
    let outputPath = path.join(__dirname, '../cvd-protanopia.png');
    await saveColorBlindnessSimulation(testImage, 'protanopia', outputPath);
    console.log(`   Saved to: ${outputPath}\n`);
  } catch (error) {
    console.error('   Error:', error.message, '\n');
  }

  // Example 4: Generate all CVD simulations at once
  console.log('4. Generating all CVD simulations...');
  try {
    let outputPrefix = path.join(__dirname, '../cvd-all');
    await saveAllColorBlindnessSimulations(testImage, outputPrefix, 'png');
    console.log('   Created files:');
    console.log(`   - ${outputPrefix}_protanopia.png`);
    console.log(`   - ${outputPrefix}_deuteranopia.png`);
    console.log(`   - ${outputPrefix}_tritanopia.png`);
    console.log(`   - ${outputPrefix}_achromatopsia.png\n`);
  } catch (error) {
    console.error('   Error:', error.message, '\n');
  }

  // Example 5: WCAG analysis for a specific CVD type
  console.log('5. Analyzing WCAG contrast for deuteranopia users...');
  try {
    let analysis = await analyzeWcagForCvd(testImage, 'deuteranopia', {
      checkAA: true,
      checkAAA: false,
      edgeThreshold: 60,
    });

    console.log(`   Total edges analyzed: ${analysis.totalEdges}`);
    console.log(`   AA normal text pass rate: ${analysis.aaNormalPassPercentage.toFixed(1)}%`);
    console.log(`   Violations found: ${analysis.violations.length}`);

    if (analysis.violations.length > 0) {
      console.log('\n   Top 3 violations:');
      for (let i = 0; i < Math.min(3, analysis.violations.length); i++) {
        let v = analysis.violations[i];
        console.log(`   ${i + 1}. Location: (${v.boundingBox.x}, ${v.boundingBox.y})`);
        console.log(`      Contrast: ${v.contrastRatio.toFixed(2)}:1`);
        console.log(`      Pixels affected: ${v.pixelCount}`);
      }
    }
    console.log();
  } catch (error) {
    console.error('   Error:', error.message, '\n');
  }

  // Example 6: Comprehensive CVD accessibility report
  console.log('6. Running comprehensive CVD accessibility analysis...');
  try {
    let report = await analyzeWcagAllCvd(testImage, {
      checkAA: true,
      checkAAA: true,
    });

    console.log('\n   Accessibility Report:');
    console.log('   ─────────────────────────────────────────────');
    console.log(
      `   Normal Vision:  ${report.normalVision.violations.length} violations ` +
        `(${report.normalVision.aaNormalPassPercentage.toFixed(1)}% pass)`
    );
    console.log(
      `   Protanopia:     ${report.protanopia.violations.length} violations ` +
        `(${report.protanopia.aaNormalPassPercentage.toFixed(1)}% pass)`
    );
    console.log(
      `   Deuteranopia:   ${report.deuteranopia.violations.length} violations ` +
        `(${report.deuteranopia.aaNormalPassPercentage.toFixed(1)}% pass)`
    );
    console.log(
      `   Tritanopia:     ${report.tritanopia.violations.length} violations ` +
        `(${report.tritanopia.aaNormalPassPercentage.toFixed(1)}% pass)`
    );
    console.log('   ─────────────────────────────────────────────');
    console.log(`   Total violations: ${report.totalViolations}`);
    console.log(`   CVD-only violations: ~${report.cvdOnlyViolationCount}`);
    console.log(`   Has any violations: ${report.hasAnyViolations}`);
    console.log();
  } catch (error) {
    console.error('   Error:', error.message, '\n');
  }

  // Example 7: Using short aliases
  console.log('7. Using short CVD type aliases...');
  try {
    // These are equivalent:
    // 'protanopia' === 'protan'
    // 'deuteranopia' === 'deutan'
    // 'tritanopia' === 'tritan'
    // 'achromatopsia' === 'achroma' === 'monochromacy'

    let outputPath = path.join(__dirname, '../cvd-tritan.png');
    await saveColorBlindnessSimulation(testImage, 'tritan', outputPath);
    console.log(`   Saved tritanopia simulation using "tritan" alias`);
    console.log(`   Output: ${outputPath}\n`);
  } catch (error) {
    console.error('   Error:', error.message, '\n');
  }

  // Example 8: Test integration example
  console.log('8. Example test integration (pseudocode):');
  console.log(`
   // In your visual regression tests:
   test('UI colors work for colorblind users', async () => {
     let screenshot = await page.screenshot();

     // Check accessibility for all CVD types
     let report = await analyzeWcagAllCvd(screenshot, { checkAA: true });

     // Assert no violations
     expect(report.hasAnyViolations).toBe(false);

     // Or check specific CVD types
     expect(report.deuteranopia.violations.length).toBe(0);
   });

   test('chart is readable for protanopia users', async () => {
     let chart = await page.screenshot({ element: '[data-testid="chart"]' });

     // Simulate and compare
     let simulated = await simulateColorBlindness(chart, 'protanopia');

     // Verify distinguishability
     let diff = await compare(chart, simulated);

     // Some difference is expected, but important info should remain visible
     let analysis = await analyzeWcagForCvd(chart, 'protanopia');
     expect(analysis.aaNormalPassPercentage).toBeGreaterThan(90);
   });
  `);

  // Cleanup generated files
  console.log('9. Cleaning up generated files...');
  let filesToClean = [
    path.join(__dirname, '../cvd-deuteranopia.png'),
    path.join(__dirname, '../cvd-protanopia.png'),
    path.join(__dirname, '../cvd-tritan.png'),
    path.join(__dirname, '../cvd-all_protanopia.png'),
    path.join(__dirname, '../cvd-all_deuteranopia.png'),
    path.join(__dirname, '../cvd-all_tritanopia.png'),
    path.join(__dirname, '../cvd-all_achromatopsia.png'),
  ];

  for (let file of filesToClean) {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    } catch {
      // ignore cleanup errors
    }
  }
  console.log('   Cleaned up generated files.\n');

  console.log('=== Demo Complete ===');
}

main().catch(console.error);
