import { startVitest } from 'vitest/node'

const argv = process.argv.slice(2)
const watch = argv.includes('--watch')
const filters = argv.filter((arg) => arg !== '--watch')

await startVitest(
  'test',
  filters,
  {
    config: false,
    root: process.cwd(),
    watch,
    run: !watch,
    globals: true,
    environment: 'jsdom',
  },
  {
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
    },
  },
)

process.exit(process.exitCode ?? 0)
