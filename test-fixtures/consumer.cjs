'use strict'

const stringify = require('safe-stable-stringify')

if (stringify !== stringify.default || stringify !== stringify.stringify) throw new Error('Export mismatch')
if (stringify({ b: 2, a: 1 }) !== '{"a":1,"b":2}') throw new Error('Incorrect output')
