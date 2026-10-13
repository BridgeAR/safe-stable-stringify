'use strict'

const assert = require('node:assert/strict')

const runBenchmarks = require('./benchmark-utils')
const testData = require('./test.json')

const stringifyPackages = {
  // 'JSON.stringify': JSON.stringify,
  'fastest-stable-stringify': true,
  'fast-json-stable-stringify': true,
  'json-stable-stringify': true,
  'fast-stable-stringify': true,
  'faster-stable-stringify': true,
  'json-stringify-deterministic': true,
  'fast-safe-stringify': 'stable',
  'safe-stable-stringify': require('.')
}

const cases = []
const expected = require('.')(testData)
for (const name of Object.keys(stringifyPackages)) {
  let fn
  if (typeof stringifyPackages[name] === 'function') {
    fn = stringifyPackages[name]
  } else if (typeof stringifyPackages[name] === 'string') {
    fn = require(name)[stringifyPackages[name]]
  } else {
    fn = require(name)
  }

  assert.equal(fn(testData), expected)
  cases.push([name, () => fn(testData)])
}

runBenchmarks(cases, 2)
