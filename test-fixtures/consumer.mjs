import stringify, { configure, stringify as named } from 'safe-stable-stringify'

if (stringify !== named || configure !== stringify.configure) throw new Error('Export mismatch')
if (stringify({ b: 2, a: 1 }) !== '{"a":1,"b":2}') throw new Error('Incorrect output')
if (configure({ deterministic: false })({ b: 2, a: 1 }) !== '{"b":2,"a":1}') throw new Error('Incorrect configuration')
