'use strict'

const { execFile } = require('node:child_process')
const { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')
const { promisify } = require('node:util')

const { build } = require('esbuild')
const { rollup } = require('rollup')
const { test } = require('tap')

const execFileAsync = promisify(execFile)
const { version } = require('./package.json')

/**
 * @param {string} directory
 * @param {string} packageVersion
 */
function writePackage (directory, packageVersion) {
  const files = {
    '': ['package.json', 'index.js', 'index.d.ts', 'wrapper.cjs'],
    esm: readdirSync(join(__dirname, 'esm'))
  }
  for (const [subdirectory, names] of Object.entries(files)) {
    mkdirSync(join(directory, subdirectory), { recursive: true })
    for (const name of names) {
      let source = readFileSync(join(__dirname, subdirectory, name), 'utf8')
      if (name === 'package.json') {
        const metadata = JSON.parse(source)
        metadata.version = packageVersion
        source = JSON.stringify(metadata)
      } else {
        source = source.replaceAll(`safe-stable-stringify@${version}`, `safe-stable-stringify@${packageVersion}`)
      }
      writeFileSync(join(directory, subdirectory, name), source)
    }
  }
}

/** @param {import('tap').Test} assert */
function createPackageFixture (assert) {
  const directory = mkdtempSync(join(tmpdir(), 'safe-stable-stringify-modules-'))
  const packageDirectory = join(directory, 'node_modules', 'safe-stable-stringify')
  assert.teardown(() => rmSync(directory, { recursive: true, force: true }))
  writePackage(packageDirectory, version)
  for (const name of readdirSync(join(__dirname, 'test-fixtures'))) {
    writeFileSync(join(directory, name), readFileSync(join(__dirname, 'test-fixtures', name)))
  }
  return directory
}

/** @param {import('tap').Test} assert */
async function testModuleEntryPoints (assert) {
  const directory = createPackageFixture(assert)
  writePackage(join(directory, 'same-version'), version)
  writePackage(join(directory, 'other-version'), '0.0.0-test')
  for (const name of ['first', 'second']) {
    writeFileSync(join(directory, `${name}.cjs`), "module.exports = require('safe-stable-stringify')\n")
    writeFileSync(join(directory, `${name}.mjs`), "export { default, configure, stringify } from 'safe-stable-stringify'\n")
  }

  const results = await Promise.all([
    execFileAsync(process.execPath, ['modules.cjs', 'require-first'], { cwd: directory }),
    execFileAsync(process.execPath, ['modules.cjs', 'import-first'], { cwd: directory })
  ])
  for (const { stdout, stderr } of results) {
    assert.equal(stdout, '', 'no output')
    assert.equal(stderr, '', 'no errors')
  }
}

test('module entry points share exports across consumers and load orders', testModuleEntryPoints)

/** @param {import('tap').Test} assert */
function testReload (assert) {
  const stringify = require('./wrapper.cjs')
  delete require.cache[require.resolve('./wrapper.cjs')]
  delete require.cache[require.resolve('./index.js')]
  const reloaded = require('./wrapper.cjs')
  assert.equal(reloaded, stringify, 're-evaluation preserves the export')
  assert.equal(reloaded({ b: 2, a: 1 }), '{"a":1,"b":2}')
  assert.end()
}

test('module re-evaluation reuses the retained export', testReload)

/** @param {import('tap').Test} assert */
async function testBundlers (assert) {
  const directory = createPackageFixture(assert)
  await Promise.all([
    build({
      entryPoints: [join(directory, 'consumer.mjs')],
      bundle: true,
      platform: 'browser',
      format: 'esm',
      minify: true,
      outfile: join(directory, 'esbuild.mjs')
    }),
    build({
      entryPoints: [join(directory, 'consumer.cjs')],
      bundle: true,
      platform: 'browser',
      format: 'cjs',
      minify: true,
      outfile: join(directory, 'esbuild.cjs')
    })
  ])
  const rollupEntry = join(directory, 'node_modules', 'safe-stable-stringify', 'esm', 'wrapper.mjs')
  const bundle = await rollup({ input: rollupEntry })
  try {
    await bundle.write({ file: join(directory, 'rollup.mjs'), format: 'esm' })
  } finally {
    await bundle.close()
  }
  const esmSource = readFileSync(join(directory, 'consumer.mjs'), 'utf8')
  writeFileSync(join(directory, 'rollup-consumer.mjs'), esmSource.replace('safe-stable-stringify', './rollup.mjs'))
  const results = await Promise.all([
    execFileAsync(process.execPath, [join(directory, 'esbuild.mjs')]),
    execFileAsync(process.execPath, [join(directory, 'esbuild.cjs')]),
    execFileAsync(process.execPath, [join(directory, 'rollup-consumer.mjs')])
  ])
  for (const { stdout, stderr } of results) {
    assert.equal(stdout, '', 'bundle produces no output')
    assert.equal(stderr, '', 'bundle produces no errors')
  }
}

test('bundlers preserve the side effect and exports', testBundlers)

/** @param {import('tap').Test} assert */
async function testTypes (assert) {
  const directory = createPackageFixture(assert)
  const tasks = []
  for (const [module, resolution, ...files] of [
    ['NodeNext', 'NodeNext', 'types.cts', 'types.mts'],
    ['CommonJS', 'Node', 'types.cts', 'types.mts'],
    ['ESNext', 'Bundler', 'types.mts']
  ]) {
    tasks.push(execFileAsync(process.execPath, [
      require.resolve('typescript/bin/tsc'),
      '--noEmit',
      '--strict',
      '--module', module,
      '--moduleResolution', resolution,
      '--target', 'ES2020',
      ...files
    ], { cwd: directory }))
  }
  const results = await Promise.all(tasks)
  for (const { stdout, stderr } of results) {
    assert.equal(stdout, '', 'both module formats compile without errors')
    assert.equal(stderr, '', 'compiler produces no errors')
  }
}

test('TypeScript resolves both module formats', testTypes)
