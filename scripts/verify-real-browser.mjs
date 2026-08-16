import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const baseUrl = process.env.DSH_BROWSER_BASE_URL ?? 'http://127.0.0.1:3091'
const playwrightEntry = process.env.DSH_PLAYWRIGHT_CORE
const edgePath = process.env.DSH_EDGE_PATH
const dshVersion = process.env.DSH_BROWSER_DSH_VERSION
const outputDir = resolve(process.env.DSH_BROWSER_OUTPUT_DIR ?? 'assets')
const receiptPath = resolve(process.env.DSH_BROWSER_RECEIPT ?? 'docs/browser-gate-receipt.json')
const projectRoot = resolve('.')
const localBundlePath = resolve('lib/client.js')
const desktopScreenshotPath = resolve(outputDir, 'fork-diff-desktop.png')
const selectorScreenshotPath = resolve(outputDir, 'fork-diff-selector.png')
const mobileScreenshotPath = resolve(outputDir, 'fork-diff-mobile.png')

if (!playwrightEntry) throw new Error('DSH_PLAYWRIGHT_CORE must point to playwright-core/index.mjs')
if (!edgePath) throw new Error('DSH_EDGE_PATH must point to Microsoft Edge')
if (!dshVersion) throw new Error('DSH_BROWSER_DSH_VERSION must identify the tested DSH build')

function sha256(value) {
  return createHash('sha256').update(value).digest('hex').toUpperCase()
}

const gitHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: projectRoot, encoding: 'utf8' }).trim()
const gitStatus = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
  cwd: projectRoot,
  encoding: 'utf8',
}).trim()
const trackedDiff = execFileSync('git', ['diff', '--binary', 'HEAD'], {
  cwd: projectRoot,
  maxBuffer: 50 * 1024 * 1024,
})
const localBundleSha256 = sha256(readFileSync(localBundlePath))

const rootResponse = await fetch(baseUrl)
if (!rootResponse.ok) throw new Error(`DSH root returned HTTP ${String(rootResponse.status)}`)
const rootHtml = await rootResponse.text()
const pluginAssetMatch = rootHtml.match(/\/plugins\/dsh-fork-diff\/client\.js\?rev=[a-f0-9]+/)
if (!pluginAssetMatch) throw new Error('DSH root is missing the dsh-fork-diff boot asset')
const pluginAssetUrl = new URL(pluginAssetMatch[0], baseUrl).href
const pluginAssetResponse = await fetch(pluginAssetUrl)
if (!pluginAssetResponse.ok) throw new Error(`Plugin asset returned HTTP ${String(pluginAssetResponse.status)}`)
const pluginAssetBytes = Buffer.from(await pluginAssetResponse.arrayBuffer())
const servedBundleSha256 = sha256(pluginAssetBytes)
if (servedBundleSha256 !== localBundleSha256) {
  throw new Error(`Served bundle hash does not match local build (${servedBundleSha256} !== ${localBundleSha256})`)
}

const { chromium } = await import(pathToFileURL(playwrightEntry).href)
const errors = { console: [], page: [], request: [] }
const receipt = {
  generatedAt: new Date().toISOString(),
  git: {
    head: gitHead,
    dirty: gitStatus.length > 0,
    statusSha256: sha256(gitStatus),
    trackedDiffSha256: sha256(trackedDiff),
  },
  dsh: { version: dshVersion, baseUrl },
  baseUrl,
  browser: {
    name: 'Microsoft Edge',
    executablePath: edgePath,
    version: '',
    headless: true,
  },
  plugin: {
    assetUrl: pluginAssetUrl,
    assetStatus: pluginAssetResponse.status,
    bytes: pluginAssetBytes.length,
    servedBundleSha256,
    localBundlePath,
    localBundleSha256,
  },
  viewport: { desktop: { width: 1440, height: 1000 }, mobile: { width: 390, height: 844 } },
  checks: {},
  screenshots: {},
  errors,
}

function invariant(condition, message) {
  if (!condition) throw new Error(message)
}

async function waitForReady(page) {
  await page.locator('.dsh-fork-diff__branch').first().waitFor({ state: 'visible' })
  await page.waitForFunction(() => !document.body.innerText.includes('正在读取两个分支的完整历史'))
}

async function ensureComparableSession(page) {
  const trigger = page.getByRole('button', { name: '比较分支', exact: true })
  if (await trigger.isVisible()) return false

  const overflow = page.getByRole('button', { name: /展开其余 \d+ 个会话/ })
  if (await overflow.isVisible()) await overflow.click()

  const knownSession = page.getByText(/PARENT_BASELINE_RESPONSE_SHARED_PLAN/).first()
  await knownSession.waitFor({ state: 'visible', timeout: 10_000 })
  await knownSession.click()
  await trigger.waitFor({ state: 'visible', timeout: 10_000 })
  return true
}

async function openDialog(page) {
  const trigger = page.getByRole('button', { name: '比较分支', exact: true })
  try {
    await trigger.waitFor({ state: 'visible', timeout: 10_000 })
  } catch (error) {
    const buttons = await page.locator('button').evaluateAll(nodes => nodes
      .filter(node => node.offsetParent !== null)
      .map(node => ({
        text: node.textContent?.trim() ?? '',
        ariaLabel: node.getAttribute('aria-label'),
        title: node.getAttribute('title'),
        className: node.className,
      })))
    process.stderr.write(`[browser-gate] visible buttons: ${JSON.stringify(buttons)}\n`)
    throw error
  }
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: '分支对比' })
  await dialog.waitFor({ state: 'visible' })
  await waitForReady(page)
  return { trigger, dialog }
}

async function selectCandidate(page, value) {
  const select = page.locator('.dsh-fork-diff__select')
  await select.selectOption(value)
  await waitForReady(page)
}

async function findRealSibling(page, options) {
  for (const option of options.filter(item => item.label.includes('兄弟分支'))) {
    await selectCandidate(page, option.value)
    const text = await page.getByRole('dialog', { name: '分支对比' }).innerText()
    if (
      text.includes('BRANCH_A_RESPONSE_CACHE_FIRST_PATH_WITH_TWO_CHECKS.')
      && text.includes('BRANCH_B_RESPONSE_TOOL_ASSISTED_PATH_WITH_RECOVERY.')
    ) return option
  }
  throw new Error('No sibling candidate produced the two preregistered branch responses')
}

async function assertNoHorizontalOverflow(page, selector) {
  const value = await page.locator(selector).evaluate(element => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }))
  invariant(value.scrollWidth <= value.clientWidth + 1, `${selector} overflows horizontally`)
}

mkdirSync(outputDir, { recursive: true })
mkdirSync(dirname(receiptPath), { recursive: true })

const browser = await chromium.launch({
  executablePath: edgePath,
  headless: true,
  args: ['--disable-gpu'],
})
receipt.browser.version = browser.version()

try {
  const context = await browser.newContext({ viewport: receipt.viewport.desktop, locale: 'zh-CN' })
  const page = await context.newPage()
  let pluginAssetStatus

  page.on('console', (message) => {
    if (message.type() === 'error') errors.console.push(message.text())
  })
  page.on('pageerror', error => errors.page.push(error.message))
  page.on('requestfailed', (request) => {
    errors.request.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`.trim())
  })
  page.on('response', (response) => {
    if (response.url().includes('/plugins/dsh-fork-diff/client.js')) pluginAssetStatus = response.status()
  })

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  const noForkTriggerHidden = await ensureComparableSession(page)
  const { trigger, dialog } = await openDialog(page)
  const styleCount = await page.locator('#dsh-fork-diff-style').count()
  invariant(styleCount === 1, `Expected one plugin style node, got ${styleCount}`)
  invariant(pluginAssetStatus === 200, `Expected plugin asset HTTP 200, got ${String(pluginAssetStatus)}`)

  const select = page.locator('.dsh-fork-diff__select')
  const options = await select.locator('option').evaluateAll(nodes => nodes.map(node => ({
    value: node.value,
    label: node.textContent ?? '',
  })))
  invariant(options.some(item => item.label.includes('兄弟分支')), 'Sibling candidate is missing')
  invariant(options.some(item => item.label.includes('父分支')), 'Parent candidate is missing')

  const sibling = await findRealSibling(page, options)
  const text = await dialog.innerText()
  const metricTexts = await page.locator('.dsh-fork-diff__metrics').allInnerTexts()
  invariant(metricTexts.length === 2, `Expected two metric groups, got ${metricTexts.length}`)
  invariant(metricTexts.every(value => value.includes('2 用户')), `Expected both branches to show 2 direct user prompts: ${metricTexts.join(' | ')}`)
  invariant(text.includes('Error: unknown tool "mock_tool"'), 'Nested tool error body is missing')
  invariant(!text.includes('未渲染的必需事件类型'), 'Known runtime metadata is still reported as unsupported')
  invariant(await page.locator('.dsh-fork-diff__tag').count() === 1, 'Expected exactly one current-branch highlight')

  const changedRows = await page.locator('.dsh-fork-diff__row').count()
  invariant(changedRows >= 3, `Expected at least three changed rows, got ${changedRows}`)
  await page.screenshot({ path: desktopScreenshotPath })

  const parent = options.find(item => item.label.includes('父分支'))
  invariant(parent !== undefined, 'Parent candidate disappeared')
  await selectCandidate(page, parent.value)
  await page.getByRole('button', { name: '全部', exact: true }).click()
  const parentBody = 'PARENT_BASELINE_RESPONSE_SHARED_PLAN_USES_CACHE_AND_TWO_VALIDATION_STEPS.'
  const parentRows = page.locator('.dsh-fork-diff__row').filter({ hasText: parentBody })
  let parentBodyInComparedBranch = false
  for (let index = 0; index < await parentRows.count(); index++) {
    const cells = parentRows.nth(index).locator('.dsh-fork-diff__cell')
    if (await cells.count() === 2 && (await cells.nth(1).innerText()).includes(parentBody)) {
      parentBodyInComparedBranch = true
      break
    }
  }
  invariant(parentBodyInComparedBranch, 'Parent response is missing from the compared branch cell')
  await page.getByRole('button', { name: '仅差异', exact: true }).click()
  await page.screenshot({ path: selectorScreenshotPath })

  await selectCandidate(page, sibling.value)
  await page.getByRole('button', { name: '全部', exact: true }).click()
  invariant(await page.getByRole('button', { name: '全部', exact: true }).getAttribute('aria-pressed') === 'true', 'All filter did not activate')
  const allRows = await page.locator('.dsh-fork-diff__row').count()
  invariant(allRows > changedRows, `All filter did not reveal unchanged rows (${changedRows} -> ${allRows})`)
  invariant((await dialog.innerText()).includes('相同'), 'All filter has no unchanged row')
  await page.getByRole('button', { name: '仅差异', exact: true }).click()

  const closeButton = page.getByRole('button', { name: '关闭分支对比', exact: true })
  await closeButton.focus()
  await page.keyboard.press('Shift+Tab')
  invariant(await page.evaluate(() => document.activeElement?.textContent?.includes('打开会话') === true), 'Shift+Tab did not wrap focus to the last dialog control')
  await page.keyboard.press('Tab')
  invariant(await page.evaluate(() => document.activeElement?.getAttribute('aria-label') === '关闭分支对比'), 'Tab did not wrap focus to the first dialog control')
  await page.keyboard.press('Escape')
  await dialog.waitFor({ state: 'detached' })
  invariant(await trigger.evaluate(element => document.activeElement === element), 'Escape did not restore focus to the trigger')

  await page.setViewportSize(receipt.viewport.mobile)
  const reopened = await openDialog(page)
  await selectCandidate(page, sibling.value)
  const dialogBox = await reopened.dialog.boundingBox()
  invariant(dialogBox !== null, 'Mobile dialog has no bounding box')
  invariant(dialogBox.x >= -1 && dialogBox.y >= -1, 'Mobile dialog starts outside the viewport')
  invariant(dialogBox.x + dialogBox.width <= 391 && dialogBox.y + dialogBox.height <= 845, 'Mobile dialog exceeds the viewport')
  invariant(await page.locator('.dsh-fork-diff__branches').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length === 1), 'Mobile branch headers are not single-column')
  await assertNoHorizontalOverflow(page, '.dsh-fork-diff__dialog')
  await page.screenshot({ path: mobileScreenshotPath })

  await page.setViewportSize(receipt.viewport.desktop)
  const openButtons = page.getByRole('button', { name: '打开会话', exact: true })
  invariant(await openButtons.count() === 2, 'Expected one open-session command per branch')
  await openButtons.nth(1).click()
  await reopened.dialog.waitFor({ state: 'detached' })
  const navigated = await openDialog(page)
  const navigatedText = await navigated.dialog.innerText()
  invariant(navigatedText.includes('BRANCH_A_RESPONSE_CACHE_FIRST_PATH_WITH_TWO_CHECKS.'), 'Navigation lost Branch A history')
  invariant(navigatedText.includes('BRANCH_B_RESPONSE_TOOL_ASSISTED_PATH_WITH_RECOVERY.'), 'Navigation lost Branch B history')
  invariant(await page.locator('.dsh-fork-diff__tag').count() === 1, 'Navigation did not retain one current-branch highlight')
  await page.keyboard.press('Escape')

  await assertNoHorizontalOverflow(page, 'body')
  invariant(errors.console.length === 0, `Console errors: ${errors.console.join(' | ')}`)
  invariant(errors.page.length === 0, `Page errors: ${errors.page.join(' | ')}`)
  invariant(errors.request.length === 0, `Request failures: ${errors.request.join(' | ')}`)

  receipt.checks = {
    pluginAssetStatus,
    styleCount,
    candidateCount: options.length,
    siblingCandidate: sibling.label,
    parentCandidate: parent.label,
    parentBodyInComparedBranch,
    noForkTriggerHidden,
    metrics: metricTexts,
    changedRows,
    allRows,
    currentHighlights: 1,
    nestedToolError: true,
    knownRuntimeNoiseAbsent: true,
    focusTrap: true,
    escapeAndFocusRestore: true,
    openSessionNavigation: true,
    mobileSingleColumn: true,
  }

  receipt.screenshots = {
    desktop: {
      path: desktopScreenshotPath,
      width: receipt.viewport.desktop.width,
      height: receipt.viewport.desktop.height,
      sha256: sha256(readFileSync(desktopScreenshotPath)),
    },
    selector: {
      path: selectorScreenshotPath,
      width: receipt.viewport.desktop.width,
      height: receipt.viewport.desktop.height,
      sha256: sha256(readFileSync(selectorScreenshotPath)),
    },
    mobile: {
      path: mobileScreenshotPath,
      width: receipt.viewport.mobile.width,
      height: receipt.viewport.mobile.height,
      sha256: sha256(readFileSync(mobileScreenshotPath)),
    },
  }

  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8')
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`)
  await context.close()
} finally {
  await browser.close()
}
