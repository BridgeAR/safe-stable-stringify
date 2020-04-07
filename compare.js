'use strict'

const Benchmark = require('benchmark')
const suite = new Benchmark.Suite()
const testData = require('./test.json')

const stringifyPackages = {
  // 'JSON.stringify': JSON.stringify,
  'fast-json-stable-stringify': true,
  'json-stable-stringify': true,
  'fast-stable-stringify': true,
  'faster-stable-stringify': true,
  'json-stringify-deterministic': true,
  'fast-safe-stringify': 'stable',
  this: require('.')
}

for (const name in stringifyPackages) {
  let fn
  if (typeof stringifyPackages[name] === 'function') {
    fn = stringifyPackages[name]
  } else if (typeof stringifyPackages[name] === 'string') {
    fn = require(name)[stringifyPackages[name]]
  } else {
    fn = require(name)
  }

  suite.add(name, function () {
    fn(testData)
  })
}

suite
  .on('cycle', (event) => console.log(String(event.target)))
  .on('complete', function () {
    console.log('\nThe fastest is ' + this.filter('fastest').map('name'))
  })
  .run({ async: true, delay: 5, minSamples: 150 })
