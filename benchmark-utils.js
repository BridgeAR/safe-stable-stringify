'use strict'

const assert = require('node:assert/strict')
const { cpus } = require('node:os')

const { Suite } = require('bench-node')

module.exports = function runBenchmarks (cases, seconds = 2) {
  let length = 0
  const suite = new Suite({
    repeatSuite: 7,
    reporter (results) {
      console.log(`${cpus()[0].model}; Node ${process.version}; V8 ${process.versions.v8}`)
      for (const result of results) {
        const runs = result.opsSecPerRun
        const mean = runs.reduce((total, value) => total + value, 0) / runs.length
        const deviation = Math.sqrt(runs.reduce((total, value) => total + (value - mean) ** 2, 0) / (runs.length - 1))
        const sorted = [...runs].sort((left, right) => left - right).slice(1, -1)
        const rate = sorted.reduce((total, value) => total + value, 0) / sorted.length
        console.log(`${result.name.padEnd(34)} ${Math.round(rate).toLocaleString('en-US')} ops/sec (7 runs, CV ${(deviation / mean * 100).toFixed(2)}%)`)
        assert.ok(deviation / mean < 0.03, `${result.name}: excessive variance; rates: ${runs.map(Math.round).join(', ')}; rerun on a quiet host`)
      }
      console.log('Output checksum:', length)
    }
  })
  for (const [name, fn] of cases) {
    const expected = fn()
    assert.equal(typeof expected, 'string')
    for (let iteration = 0; iteration < 50000; iteration++) length ^= fn().length
    assert.equal(fn(), expected)
    suite.add(name, { minTime: 0.05, maxTime: seconds }, () => { length ^= fn().length })
  }
  return suite.run()
}
