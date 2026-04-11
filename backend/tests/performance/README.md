# Performance Tests (Artillery)

This folder contains API performance test scenarios for Express endpoints.

## Prerequisites
- Backend server running (default: http://localhost:5000)
- Artillery installed in dev dependencies

## Configure target
Default target is `http://localhost:5000`.

To run against a different host:

```bash
PERF_TARGET=http://localhost:5000 npm run perf:smoke
```

On Windows PowerShell:

```powershell
$env:PERF_TARGET="http://localhost:5000"; npm run perf:smoke
```

## Scenarios
- `smoke.yml`: quick sanity baseline
- `load.yml`: sustained medium load
- `stress.yml`: high concurrency and ramp-up

## Commands
```bash
npm run perf:smoke
npm run perf:load
npm run perf:stress
npm run perf:report:load
```

## Recommended interpretation
- Compare p95/p99 latency across runs
- Track error rate under sustained load
- Validate no major throughput drop during ramp-up
- Use `perf:report:load` HTML output under `tests/performance/results/`

## Notes
- These tests focus on public and read-heavy endpoints to avoid requiring seeded auth state.
- You can extend scenarios with authenticated flows by adding token bootstrap steps.
