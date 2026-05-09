# AI Evaluation Framework

## Overview

The AI Evaluation Framework provides automated testing and quality assurance for AI features in the workspace. It uses golden datasets to evaluate AI responses across multiple dimensions and integrates with CI/CD pipelines to prevent regressions.

## Architecture

### Core Components

- **Evaluation Runner** (`artifacts/api-server/src/lib/eval/runner.ts`): Main orchestrator that loads datasets, executes AI pipelines, and generates reports
- **Scorers** (`artifacts/api-server/src/lib/eval/scorers.ts`): Pluggable evaluation metrics (correctness, groundedness, safety, cost-latency, regression)
- **Golden Datasets** (`data/eval/`): Curated test cases with expected outputs and evaluation criteria
- **CLI Interface** (`artifacts/api-server/src/eval.mjs`): Command-line tool for running evaluations
- **CI Integration** (`.github/workflows/ai-evaluation.yml`): Automated evaluation on pull requests

### Evaluation Metrics

#### 1. Correctness (25% default weight)
- Exact match comparison for deterministic outputs
- BLEU score for text similarity
- Semantic similarity using word overlap
- **Threshold**: 85%

#### 2. Groundedness (25% default weight)
- Verifies claims against provided context/citations
- Extracts factual statements from AI responses
- Checks source material for claim support
- **Threshold**: 90%

#### 3. Safety (20% default weight)
- PII leakage detection (SSN, credit cards, emails, phone numbers)
- Toxic content filtering
- Prompt injection vulnerability detection
- **Threshold**: 95%

#### 4. Cost & Latency (15% default weight)
- Response time monitoring (max 5 seconds)
- Token usage efficiency (max 4K tokens)
- Cost estimation (max $0.01 per request)
- **Threshold**: 70%

#### 5. Regression (15% default weight)
- Compares current scores against stored baseline
- Detects >5% performance declines
- Tracks improvements and regressions across metrics
- **Threshold**: 90%

## Usage

### Running Evaluations Locally

```bash
# Run default evaluation
pnpm run eval

# Run specific dataset
pnpm run eval data/eval/chat

# Run with verbose output
pnpm run eval --verbose

# Run without saving baseline
pnpm run eval --no-save-baseline

# Show help
pnpm run eval --help
```

### Exit Codes

- `0`: Success
- `1`: Evaluation failures (non-blocking in CI)
- `2`: Configuration error
- `3`: Dataset error
- `4`: Regressions detected (>5% decline, blocks merge)

## Golden Dataset Format

### Example Structure

```json
{
  "id": "chat_basic_001",
  "input": "What is the purpose of project management?",
  "expected_output": "Project management is the process of planning, executing...",
  "evaluation_criteria": {
    "correctness_weight": 0.3,
    "groundedness_weight": 0.2,
    "safety_weight": 0.2,
    "cost_latency_weight": 0.15,
    "regression_weight": 0.15
  },
  "metadata": {
    "category": "basic_qna",
    "difficulty": "easy",
    "tags": ["project_management", "definition"]
  }
}
```

### Required Fields

- `id`: Unique identifier for the test case
- `input`: The prompt/question to evaluate
- `evaluation_criteria`: Weight configuration for each metric

### Optional Fields

- `expected_output`: Ground truth answer for correctness scoring
- `scenario`: Context for the evaluation scenario
- `metadata`: Additional categorization and tagging

## Dataset Organization

```
data/eval/
├── chat/
│   ├── basic_qna.json      # Basic Q&A examples
│   ├── task_summarization.json  # Task summarization tests
│   └── code_review.json    # Code review scenarios
├── baselines/
│   ├── latest.json         # Current baseline scores
│   └── baseline-timestamp.json  # Historical baselines
└── work/                   # Work management evaluations (future)
```

## Adding New Examples

### 1. Create Test Cases

Add new examples to the appropriate category file in `data/eval/`:

```bash
# Add to existing category
echo '{"id": "new_test", "input": "...", "expected_output": "..."}' >> data/eval/chat/basic_qna.json

# Or create new category file
touch data/eval/chat/new_category.json
```

### 2. Test Locally

```bash
# Run evaluation to verify new examples
pnpm run eval data/eval/chat --verbose
```

### 3. Update Baseline

If the new examples improve overall scores, update the baseline:

```bash
# This automatically saves new baseline
pnpm run eval data/eval/chat
```

### 4. Commit Changes

```bash
git add data/eval/
git commit -m "Add evaluation examples for new feature"
```

## CI/CD Integration

### Automatic Triggers

The evaluation runs automatically on:

- **Pull Requests**: When AI-related files are modified
- **Pushes**: To main/develop branches with AI changes

### Triggering Files

- `artifacts/api-server/src/lib/eval/**`
- `data/eval/**`
- `artifacts/api-server/src/lib/chat-service.ts`
- `artifacts/api-server/src/lib/chat-stream.ts`

### Merge Blocking

- **Regressions >5%**: Blocks merge (exit code 4)
- **Configuration errors**: Blocks merge (exit code 2)
- **Dataset errors**: Blocks merge (exit code 3)
- **Test failures**: Warning only (exit code 1)

### PR Comments

Automated comments provide evaluation summaries:

```
## 🤖 AI Evaluation Results

| Metric | Result |
|--------|--------|
| Total Examples | 15 |
| Passed | 14 (93.3%) |
| Failed | 1 |
| Overall Score | 87.5% |
```

## Development Guidelines

### Writing Good Test Cases

1. **Cover Edge Cases**: Include boundary conditions and error scenarios
2. **Diverse Inputs**: Test different question types, lengths, and complexities
3. **Realistic Scenarios**: Use actual user workflows and business contexts
4. **Clear Expected Outputs**: Provide specific, verifiable answers
5. **Appropriate Weights**: Adjust criteria weights based on feature importance

### Best Practices

- **Start Small**: Begin with 5-10 examples per category, expand gradually
- **Regular Updates**: Review and update datasets monthly or after major changes
- **Version Control**: Track dataset changes alongside code changes
- **Documentation**: Include clear descriptions for complex test scenarios
- **Balance**: Ensure coverage across all feature areas and difficulty levels

### Common Pitfalls

- **Overly Specific Expected Outputs**: Allow for reasonable variation in responses
- **Missing Context**: Provide necessary context for groundedness evaluations
- **Imbalanced Weights**: Avoid overweighting less important metrics
- **Stale Examples**: Regularly review and update outdated test cases
- **Coverage Gaps**: Ensure all major features have evaluation coverage

## Troubleshooting

### Common Issues

#### Evaluation Fails to Start
```bash
# Check environment setup
cd artifacts/api-server
ls -la .env
cat .env | grep NODE_ENV
```

#### Dataset Loading Errors
```bash
# Verify dataset format
cat data/eval/chat/basic_qna.json | jq '.[0]'
# Should show valid JSON structure
```

#### Baseline Comparison Issues
```bash
# Check baseline exists
ls -la data/eval/baselines/
cat data/eval/baselines/latest.json
```

#### Scorer Failures
```bash
# Run with verbose logging
pnpm run eval --verbose
# Check individual scorer errors in output
```

### Debug Mode

Enable detailed logging:

```bash
# Verbose evaluation with debugging
NODE_ENV=development LOG_LEVEL=debug pnpm run eval --verbose
```

### Manual Scorer Testing

Test individual scorers:

```bash
# Create debug script
node -e "
import { CorrectnessScorer } from './dist/lib/eval/scorers.mjs';
const scorer = new CorrectnessScorer();
scorer.score({
  id: 'test',
  input: 'test',
  expected_output: 'expected'
}, 'actual').then(console.log);
"
```

## Performance Considerations

### Evaluation Duration

- **Small datasets** (< 20 examples): ~30 seconds
- **Medium datasets** (20-50 examples): ~1-2 minutes
- **Large datasets** (50+ examples): ~3-5 minutes

### Optimization Tips

1. **Parallel Processing**: Scorers run in parallel where possible
2. **Caching**: Baseline comparisons are cached
3. **Batch Processing**: Multiple examples processed together
4. **Resource Limits**: Monitor memory usage for large datasets

### Resource Requirements

- **Memory**: ~100MB base + ~10MB per 10 examples
- **CPU**: Moderate usage during scoring
- **Disk**: ~1MB for datasets + baselines
- **Network**: Minimal (local evaluation only)

## Future Enhancements

### Planned Features

- **LLM-as-Judge**: Use AI models for nuanced evaluation
- **Continuous Monitoring**: Production drift detection
- **Multi-Model Support**: Evaluate different AI models
- **Custom Scorers**: Plugin system for domain-specific metrics
- **Dashboard**: Web interface for evaluation results

### Extension Points

- **Custom Scorers**: Implement `ScorerInterface` for new metrics
- **Dataset Sources**: Support external dataset providers
- **Export Formats**: JSON, CSV, XML report generation
- **Integration**: Test framework integrations (Jest, Vitest)

## Support

For questions or issues:

1. Check this documentation first
2. Review existing GitHub issues
3. Create new issue with:
   - Error messages
   - Dataset examples
   - Environment details
   - Expected vs actual behavior

---

*Last updated: May 2026*
