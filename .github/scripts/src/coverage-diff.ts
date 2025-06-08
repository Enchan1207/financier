// テストカバレッジのdiffをとる

import { z } from 'zod'

const CoverageSchema = z.object({
  total: z.number(),
  covered: z.number(),
  skipped: z.number(),
  pct: z.number(),
})

type Coverage = z.infer<typeof CoverageSchema>

const CoverageSummarySchema = z.object({
  lines: CoverageSchema,
  statements: CoverageSchema,
  functions: CoverageSchema,
  branches: CoverageSchema,
  branchesTrue: CoverageSchema,
})

type CoverageSummary = z.infer<typeof CoverageSummarySchema>

const main = (args: string[]): number => {
  if (args.length !== 4) {
    console.error('Usage: coverage-diff [source] [target]')
    return 1
  }

  const [sourceRaw, targetRaw] = args.slice(2)

  const target = CoverageSummarySchema.parse(JSON.parse(targetRaw))
  const source = CoverageSummarySchema.parse(JSON.parse(sourceRaw))
  const diff = compareSummaries(source, target)

  const headers = [
    'lines',
    'statements',
    'functions',
    'branches',
    'branchesTrue',
  ]
  const separator = Array.from({ length: headers.length + 1 })
    .map(() => '-')
    .join('|')

  console.log('branch |', headers.join(' | '))
  console.log(separator)
  console.log('target |', stringifyCoverageSummary(target))
  console.log('source |', stringifyCoverageSummary(source))
  console.log('diff |', stringifyCoverageSummaryDiff(diff))

  return 0
}

const stringifyCoverageSummaryDiff = ({
  lines,
  statements,
  functions,
  branches,
  branchesTrue,
}: CoverageSummary) =>
  [lines, statements, functions, branches, branchesTrue]
    .map(stringifyCoverageDiff)
    .join(' | ')

const stringifyCoverageDiff = ({ total, covered, pct }: Coverage) =>
  `${covered}/${total}<br>(${pct > 0 ? '+' : ''}${pct}%)`

const stringifyCoverageSummary = ({
  lines,
  statements,
  functions,
  branches,
  branchesTrue,
}: CoverageSummary) =>
  [lines, statements, functions, branches, branchesTrue]
    .map(stringifyCoverage)
    .join(' | ')

const stringifyCoverage = ({ total, covered, pct }: Coverage) =>
  `${covered}/${total}<br>(${pct}%)`

const compareSummaries = (
  source: CoverageSummary,
  target: CoverageSummary,
): CoverageSummary => ({
  lines: compareCoverage(source.lines, target.lines),
  statements: compareCoverage(source.statements, target.statements),
  functions: compareCoverage(source.functions, target.functions),
  branches: compareCoverage(source.branches, target.branches),
  branchesTrue: compareCoverage(source.branchesTrue, target.branchesTrue),
})

const compareCoverage = (source: Coverage, target: Coverage): Coverage => ({
  total: target.total - source.total,
  covered: target.covered - source.covered,
  skipped: target.skipped - source.skipped,
  pct: target.pct - source.pct,
})

process.exit(main(process.argv))
