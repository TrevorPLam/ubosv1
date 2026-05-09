/**
 * @file        artifacts/api-server/src/lib/eval/runner.ts
 * @module      API Server / Evaluation / Runner
 * @purpose     AI evaluation framework runner with pluggable scorer interface
 *
 * @ai_instructions
 *   - Implement pluggable scorer interface for flexible evaluation strategies
 *   - Load golden datasets from JSON files
 *   - Execute AI pipeline and score outputs across multiple dimensions
 *   - Support deterministic and statistical evaluation modes
 *   - Generate structured reports with baseline comparisons
 *
 * @exports     EvaluationRunner with runEvaluation method
 * @imports     fs, path, chat service, scorer implementations
 *
 * @copyright   SPDX-FileCopyrightText: 2026 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import fs from 'fs/promises';
import path from 'path';
import { chatService } from '../chat-service';
import { logger } from '../logger';
import type { 
  CorrectnessScorer, 
  GroundednessScorer, 
  SafetyScorer, 
  CostLatencyScorer, 
  RegressionScorer 
} from './scorers';

export interface GoldenExample {
  id: string;
  input: string;
  scenario?: string;
  expected_output?: string;
  expected_outcome?: string;
  evaluation_criteria: {
    correctness_weight?: number;
    groundedness_weight?: number;
    safety_weight?: number;
    cost_latency_weight?: number;
    regression_weight?: number;
  };
  metadata?: {
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
  };
}

export interface EvaluationResult {
  example_id: string;
  scores: {
    correctness: number;
    groundedness: number;
    safety: number;
    cost_latency: number;
    regression: number;
  };
  overall_score: number;
  actual_output: string;
  metadata: {
    token_usage: number;
    latency_ms: number;
    cost_estimate: number;
  };
  passed_threshold: boolean;
}

export interface EvaluationReport {
  summary: {
    total_examples: number;
    passed_examples: number;
    failed_examples: number;
    overall_score: number;
    average_scores: {
      correctness: number;
      groundedness: number;
      safety: number;
      cost_latency: number;
      regression: number;
    };
  };
  results: EvaluationResult[];
  baseline_comparison?: {
    previous_scores: Record<string, number>;
    regressions: string[];
    improvements: string[];
  };
  execution_metadata: {
    timestamp: string;
    duration_ms: number;
    model_used: string;
    dataset_path: string;
  };
}

export interface ScorerInterface {
  name: string;
  score(
    example: GoldenExample, 
    actualOutput: string, 
    metadata?: Record<string, any>
  ): Promise<number>;
}

export class EvaluationRunner {
  private scorers: Map<string, ScorerInterface> = new Map();
  private baselinePath: string;

  constructor(
    private readonly datasetPath: string,
    private readonly thresholds = {
      overall: 0.8,
      correctness: 0.85,
      groundedness: 0.9,
      safety: 0.95,
      cost_latency: 0.7,
      regression: 0.9
    }
  ) {
    this.baselinePath = path.join(path.dirname(datasetPath), 'baselines');
    this.initializeScorers();
  }

  private initializeScorers(): void {
    // Import and register all scorers
    const {
      CorrectnessScorer,
      GroundednessScorer,
      SafetyScorer,
      CostLatencyScorer,
      RegressionScorer
    } = require('./scorers');

    this.scorers.set('correctness', new CorrectnessScorer());
    this.scorers.set('groundedness', new GroundednessScorer());
    this.scorers.set('safety', new SafetyScorer());
    this.scorers.set('cost_latency', new CostLatencyScorer());
    this.scorers.set('regression', new RegressionScorer());
  }

  async loadGoldenDataset(): Promise<GoldenExample[]> {
    try {
      const datasetFiles = await fs.readdir(this.datasetPath);
      const examples: GoldenExample[] = [];

      for (const file of datasetFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.datasetPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);

          if (Array.isArray(data)) {
            examples.push(...data);
          } else {
            examples.push(data);
          }
        }
      }

      logger.info(`Loaded ${examples.length} examples from ${this.datasetPath}`);
      return examples;
    } catch (error) {
      logger.error({ error: error?.toString(), datasetPath: this.datasetPath }, 'Failed to load golden dataset');
      throw new Error(`Failed to load golden dataset: ${error}`);
    }
  }

  async loadBaseline(): Promise<Record<string, number>> {
    try {
      const baselineFile = path.join(this.baselinePath, 'latest.json');
      const content = await fs.readFile(baselineFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      logger.warn('No baseline file found, using empty baseline');
      return {};
    }
  }

  async executeExample(example: GoldenExample): Promise<{
    output: string;
    tokenUsage: number;
    latencyMs: number;
    costEstimate: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Create a temporary thread for evaluation
      const thread = await chatService.createThread({
        title: `Eval: ${example.id}`
      }, 'evaluation-tenant', 'evaluation-user');

      // Send the input as a message
      const message = await chatService.sendMessage(thread.id, {
        content: example.input
      }, 'evaluation-tenant', 'evaluation-user');

      // Get the AI response (this would integrate with the actual chat streaming)
      const response = await this.simulateAIResponse(example.input);
      
      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      
      // Estimate cost based on token usage (simplified)
      const tokenUsage = this.estimateTokens(example.input + response);
      const costEstimate = this.estimateCost(tokenUsage);

      return {
        output: response,
        tokenUsage,
        latencyMs,
        costEstimate
      };
    } catch (error) {
      logger.error({ exampleId: example.id, error: error?.toString() }, 'Failed to execute example');
      throw error;
    }
  }

  private async simulateAIResponse(input: string): Promise<string> {
    // This is a placeholder for actual AI integration
    // In production, this would call the chat streaming API
    return `Simulated AI response for: "${input.substring(0, 50)}..."`;
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private estimateCost(tokens: number): number {
    // Simplified cost estimation (e.g., $0.002 per 1K tokens)
    return (tokens / 1000) * 0.002;
  }

  async scoreExample(
    example: GoldenExample, 
    actualOutput: string,
    executionMetadata: Record<string, any>
  ): Promise<EvaluationResult['scores']> {
    const scores = {
      correctness: 0,
      groundedness: 0,
      safety: 0,
      cost_latency: 0,
      regression: 0
    };

    const criteria = example.evaluation_criteria;

    // Run each scorer
    for (const [scorerName, scorer] of this.scorers) {
      try {
        const score = await scorer.score(example, actualOutput, executionMetadata);
        scores[scorerName as keyof typeof scores] = score;
      } catch (error) {
        logger.error({ exampleId: example.id, error: error?.toString() }, `Scorer ${scorerName} failed`);
        scores[scorerName as keyof typeof scores] = 0;
      }
    }

    return scores;
  }

  calculateOverallScore(
    scores: EvaluationResult['scores'],
    criteria: GoldenExample['evaluation_criteria']
  ): number {
    const weights = {
      correctness: criteria.correctness_weight || 0.25,
      groundedness: criteria.groundedness_weight || 0.25,
      safety: criteria.safety_weight || 0.2,
      cost_latency: criteria.cost_latency_weight || 0.15,
      regression: criteria.regression_weight || 0.15
    };

    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    const normalizedWeights = Object.fromEntries(
      Object.entries(weights).map(([key, weight]) => [key, weight / totalWeight])
    );

    return Object.entries(scores).reduce((total, [scoreName, score]) => {
      const weight = normalizedWeights[scoreName as keyof typeof normalizedWeights];
      return total + (score * weight);
    }, 0);
  }

  async runEvaluation(): Promise<EvaluationReport> {
    const startTime = Date.now();
    logger.info({ datasetPath: this.datasetPath }, 'Starting evaluation run');

    try {
      // Load dataset and baseline
      const [examples, baseline] = await Promise.all([
        this.loadGoldenDataset(),
        this.loadBaseline()
      ]);

      const results: EvaluationResult[] = [];
      let passedCount = 0;

      // Process each example
      for (const example of examples) {
        try {
          const execution = await this.executeExample(example);
          const scores = await this.scoreExample(
            example, 
            execution.output, 
            {
              tokenUsage: execution.tokenUsage,
              latencyMs: execution.latencyMs,
              costEstimate: execution.costEstimate
            }
          );

          const overallScore = this.calculateOverallScore(scores, example.evaluation_criteria);
          const passedThreshold = overallScore >= this.thresholds.overall &&
            Object.entries(scores).every(([scoreName, score]) => {
              const threshold = this.thresholds[scoreName as keyof typeof this.thresholds];
              return score >= threshold;
            });

          if (passedThreshold) passedCount++;

          results.push({
            example_id: example.id,
            scores,
            overall_score: overallScore,
            actual_output: execution.output,
            metadata: {
              token_usage: execution.tokenUsage,
              latency_ms: execution.latencyMs,
              cost_estimate: execution.costEstimate
            },
            passed_threshold: passedThreshold
          });

        } catch (error) {
          logger.error({ exampleId: example.id, error: error?.toString() }, 'Failed to evaluate example');
          // Add a failed result
          results.push({
            example_id: example.id,
            scores: { correctness: 0, groundedness: 0, safety: 0, cost_latency: 0, regression: 0 },
            overall_score: 0,
            actual_output: '',
            metadata: { token_usage: 0, latency_ms: 0, cost_estimate: 0 },
            passed_threshold: false
          });
        }
      }

      // Calculate summary statistics
      const overallScore = results.reduce((sum, r) => sum + r.overall_score, 0) / results.length;
      const averageScores = {
        correctness: results.reduce((sum, r) => sum + r.scores.correctness, 0) / results.length,
        groundedness: results.reduce((sum, r) => sum + r.scores.groundedness, 0) / results.length,
        safety: results.reduce((sum, r) => sum + r.scores.safety, 0) / results.length,
        cost_latency: results.reduce((sum, r) => sum + r.scores.cost_latency, 0) / results.length,
        regression: results.reduce((sum, r) => sum + r.scores.regression, 0) / results.length
      };

      // Compare with baseline
      const baselineComparison = this.compareWithBaseline(averageScores, baseline);

      const endTime = Date.now();
      const duration = endTime - startTime;

      const report: EvaluationReport = {
        summary: {
          total_examples: examples.length,
          passed_examples: passedCount,
          failed_examples: examples.length - passedCount,
          overall_score: overallScore,
          average_scores: averageScores
        },
        results,
        baseline_comparison: baselineComparison,
        execution_metadata: {
          timestamp: new Date().toISOString(),
          duration_ms: duration,
          model_used: 'gpt-4', // This should be configurable
          dataset_path: this.datasetPath
        }
      };

      logger.info({ totalExamples: examples.length, passedCount, overallScore, duration }, 'Evaluation completed');

      return report;

    } catch (error) {
      logger.error({ error: error?.toString() }, 'Evaluation run failed');
      throw error;
    }
  }

  private compareWithBaseline(
    currentScores: Record<string, number>, 
    baseline: Record<string, number>
  ): EvaluationReport['baseline_comparison'] {
    const regressions: string[] = [];
    const improvements: string[] = [];

    for (const [metric, currentScore] of Object.entries(currentScores)) {
      const baselineScore = baseline[metric];
      if (baselineScore !== undefined) {
        const change = currentScore - baselineScore;
        const percentChange = (change / baselineScore) * 100;

        if (percentChange < -5) {
          regressions.push(`${metric}: ${baselineScore.toFixed(3)} → ${currentScore.toFixed(3)} (${percentChange.toFixed(1)}%)`);
        } else if (percentChange > 2) {
          improvements.push(`${metric}: ${baselineScore.toFixed(3)} → ${currentScore.toFixed(3)} (+${percentChange.toFixed(1)}%)`);
        }
      }
    }

    return {
      previous_scores: baseline,
      regressions,
      improvements
    };
  }

  async saveBaseline(report: EvaluationReport): Promise<void> {
    try {
      await fs.mkdir(this.baselinePath, { recursive: true });
      
      const baselineFile = path.join(this.baselinePath, 'latest.json');
      const timestampedFile = path.join(this.baselinePath, `baseline-${Date.now()}.json`);

      const baselineData = report.summary.average_scores;
      
      await Promise.all([
        fs.writeFile(baselineFile, JSON.stringify(baselineData, null, 2)),
        fs.writeFile(timestampedFile, JSON.stringify({
          ...baselineData,
          timestamp: report.execution_metadata.timestamp,
          summary: report.summary
        }, null, 2))
      ]);

      logger.info({ baselineFile }, 'Baseline saved');
    } catch (error) {
      logger.error({ error: error?.toString() }, 'Failed to save baseline');
      throw error;
    }
  }

  async generateReport(report: EvaluationReport): Promise<string> {
    const { summary, baseline_comparison, execution_metadata } = report;

    let reportText = `
# AI Evaluation Report
Generated: ${execution_metadata.timestamp}
Duration: ${(execution_metadata.duration_ms / 1000).toFixed(2)}s
Dataset: ${execution_metadata.dataset_path}
Model: ${execution_metadata.model_used}

## Summary
- Total Examples: ${summary.total_examples}
- Passed: ${summary.passed_examples} (${((summary.passed_examples / summary.total_examples) * 100).toFixed(1)}%)
- Failed: ${summary.failed_examples}
- Overall Score: ${(summary.overall_score * 100).toFixed(1)}%

## Average Scores
- Correctness: ${(summary.average_scores.correctness * 100).toFixed(1)}%
- Groundedness: ${(summary.average_scores.groundedness * 100).toFixed(1)}%
- Safety: ${(summary.average_scores.safety * 100).toFixed(1)}%
- Cost & Latency: ${(summary.average_scores.cost_latency * 100).toFixed(1)}%
- Regression: ${(summary.average_scores.regression * 100).toFixed(1)}%
`;

    if (baseline_comparison) {
      reportText += `
## Baseline Comparison
`;
      if (baseline_comparison.regressions.length > 0) {
        reportText += `
### Regressions (>5% decline)
${baseline_comparison.regressions.map(r => `- ${r}`).join('\n')}
`;
      }
      if (baseline_comparison.improvements.length > 0) {
        reportText += `
### Improvements (>2% gain)
${baseline_comparison.improvements.map(i => `- ${i}`).join('\n')}
`;
      }
      if (baseline_comparison.regressions.length === 0 && baseline_comparison.improvements.length === 0) {
        reportText += `
No significant changes detected.
`;
      }
    }

    // Add failed examples details
    const failedResults = report.results.filter(r => !r.passed_threshold);
    if (failedResults.length > 0) {
      reportText += `
## Failed Examples
${failedResults.map(r => `
### ${r.example_id}
- Overall Score: ${(r.overall_score * 100).toFixed(1)}%
- Correctness: ${(r.scores.correctness * 100).toFixed(1)}%
- Groundedness: ${(r.scores.groundedness * 100).toFixed(1)}%
- Safety: ${(r.scores.safety * 100).toFixed(1)}%
- Cost & Latency: ${(r.scores.cost_latency * 100).toFixed(1)}%
- Regression: ${(r.scores.regression * 100).toFixed(1)}%
`).join('\n')}
`;
    }

    return reportText;
  }
}
