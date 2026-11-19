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

(Apple M4 Max; Node v26.13.1; V8 14.6.202.34-node.40)

```text
simple: simple object              4,599,135 ops/sec (7 runs, CV 0.89%)
simple: circular                   2,014,569 ops/sec (7 runs, CV 0.58%)
simple: deep                       34,131 ops/sec (7 runs, CV 1.25%)
simple: deep circular              33,217 ops/sec (7 runs, CV 0.80%)
replacer: simple object            2,982,280 ops/sec (7 runs, CV 0.64%)
replacer: circular                 1,358,950 ops/sec (7 runs, CV 0.62%)
replacer: deep                     30,759 ops/sec (7 runs, CV 1.47%)
replacer: deep circular            30,460 ops/sec (7 runs, CV 1.14%)
array: simple object               4,589,943 ops/sec (7 runs, CV 0.57%)
array: circular                    4,545,994 ops/sec (7 runs, CV 1.30%)
array: deep                        4,539,061 ops/sec (7 runs, CV 1.26%)
array: deep circular               4,582,763 ops/sec (7 runs, CV 0.72%)
full replacer: simple object       2,765,086 ops/sec (7 runs, CV 0.68%)
full replacer: circular            1,290,254 ops/sec (7 runs, CV 0.57%)
full replacer: deep                30,397 ops/sec (7 runs, CV 0.58%)
full replacer: deep circular       29,887 ops/sec (7 runs, CV 0.89%)
full array: simple object          3,944,454 ops/sec (7 runs, CV 1.26%)
full array: circular               3,937,732 ops/sec (7 runs, CV 0.73%)
full array: deep                   3,956,280 ops/sec (7 runs, CV 0.54%)
full array: deep circular          3,952,899 ops/sec (7 runs, CV 0.62%)
indentation: simple object         4,243,745 ops/sec (7 runs, CV 0.53%)
indentation: circular              1,911,019 ops/sec (7 runs, CV 0.62%)
indentation: deep                  33,746 ops/sec (7 runs, CV 1.25%)
indentation: deep circular         33,145 ops/sec (7 runs, CV 1.01%)
```

Comparing `safe-stable-stringify` with known alternatives:

```text
fastest-stable-stringify           74,006 ops/sec (7 runs, CV 1.00%)
fast-json-stable-stringify         66,591 ops/sec (7 runs, CV 0.47%)
json-stable-stringify              50,832 ops/sec (7 runs, CV 0.65%)
fast-stable-stringify              71,859 ops/sec (7 runs, CV 1.22%)
faster-stable-stringify            63,885 ops/sec (7 runs, CV 1.00%)
json-stringify-deterministic       44,902 ops/sec (7 runs, CV 0.99%)
fast-safe-stringify                58,271 ops/sec (7 runs, CV 0.68%)
safe-stable-stringify              78,131 ops/sec (7 runs, CV 2.01%)
```

The `fast-safe-stringify` comparison uses its stable implementation.

### Typed arrays

Serializing a telemetry record with binary sensor data, a Date, and a Buffer:

```text
fastest-stable-stringify           67,370 ops/sec (7 runs, CV 0.84%)
fast-json-stable-stringify         62,801 ops/sec (7 runs, CV 0.80%)
json-stable-stringify              46,316 ops/sec (7 runs, CV 1.16%)
fast-stable-stringify              116,191 ops/sec (7 runs, CV 0.33%)
faster-stable-stringify            62,259 ops/sec (7 runs, CV 0.43%)
json-stringify-deterministic       33,639 ops/sec (7 runs, CV 0.37%)
fast-safe-stringify                57,117 ops/sec (7 runs, CV 0.63%)
safe-stable-stringify              127,638 ops/sec (7 runs, CV 0.44%)
```

### Typed arrays and BigInt

The same record with 64-bit counters. BigInt values serialize as decimal strings
through each library's public options.

```text
fastest-stable-stringify: BigInt is not supported
fast-json-stable-stringify: BigInt is not supported
fast-stable-stringify: BigInt is not supported
faster-stable-stringify: BigInt is not supported
Apple M4 Max; Node v26.13.1; V8 14.6.202.34-node.40
json-stable-stringify              39,740 ops/sec (7 runs, CV 0.78%)
json-stringify-deterministic       43,808 ops/sec (7 runs, CV 0.39%)
fast-safe-stringify                42,805 ops/sec (7 runs, CV 0.52%)
safe-stable-stringify              114,074 ops/sec (7 runs, CV 0.44%)
```

## Acknowledgements

Sponsored by [MaibornWolff](https://www.maibornwolff.de/) and [nearForm](http://nearform.com)

## License

MIT

[`replacer`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The%20replacer%20parameter
[`spacer`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The%20space%20argument
[`toJSON`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON()_behavior
[JSON.stringify]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
