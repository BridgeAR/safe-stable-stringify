'use strict'

const assert = require('node:assert/strict')

const { version } = require('./node_modules/safe-stable-stringify/package.json')
const root = globalThis

async function check () {
  let cjs
  let esm
  let otherVersion
  if (process.argv[2] !== 'import-first') {
    cjs = require('./first.cjs')
    otherVersion = require('./other-version')
    esm = await import('./first.mjs')
  } else {
    esm = await import('./first.mjs')
    otherVersion = require('./other-version')
    cjs = require('./first.cjs')
  }
  assert.notEqual(otherVersion, cjs)
  assert.equal(otherVersion({ b: 2, a: 1 }), '{"a":1,"b":2}')
  assert.equal(root[Symbol.for(`safe-stable-stringify@${version}`)], cjs)
  assert.equal(cjs, esm.default)
  assert.equal(cjs, esm.stringify)
  assert.equal(cjs.configure, esm.configure)
  assert.equal(cjs, cjs.default)
  assert.equal(cjs, cjs.stringify)
  assert.equal(cjs({ b: 2, a: 1 }), '{"a":1,"b":2}')
  const configured = esm.configure({ deterministic: false })
  assert.equal(configured.stringify, undefined)
  assert.equal(configured.default, undefined)
  assert.equal(configured.configure, undefined)
  assert.equal(configured({ b: 2, a: 1 }), '{"b":2,"a":1}')
  assert.equal(require('./second.cjs'), cjs)
  assert.equal(require('./same-version'), cjs)
  const modules = await Promise.all([
    import('./second.mjs'),
    import('./first.mjs'),
    import('./same-version/esm/wrapper.mjs')
  ])
  for (const module of modules) {
    assert.equal(module.default, cjs)
    assert.equal(module.configure, cjs.configure)
  }
}

/** @param {Error} error */
function onError (error) {
  console.error(error)
  process.exitCode = 1
}

check().catch(onError)
