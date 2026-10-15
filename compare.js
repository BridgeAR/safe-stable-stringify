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

for (const name of Object.keys(stringifyPackages)) {
  if (typeof stringifyPackages[name] === 'string') {
    stringifyPackages[name] = require(name)[stringifyPackages[name]]
  } else if (stringifyPackages[name] === true) {
    stringifyPackages[name] = require(name)
  }
}

const telemetry = {
  device: { id: 'weather-station-17', firmware: '3.2.1', online: true },
  recordedAt: new Date('2026-01-15T12:30:00.000Z'),
  payload: Uint8Array.from({ length: 128 }, (_, index) => (index * 17) % 256),
  histogram: Uint32Array.from({ length: 32 }, (_, index) => index * index * 13),
  temperatures: Float32Array.from({ length: 24 }, (_, index) => 18 + index / 8),
  pressure: new Float64Array([1013.25, 1013.5, NaN, 1013.75]),
  signature: Buffer.from('e7c93f142ae4907e8fae3cb589e0f87a', 'hex'),
  location: { latitude: 52.52, longitude: 13.405 },
  alarms: [false, true, false]
}
const counters = {
  ...telemetry,
  sequence: 18446744073709551001n,
  timestampNs: 1768480200000000000n,
  totals: new BigUint64Array([9007199254740993n, 18446744073709551001n]),
  deltas: new BigInt64Array([-9007199254740993n, 33n, 0n])
}
const bigintReplacer = (_, value) => typeof value === 'bigint' ? String(value) : value
const bigintOptions = { replacer: bigintReplacer }
const deterministicOptions = { replacer: bigintReplacer, cycles: true }
const bigintPackages = {
  'json-stable-stringify': value => stringifyPackages['json-stable-stringify'](value, bigintOptions),
  'json-stringify-deterministic': value => stringifyPackages['json-stringify-deterministic'](value, deterministicOptions),
  'fast-safe-stringify': value => stringifyPackages['fast-safe-stringify'](value, bigintReplacer),
  'safe-stable-stringify': require('.').configure({ bigint: 'string' })
}

async function compare (title, value, implementations) {
  console.log(title)
  const expected = JSON.parse(JSON.stringify(value, bigintReplacer))
  const cases = []
  for (const name of Object.keys(stringifyPackages)) {
    const fn = implementations[name]
    if (fn === undefined) {
      let output
      try {
        output = stringifyPackages[name](value)
      } catch (error) {
        assert.ok(error instanceof TypeError)
      }
      if (output !== undefined) assert.notDeepEqual(JSON.parse(output), expected)
      console.log(`${name}: BigInt is not supported`)
      continue
    }
    const output = fn(value)
    assert.deepEqual(JSON.parse(output), expected)
    if (value === testData) assert.equal(output, require('.')(value))
    cases.push([name, () => fn(value)])
  }
  await runBenchmarks(cases, 2)
}

async function main () {
  await compare('JSON-compatible object', testData, stringifyPackages)
  await compare('Typed arrays, Date and Buffer', telemetry, stringifyPackages)
  await compare('Typed arrays, Date, Buffer and BigInt (decimal strings)', counters, bigintPackages)
}

main()
