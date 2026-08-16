import { spawnSync } from 'node:child_process'
import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const failures = []
const expectedInject = [
  '@deepseek-ai/dsh-client-connection',
  '@deepseek-ai/dsh-client-runtime',
  '@deepseek-ai/dsh-client-ui-conversation',
]
const requiredManifestFiles = [
  'lib/index.js',
  'lib/client.js',
  'lib/client.js.map',
  'lib/types/**/*.d.ts',
  'cordis.patch.yml',
  'assets/*.png',
]
const requiredPackFiles = [
  'package.json',
  'README.md',
  'LICENSE',
  'cordis.patch.yml',
  'lib/index.js',
  'lib/client.js',
  'lib/client.js.map',
  'assets/fork-diff-desktop.png',
  'assets/fork-diff-selector.png',
  'assets/fork-diff-mobile.png',
]
const requiredLocalFiles = [
  ['cordis.patch.yml', 1],
  ['lib/index.js', 1],
  ['lib/client.js', 1],
  ['assets/fork-diff-desktop.png', 1_000],
  ['assets/fork-diff-selector.png', 1_000],
  ['assets/fork-diff-mobile.png', 1_000],
]
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function fail(message) {
  failures.push(message)
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

let packageJson
try {
  packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
} catch (error) {
  fail(`package.json is not readable JSON: ${error instanceof Error ? error.message : String(error)}`)
}

if (isRecord(packageJson)) {
  const dsh = isRecord(packageJson.dsh) ? packageJson.dsh : undefined
  const bundle = isRecord(dsh?.bundle) ? dsh.bundle : undefined
  const client = isRecord(dsh?.client) ? dsh.client : undefined
  const inject = Array.isArray(client?.inject) ? client.inject : undefined
  const peers = isRecord(packageJson.peerDependencies) ? packageJson.peerDependencies : undefined
  const files = Array.isArray(packageJson.files) ? packageJson.files : undefined

  if (bundle?.patch !== './cordis.patch.yml') {
    fail('dsh.bundle.patch must equal ./cordis.patch.yml')
  }
  if (client?.platform !== 'web') fail('dsh.client.platform must equal web')
  if (JSON.stringify(inject) !== JSON.stringify(expectedInject)) {
    fail(`dsh.client.inject must equal ${JSON.stringify(expectedInject)}`)
  }
  if (inject !== undefined && new Set(inject).size !== inject.length) {
    fail('dsh.client.inject must not contain duplicates')
  }
  for (const id of expectedInject) {
    if (typeof peers?.[id] !== 'string' || peers[id] === '') {
      fail(`peerDependencies must declare injected package ${JSON.stringify(id)}`)
    }
  }
  for (const entry of requiredManifestFiles) {
    if (files === undefined || !files.includes(entry)) {
      fail(`package files allowlist is missing ${JSON.stringify(entry)}`)
    }
  }
}

for (const [relativePath, minimumSize] of requiredLocalFiles) {
  const url = new URL(`../${relativePath}`, import.meta.url)
  try {
    const value = await stat(url)
    if (!value.isFile() || value.size < minimumSize) {
      fail(`${relativePath} must be a file of at least ${String(minimumSize)} bytes`)
    }
    if (relativePath.endsWith('.png')) {
      const bytes = await readFile(url)
      if (!bytes.subarray(0, pngSignature.length).equals(pngSignature)) {
        fail(`${relativePath} does not have a PNG signature`)
      }
    }
  } catch (error) {
    fail(`${relativePath} is missing or unreadable: ${error instanceof Error ? error.message : String(error)}`)
  }
}

const npmExecPath = process.env.npm_execpath
let packRecord
if (typeof npmExecPath !== 'string' || npmExecPath === '') {
  fail('npm_execpath is unavailable; run this check through npm run verify:package')
} else {
  const result = spawnSync(
    process.execPath,
    [npmExecPath, 'pack', '--dry-run', '--json', '--ignore-scripts'],
    { cwd: root, encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 },
  )
  if (result.error !== undefined) {
    fail(`npm pack dry-run could not start: ${result.error.message}`)
  } else if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim() || `exit ${String(result.status)}`
    fail(`npm pack dry-run failed: ${detail}`)
  } else {
    try {
      const records = JSON.parse(result.stdout)
      if (!Array.isArray(records) || records.length !== 1 || !isRecord(records[0])) {
        fail('npm pack dry-run must return exactly one package record')
      } else {
        packRecord = records[0]
      }
    } catch (error) {
      fail(`npm pack dry-run returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

if (isRecord(packRecord)) {
  if (packRecord.name !== packageJson?.name || packRecord.version !== packageJson?.version) {
    fail('npm pack identity does not match package.json name and version')
  }
  const entries = Array.isArray(packRecord.files) ? packRecord.files : []
  const paths = new Set()
  for (const entry of entries) {
    if (!isRecord(entry) || typeof entry.path !== 'string') {
      fail('npm pack contains an invalid file entry')
      continue
    }
    paths.add(entry.path)
    if (typeof entry.size !== 'number' || !Number.isFinite(entry.size) || entry.size < 1) {
      fail(`npm pack entry ${JSON.stringify(entry.path)} is empty or has an invalid size`)
    }
    if (/^(?:src|tests|scripts|docs|\.github)\//u.test(entry.path)
      || /^(?:AGENTS|CLAUDE|CONTRIBUTING|SECURITY|CHANGELOG|task_plan|findings|progress)\.md$/u.test(entry.path)
      || /(?:^|\/)\.env(?:\.|$)/u.test(entry.path)) {
      fail(`npm pack contains forbidden development or evidence file ${JSON.stringify(entry.path)}`)
    }
  }
  for (const relativePath of requiredPackFiles) {
    if (!paths.has(relativePath)) fail(`npm pack is missing ${JSON.stringify(relativePath)}`)
  }
  if (![...paths].some(path => path.startsWith('lib/types/') && path.endsWith('.d.ts'))) {
    fail('npm pack contains no generated TypeScript declarations')
  }
}

if (failures.length > 0) {
  for (const message of failures) console.error(`[package-contract] ${message}`)
  process.exitCode = 1
} else {
  console.log(`[package-contract] PASS (${String(packRecord.files.length)} packed files, ${String(requiredLocalFiles.length)} required artifacts)`)
}
