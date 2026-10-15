# safe-stable-stringify

Safe, deterministic and fast serialization alternative to [JSON.stringify][].
Zero dependencies. ESM and CJS. 100% coverage.

Gracefully handles circular structures and bigint instead of throwing.

Optional custom circular values, deterministic behavior or strict JSON
compatibility check.

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
// '{"a":0,"b":1,"circular":"[Circular: 0]"}'
JSON.stringify(circular)
// TypeError: Converting circular structure to JSON

stringify(circular, ['a', 'b'], 2)
// {
//   "a": 0,
//   "b": 1
// }
```

## stringify.configure(options)

* `bigint` {boolean|string} If `true`, bigint values are converted to a
  number. If set to `'string'`, bigint values are serialized as JSON strings.
  Otherwise they are ignored. **Default:** `true`.
* `circularValue` {string|null|undefined|ErrorConstructor} Defines the value for
  circular references. String values are wrapped in double quotes without JSON
  escaping. Escape JSON special characters in the value to keep the output valid
  JSON. Set to `undefined`, circular properties are not
  serialized (array entries are replaced with `null`). Set to `Error`, to throw
  on circular references. **Default:** `'[Circular: N]'`, where `N` is the
  referenced ancestor's depth, starting at 0 for the root. Set to `'[Circular]'`
  to retain the previous default format.
* `deterministic` {boolean|function} If `true` or a `Array#sort(comparator)`
  comparator method, guarantee a deterministic key order instead of relying on
  the insertion order. **Default:** `true`.
* `maximumBreadth` {number} Maximum number of entries to serialize per object
  (at least one). The serialized output contains information about how many
  entries have not been serialized. Ignored properties are counted as well
  (e.g., properties with symbol values). Using the array replacer overrules this
  option. **Default:** `Infinity`
* `maximumDepth` {number} Maximum number of object nesting levels (at least 1)
  that will be serialized. Objects at the maximum level are serialized as
  `'[Object]'` and arrays as `'[Array]'`. **Default:** `Infinity`
* `strict` {boolean} Instead of handling any JSON value gracefully, throw an
  error in case it may not be represented as JSON (functions, NaN, ...).
  Circular values and bigint values throw as well in case either option is not
  explicitly defined. Sets and Maps are not detected as well as Symbol keys!
  **Default:** `false`
* `safe` {boolean} If `true`, calls to .toJSON(), getters, and replacers that
  throw will return the error message in place of the object instead of
  throwing. **Default:** `false`
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

const throwOnCircular = configure({
  circularValue: Error
})

throwOnCircular(circular);
// TypeError: Converting circular structure to JSON
```

## Differences to JSON.stringify

1. _Circular values_ identify the referenced ancestor's depth as `[Circular: N]`
   (configurable), starting at 0 for the root.
1. _Object keys_ are sorted instead of using the insertion order (configurable).
1. _BigInt_ values are stringified as regular number instead of throwing a
   TypeError (configurable).
1. _Boxed primitives_ (e.g., `Number(5)`) are not unboxed and are handled as
   regular object.

Those are the only differences to `JSON.stringify()`. This is a side effect free
variant and [`toJSON`][], [`replacer`][] and the [`spacer`][] work the same as
with `JSON.stringify()`.

## Performance / Benchmarks

(Apple M4 Max, macOS 26.6.2, Node.js 26.3.1, V8 14.6.202.34-node.20)

```text
Apple M4 Max; Node v26.3.1; V8 14.6.202.34-node.20
simple: simple object              4,280,054 ops/sec (7 runs, CV 1.21%)
simple: circular                   1,867,764 ops/sec (7 runs, CV 0.90%)
simple: deep                       31,783 ops/sec (7 runs, CV 1.85%)
simple: deep circular              31,095 ops/sec (7 runs, CV 1.07%)
replacer: simple object            2,847,302 ops/sec (7 runs, CV 1.13%)
replacer: circular                 1,264,209 ops/sec (7 runs, CV 0.47%)
replacer: deep                     29,244 ops/sec (7 runs, CV 0.77%)
replacer: deep circular            28,500 ops/sec (7 runs, CV 0.76%)
array: simple object               4,433,315 ops/sec (7 runs, CV 1.20%)
array: circular                    4,400,683 ops/sec (7 runs, CV 0.82%)
array: deep                        4,410,383 ops/sec (7 runs, CV 0.50%)
array: deep circular               4,435,182 ops/sec (7 runs, CV 0.52%)
full replacer: simple object       2,675,568 ops/sec (7 runs, CV 0.81%)
full replacer: circular            1,226,915 ops/sec (7 runs, CV 0.75%)
full replacer: deep                27,826 ops/sec (7 runs, CV 0.99%)
full replacer: deep circular       27,239 ops/sec (7 runs, CV 1.96%)
full array: simple object          3,781,217 ops/sec (7 runs, CV 0.95%)
full array: circular               3,771,576 ops/sec (7 runs, CV 1.36%)
full array: deep                   3,781,851 ops/sec (7 runs, CV 1.60%)
full array: deep circular          3,835,795 ops/sec (7 runs, CV 0.93%)
indentation: simple object         3,971,352 ops/sec (7 runs, CV 1.33%)
indentation: circular              1,810,550 ops/sec (7 runs, CV 1.06%)
indentation: deep                  31,776 ops/sec (7 runs, CV 1.20%)
indentation: deep circular         31,396 ops/sec (7 runs, CV 1.41%)
```

Comparing `safe-stable-stringify` with known alternatives:

```text
Apple M4 Max; Node v26.3.1; V8 14.6.202.34-node.20
fastest-stable-stringify           73,060 ops/sec (7 runs, CV 0.30%)
fast-json-stable-stringify         66,953 ops/sec (7 runs, CV 0.87%)
json-stable-stringify              50,656 ops/sec (7 runs, CV 0.48%)
fast-stable-stringify              72,668 ops/sec (7 runs, CV 0.94%)
faster-stable-stringify            64,879 ops/sec (7 runs, CV 0.80%)
json-stringify-deterministic       45,529 ops/sec (7 runs, CV 0.72%)
fast-safe-stringify                59,107 ops/sec (7 runs, CV 0.55%)
safe-stable-stringify              75,892 ops/sec (7 runs, CV 0.48%)
```

The `fast-safe-stringify` comparison uses its stable implementation.

### Typed arrays

Serializing a telemetry record with binary sensor data, a Date, and a Buffer:

```text
Apple M4 Max; Node v26.3.1; V8 14.6.202.34-node.20
fastest-stable-stringify           69,502 ops/sec (7 runs, CV 0.73%)
fast-json-stable-stringify         63,260 ops/sec (7 runs, CV 0.31%)
json-stable-stringify              46,499 ops/sec (7 runs, CV 0.75%)
fast-stable-stringify              116,091 ops/sec (7 runs, CV 0.68%)
faster-stable-stringify            62,078 ops/sec (7 runs, CV 0.65%)
json-stringify-deterministic       33,567 ops/sec (7 runs, CV 0.57%)
fast-safe-stringify                56,618 ops/sec (7 runs, CV 0.57%)
safe-stable-stringify              126,114 ops/sec (7 runs, CV 0.48%)
```

### Typed arrays and BigInt

The same record with 64-bit counters. BigInt values serialize as decimal strings
through each library's public options.

```text
fastest-stable-stringify: BigInt is not supported
fast-json-stable-stringify: BigInt is not supported
fast-stable-stringify: BigInt is not supported
faster-stable-stringify: BigInt is not supported
Apple M4 Max; Node v26.3.1; V8 14.6.202.34-node.20
json-stable-stringify              39,849 ops/sec (7 runs, CV 1.23%)
json-stringify-deterministic       43,579 ops/sec (7 runs, CV 0.46%)
fast-safe-stringify                42,583 ops/sec (7 runs, CV 0.85%)
safe-stable-stringify              113,681 ops/sec (7 runs, CV 0.87%)
```

## Acknowledgements

Sponsored by [MaibornWolff](https://www.maibornwolff.de/) and [nearForm](http://nearform.com)

## License

MIT

[`replacer`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The%20replacer%20parameter
[`spacer`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The%20space%20argument
[`toJSON`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON()_behavior
[JSON.stringify]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
