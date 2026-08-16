import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
const allowed = new Set([
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-attachment',
  '@deepseek-ai/dsh-client-schema-form',
  '@deepseek-ai/dsh-client-runtime/client',
])

function fail(message) {
  console.error(`[bundle-contract] ${message}`)
  process.exitCode = 1
}

if (!/^window\.__ModuleLoader__\.load\(\{\s*id:\s*["']dsh-fork-diff["'],\s*factory:\s*\(require\)\s*=>\s*\{/u.test(source)) {
  fail('client.js is not a dsh-fork-diff ModuleLoader factory')
}
if (!/return module\.exports;\s*\}\s*\}\);/u.test(source)) fail('client.js has no ModuleLoader footer')
if (source.includes('react.production.min') || source.includes('__SECRET_INTERNALS_DO_NOT_USE')) {
  fail('client.js appears to contain a bundled React runtime')
}

const requires = [...source.matchAll(/require\(["']([^"']+)["']\)/g)].map(match => match[1])
for (const id of new Set(requires)) {
  if (id !== undefined && !allowed.has(id)) fail(`client.js requires unsupported host module ${JSON.stringify(id)}`)
}
if (!requires.includes('react') || !requires.includes('react/jsx-runtime')) {
  fail('client.js does not resolve React through the host module table')
}
if (!requires.includes('@deepseek-ai/dsh-client-ui-primitives')) {
  fail('client.js does not resolve DSH primitives through the host module table')
}

if (process.exitCode === undefined) {
  console.log(`[bundle-contract] PASS (${source.length} chars, ${new Set(requires).size} external modules)`)
}
