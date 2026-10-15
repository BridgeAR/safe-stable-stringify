'use strict'

const runBenchmarks = require('./benchmark-utils')
const stringify = require('.').configure({ deterministic: true })

const array = Array.from({ length: 10 }, (_, i) => i)
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

const cases = []
const replacer = (_, value) => value
for (const [mode, args] of [
  ['simple', []],
  ['replacer', [replacer]],
  ['array', [['array']]],
  ['full replacer', [replacer, 2]],
  ['full array', [['array'], 2]],
  ['indentation', [null, 2]]
]) {
  for (const [name, value] of [['simple object', obj], ['circular', circ], ['deep', deep], ['deep circular', deepCirc]]) {
    cases.push([`${mode}: ${name}`, () => stringify(value, ...args)])
  }
}

runBenchmarks(cases)
