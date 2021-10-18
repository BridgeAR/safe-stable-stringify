# safe-stable-stringify

Safe, deterministic and fast serialization alternative to [JSON.stringify][]. Zero dependencies. ESM and CJS. 100% coverage.

Gracefully handles circular structures and bigint instead of throwing.

Optional custom circular values and deterministic behavior.

## stringify(value[, replacer[, space]])

The same as [JSON.stringify][].

* `value` {any}
* `replacer` {string[]|function|null}
* `space` {number|string}
* Returns: {string}

```js
const stringify = require('safe-stable-stringify')

const bigint = { a: 0, c: 2n, b: 1 }

stringify(bigint)
// '{"a":0,"b":1,"c":2}'
JSON.stringify(bigint)
// TypeError: Do not know how to serialize a BigInt

const circular = { b: 1, a: 0 }
circular.circular = circular

stringify(circular)
// '{"a":0,"b":1,"circular":"[Circular]"}'
JSON.stringify(circular)
// TypeError: Converting circular structure to JSON

stringify(circular, ['a', 'b'], 2)
// {
//   "a": 0,
//   "b": 1
// }
```

## stringify.configure(options)

* `bigint` {boolean} If `true`, bigint values are converted to a number. Otherwise
  they are ignored. **Default:** `true`.
* `circularValue` {string|null} Define the value for circular references. **Default:** `[Circular]`.
* `deterministic` {boolean} If `true`, guarantee a deterministic key order
  instead of relying on the insertion order. **Default:** `true`.
* `maximumBreadth` {number} Maximum number of entries to serialize per object
  (at least one). The serialized output contains information about how many
  entries have not been serialized. Ignored properties are counted as well
  (e.g., properties with symbol values). Using the array replacer overrules this
  option. **Default:** `Infinity`
* `maximumDepth` {number} Maximum number of object nesting levels (at least 1)
  that will be serialized. Objects at the maximum level are serialized as
  `'[Object]'` and arrays as `'[Array]'`. **Default:** `Infinity`
* Returns: {function} A stringify function with the options applied.

```js
import { configure } from 'safe-stable-stringify'

const stringify = configure({
  bigint: true,
  circularValue: 'Magic circle!',
  deterministic: false,
  maximumDepth: 1,
  maximumBreadth: 4
})

const circular = {
  bigint: 999_999_999_999_999_999n,
  typed: new Uint8Array(3),
  deterministic: "I don't think so",
}
circular.circular = circular
circular.ignored = true
circular.alsoIgnored = 'Yes!'

const stringified = stringify(circular, null, 4)

console.log(stringified)
// {
//     "bigint": 999999999999999999,
//     "typed": "[Object]",
//     "deterministic": "I don't think so",
//     "circular": "Magic circle!",
//     "...": "2 items not stringified"
// }
```

## Differences to JSON.stringify

1. Replace circular structures with the string `[Circular]` (the value may be changed).
1. Sorted keys instead of using the insertion order (it is possible to deactivate this).
1. BigInt values are stringified as regular number instead of throwing a TypeError.

Those are the only differences to the real JSON.stringify. This is a side effect
free variant and [`toJSON`][], [`replacer`][] and the [`spacer`][] work the same
as with the native JSON.stringify.

## Performance / Benchmarks

Currently this is by far the fastest known stable stringify implementation.
This is especially important for big objects and TypedArrays.

(Lenovo T450s with a i7-5600U CPU using Node.js 8.9.4)

```md
simple:   simple object x 1,733,045 ops/sec ±1.82% (86 runs sampled)
simple:   circular      x 717,021 ops/sec ±0.78% (91 runs sampled)
simple:   deep          x 17,674 ops/sec ±0.77% (94 runs sampled)
simple:   deep circular x 17,396 ops/sec ±0.70% (93 runs sampled)

replacer:   simple object x 1,126,942 ops/sec ±2.22% (91 runs sampled)
replacer:   circular      x 541,243 ops/sec ±0.87% (94 runs sampled)
replacer:   deep          x 17,229 ops/sec ±0.90% (94 runs sampled)
replacer:   deep circular x 16,948 ops/sec ±0.86% (97 runs sampled)

array:   simple object x 1,470,751 ops/sec ±0.84% (95 runs sampled)
array:   circular      x 1,360,269 ops/sec ±2.94% (91 runs sampled)
array:   deep          x 1,289,785 ops/sec ±2.82% (87 runs sampled)
array:   deep circular x 1,400,577 ops/sec ±1.00% (92 runs sampled)
```

Comparing `safe-stable-stringify` with known alternatives:

```md
fast-json-stable-stringify x 9,336 ops/sec ±0.64% (90 runs sampled)
json-stable-stringify x 7,512 ops/sec ±0.63% (91 runs sampled)
fast-stable-stringify x 11,674 ops/sec ±0.58% (92 runs sampled)
faster-stable-stringify x 8,893 ops/sec ±0.51% (92 runs sampled)
json-stringify-deterministic x 6,240 ops/sec ±0.68% (94 runs sampled)
fast-safe-stringify x 15,939 ops/sec ±0.42% (96 runs sampled)
this x 24,048 ops/sec ±0.44% (91 runs sampled)

The fastest is this
```

The `fast-safe-stringify` comparison uses the modules stable implementation.

## Acknowledgements

Sponsored by [MaibornWolff](https://www.maibornwolff.de/) and [nearForm](http://nearform.com)

## License

MIT

[`replacer`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The%20replacer%20parameter
[`spacer`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The%20space%20argument
[`toJSON`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON()_behavior
[JSON.stringify]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
