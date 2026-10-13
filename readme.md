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
1. _Array replacers_ use the array iterator and accept only primitive strings
   and numbers. Boxed entries are ignored.

Array replacer entries are processed for every input, including primitive roots.
Getters and iterator errors still propagate. Object [`toJSON`][] methods,
function [`replacer`][] callbacks, and the [`spacer`][] are supported.

## Performance / Benchmarks

Measured on an Apple M4 Max with macOS 26.6.2, Node.js 26.3.1
(V8 14.6.202.34-node.20), and bench-node 0.15.0.

Each case has 50,000 warmup calls and seven two-second trials. Results use the
mean of the middle five trials. The coefficient of variation (CV) uses all seven
trials. Runs with a CV of 3% or more fail. Every call consumes the output length.
The local measurements use foreground scheduling with `taskpolicy -a -t 0 -l 0`.

Results from `npm run benchmark`:

```text
Apple M4 Max; Node v26.3.1; V8 14.6.202.34-node.20
simple: simple object              4,426,655 ops/sec (7 runs, CV 1.52%)
simple: circular                   1,922,646 ops/sec (7 runs, CV 0.89%)
simple: deep                       32,526 ops/sec (7 runs, CV 1.04%)
simple: deep circular              32,078 ops/sec (7 runs, CV 1.11%)
replacer: simple object            2,916,534 ops/sec (7 runs, CV 2.19%)
replacer: circular                 1,318,356 ops/sec (7 runs, CV 0.59%)
replacer: deep                     29,330 ops/sec (7 runs, CV 0.94%)
replacer: deep circular            28,905 ops/sec (7 runs, CV 1.22%)
array: simple object               4,546,824 ops/sec (7 runs, CV 0.61%)
array: circular                    4,527,065 ops/sec (7 runs, CV 0.59%)
array: deep                        4,515,301 ops/sec (7 runs, CV 0.63%)
array: deep circular               4,531,107 ops/sec (7 runs, CV 0.24%)
full replacer: simple object       2,716,387 ops/sec (7 runs, CV 0.51%)
full replacer: circular            1,248,523 ops/sec (7 runs, CV 0.42%)
full replacer: deep                28,407 ops/sec (7 runs, CV 1.30%)
full replacer: deep circular       28,199 ops/sec (7 runs, CV 1.58%)
full array: simple object          3,929,918 ops/sec (7 runs, CV 0.88%)
full array: circular               3,925,238 ops/sec (7 runs, CV 1.10%)
full array: deep                   3,922,968 ops/sec (7 runs, CV 1.03%)
full array: deep circular          3,938,466 ops/sec (7 runs, CV 0.47%)
indentation: simple object         4,141,014 ops/sec (7 runs, CV 0.60%)
indentation: circular              1,832,771 ops/sec (7 runs, CV 0.78%)
indentation: deep                  32,191 ops/sec (7 runs, CV 1.42%)
indentation: deep circular         32,207 ops/sec (7 runs, CV 1.97%)
Output checksum: 28135
```

Results from `npm run compare`:

The `fast-safe-stringify` comparison uses its stable implementation.

```text
Apple M4 Max; Node v26.3.1; V8 14.6.202.34-node.20
fastest-stable-stringify           74,695 ops/sec (7 runs, CV 0.71%)
fast-json-stable-stringify         67,631 ops/sec (7 runs, CV 0.85%)
json-stable-stringify              51,077 ops/sec (7 runs, CV 0.54%)
fast-stable-stringify              73,214 ops/sec (7 runs, CV 0.52%)
faster-stable-stringify            64,848 ops/sec (7 runs, CV 1.16%)
json-stringify-deterministic       45,526 ops/sec (7 runs, CV 0.93%)
fast-safe-stringify                57,828 ops/sec (7 runs, CV 0.58%)
safe-stable-stringify              76,684 ops/sec (7 runs, CV 0.45%)
Output checksum: 5423
```

The following comparison uses main (`c05878f`) and this implementation with the
same dependencies, fixtures, and benchmark harness:

| Implementation | Before, ops/sec | After, ops/sec |
| --- | ---: | ---: |
| fastest-stable-stringify | 73,969 | 74,695 |
| fast-json-stable-stringify | 67,489 | 67,631 |
| json-stable-stringify | 51,367 | 51,077 |
| fast-stable-stringify | 73,933 | 73,214 |
| faster-stable-stringify | 65,571 | 64,848 |
| json-stringify-deterministic | 45,792 | 45,526 |
| fast-safe-stringify | 58,717 | 57,828 |
| safe-stable-stringify | 68,305 | 76,684 |

The comparison fixture improves by 12.3%. A second fresh process
pair measures 67,996 → 73,143 ops/sec
(7.6%). These results describe this fixture and runtime. They do not
establish a fastest implementation for every input or feature set.

Some deep-object cases are slower. The largest decline in the full benchmark
is 3.1%. CV measures variation within one process. Results can also vary
between fresh processes.

## Acknowledgements

Sponsored by [MaibornWolff](https://www.maibornwolff.de/) and [nearForm](http://nearform.com)

## License

MIT

[`replacer`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The%20replacer%20parameter
[`spacer`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The%20space%20argument
[`toJSON`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON()_behavior
[JSON.stringify]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
