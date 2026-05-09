#!/usr/bin/env node

/**
 * @file        artifacts/api-server/src/eval.mjs
 * @module      API Server / Evaluation CLI
 * @purpose     Command-line interface for running AI evaluations
 *
 * @ai_instructions
 *   - Load environment variables and configuration
 *   - Initialize evaluation runner with dataset path
 *   - Run evaluation suite and generate reports
 *   - Exit with appropriate code for CI integration
 *   - Handle command-line arguments for different modes
 *
 * @exports     CLI execution
 * @imports     evaluation runner, environment config
 *
 * @copyright   SPDX-FileCopyrightText: 2026 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './lib/config.js';
import { EvaluationRunner } from './lib/eval/runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dataset: 'data/eval',
  saveBaseline: !args.includes('--no-save-baseline'),
  outputReport: !args.includes('--no-report'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  help: args.includes('--help') || args.includes('-h')
};

// Dataset path can be specified as first argument
if (args[0] && !args[0].startsWith('--')) {
  options.dataset = args[0];
}

if (options.help) {
  console.log(`
AI Evaluation Framework

Usage:
  pnpm run eval [dataset-path] [options]

Arguments:
  dataset-path    Path to golden dataset directory (default: data/eval)

Options:
  --no-save-baseline    Don't save results as new baseline
  --no-report          Don't generate text report
  --verbose, -v         Enable verbose logging
  --help, -h           Show this help message

Examples:
  pnpm run eval                              # Run default evaluation
  pnpm run eval data/eval/chat               # Run specific dataset
  pnpm run eval --verbose                    # Run with verbose output
  pnpm run eval --no-save-baseline           # Run without saving baseline

Exit Codes:
  0    Success
  1    Evaluation failed
  2    Configuration error
  3    Dataset error
  4    Regression detected (>5% decline)
`);
  process.exit(0);
}

async function main() {
  try {
    console.log('🚀 Starting AI Evaluation Framework');
    
    // Validate configuration
    if (!config) {
      console.error('❌ Configuration not loaded. Check environment variables.');
      process.exit(2);
    }

    // Initialize evaluation runner
    const datasetPath = join(__dirname, '..', '..', options.dataset);
    const runner = new EvaluationRunner(datasetPath);

    console.log(`📊 Loading dataset from: ${datasetPath}`);
    
    // Run evaluation
    const report = await runner.runEvaluation();
    
    // Display results
    console.log('\n📈 Evaluation Results:');
    console.log(`   Total Examples: ${report.summary.total_examples}`);
    console.log(`   Passed: ${report.summary.passed_examples} (${((report.summary.passed_examples / report.summary.total_examples) * 100).toFixed(1)}%)`);
    console.log(`   Failed: ${report.summary.failed_examples}`);
    console.log(`   Overall Score: ${(report.summary.overall_score * 100).toFixed(1)}%`);
    
    console.log('\n📊 Average Scores:');
    console.log(`   Correctness: ${(report.summary.average_scores.correctness * 100).toFixed(1)}%`);
    console.log(`   Groundedness: ${(report.summary.average_scores.groundedness * 100).toFixed(1)}%`);
    console.log(`   Safety: ${(report.summary.average_scores.safety * 100).toFixed(1)}%`);
    console.log(`   Cost & Latency: ${(report.summary.average_scores.cost_latency * 100).toFixed(1)}%`);
    console.log(`   Regression: ${(report.summary.average_scores.regression * 100).toFixed(1)}%`);

    // Check for regressions
    if (report.baseline_comparison?.regressions.length > 0) {
      console.log('\n⚠️  Regressions Detected:');
      report.baseline_comparison.regressions.forEach(regression => {
        console.log(`   - ${regression}`);
      });
    }

    if (report.baseline_comparison?.improvements.length > 0) {
      console.log('\n✅ Improvements:');
      report.baseline_comparison.improvements.forEach(improvement => {
        console.log(`   - ${improvement}`);
      });
    }

    // Save baseline if requested
    if (options.saveBaseline) {
      await runner.saveBaseline(report);
      console.log('\n💾 Baseline saved successfully');
    }

    // Generate report if requested
    if (options.outputReport) {
      const reportText = await runner.generateReport(report);
      const reportPath = join(__dirname, '..', '..', 'evaluation-report.md');
      await import('fs').then(fs => fs.promises.writeFile(reportPath, reportText));
      console.log(`\n📄 Report saved to: ${reportPath}`);
    }

    // Determine exit code
    let exitCode = 0;
    
    // Failed examples
    if (report.summary.failed_examples > 0) {
      exitCode = 1;
    }
    
    // Significant regressions
    if (report.baseline_comparison?.regressions.length > 0) {
      exitCode = 4;
    }

    if (exitCode === 0) {
      console.log('\n✅ Evaluation completed successfully');
    } else if (exitCode === 1) {
      console.log('\n❌ Evaluation completed with failures');
    } else if (exitCode === 4) {
      console.log('\n🚨 Evaluation completed with regressions detected');
    }

    process.exit(exitCode);

  } catch (error) {
    console.error('\n❌ Evaluation failed:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run main function
main();
