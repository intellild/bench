#!/usr/bin/env zx

const SUBMODULES = ['rspack-json', 'rspack-storage', 'rspack-rkyv']

if (argv._.length === 0) {
  console.log(`Usage: ./run-submodules.mjs <command> [args...]`)
  console.log(`Example: ./run-submodules.mjs pnpm build:cli:release`)
  process.exit(1)
}

const cmd = argv._
console.log(`Running: ${cmd.join(' ')}`)
console.log(`In: ${SUBMODULES.join(', ')}\n`)

const results = await Promise.allSettled(
  SUBMODULES.map(async (dir) => {
    const start = Date.now()
    try {
      await $({ cwd: dir })`${cmd}`
      const elapsed = ((Date.now() - start) / 1000).toFixed(1)
      console.log(`[${dir}] OK (${elapsed}s)`)
      return { dir, ok: true }
    } catch (e) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1)
      console.error(`[${dir}] FAILED (${elapsed}s)`)
      return { dir, ok: false }
    }
  })
)

const failed = results.filter((r) => r.status === 'fulfilled' && !r.value.ok)
if (failed.length > 0) {
  console.error(`\nFailed: ${failed.map((r) => r.value.dir).join(', ')}`)
  process.exit(1)
} else {
  console.log(`\nAll submodules completed successfully.`)
}