'use strict'

const Benchmark = require('benchmark')
const suite = new Benchmark.Suite()
const stringify = require('.')

const array = new Array(10).fill(0).map((_, i) => i)
const obj = { array }
const circ = JSON.parse(JSON.stringify(obj))
circ.o = { obj: circ, array }

const deep = require('./package.json')
deep.deep = JSON.parse(JSON.stringify(deep))
deep.deep.deep = JSON.parse(JSON.stringify(deep))
deep.deep.deep.deep = JSON.parse(JSON.stringify(deep))
deep.array = array

const deepCirc = JSON.parse(JSON.stringify(deep))
deepCirc.deep.deep.deep.circ = deepCirc
deepCirc.deep.deep.circ = deepCirc
deepCirc.deep.circ = deepCirc
deepCirc.array = array

// One arg "simple"
suite.add('simple:   simple object', function () {
  stringify(obj)
})
suite.add('simple:   circular     ', function () {
  stringify(circ)
})
suite.add('simple:   deep         ', function () {
  stringify(deep)
})
suite.add('simple:   deep circular', function () {
  stringify(deepCirc)
})

// Two args "replacer"
suite.add('\nreplacer:   simple object', function () {
  stringify(obj, (_, v) => v)
})
suite.add('replacer:   circular     ', function () {
  stringify(circ, (_, v) => v)
})
suite.add('replacer:   deep         ', function () {
  stringify(deep, (_, v) => v)
})
suite.add('replacer:   deep circular', function () {
  stringify(deepCirc, (_, v) => v)
})

// Two args "array"
suite.add('\narray:   simple object', function () {
  stringify(obj, ['array'])
})
suite.add('array:   circular     ', function () {
  stringify(circ, ['array'])
})
suite.add('array:   deep         ', function () {
  stringify(deep, ['array'])
})
suite.add('array:   deep circular', function () {
  stringify(deepCirc, ['array'])
})

// Three args "full replacer"
suite.add('\nfull replacer:   simple object', function () {
  stringify(obj, (_, v) => v, 2)
})
suite.add('full replacer:   circular     ', function () {
  stringify(circ, (_, v) => v, 2)
})
suite.add('full replacer:   deep         ', function () {
  stringify(deep, (_, v) => v, 2)
})
suite.add('full replacer:   deep circular', function () {
  stringify(deepCirc, (_, v) => v, 2)
})

// Three args "full array"
suite.add('\nfull array:   simple object', function () {
  stringify(obj, ['array'], 2)
})
suite.add('full array:   circular     ', function () {
  stringify(circ, ['array'], 2)
})
suite.add('full array:   deep         ', function () {
  stringify(deep, ['array'], 2)
})
suite.add('full array:   deep circular', function () {
  stringify(deepCirc, ['array'], 2)
})

// Three args "indentation only"
suite.add('\nindentation:   simple object', function () {
  stringify(obj, null, 2)
})
suite.add('indentation:   circular     ', function () {
  stringify(circ, null, 2)
})
suite.add('indentation:   deep         ', function () {
  stringify(deep, null, 2)
})
suite.add('indentation:   deep circular', function () {
  stringify(deepCirc, null, 2)
})

// add listeners
suite.on('cycle', function (event) {
  console.log(String(event.target))
})

suite.on('complete', function () {
  console.log('\nBenchmark done')
  // console.log('\nFastest is ' + this.filter('fastest').map('name'))
})

suite.run({ delay: 1, minSamples: 150 })
