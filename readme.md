# safe-stable-stringify

[![Greenkeeper badge](https://badges.greenkeeper.io/BridgeAR/safe-stable-stringify.svg)](https://greenkeeper.io/)

Safe, deterministic and fast serialization alternative to [JSON.stringify][].

Gracefully handles circular structures instead of throwing.

## Usage

The same as [JSON.stringify][].

`stringify(value[, replacer[, space]])`

```js
const stringify = require('safe-stable-stringify')
const o = { b: 1, a: 0 }
o.o = o

console.log(stringify(o))
// '{"a":0,"b":1,"o":"[Circular]"}'
console.log(JSON.stringify(o))
// TypeError: Converting circular structure to JSON

function replacer(key, value) {
  console.log('Key:', JSON.stringify(key))
  // Remove the circular structure
  if (key === 'o') {
    return
  }
  return value
}
const serialized = stringify(o, replacer, 2)
// Key: ""
// Key: "a"
// Key: "b"
// Key: "o"
console.log(serialized)
// {
//   "a": 0,
//   "b": 1
// }
```

## Differences to JSON.stringify

1. replace circular structures with the string `[Circular]`
1. sorted keys instead of using the insertion order

Those are the only differences to the real JSON.stringify. This is a side effect
free variant and [`toJSON`][], [`replacer`][] and the [`spacer`][] work the same
as with the native JSON.stringify.

## Performance / Benchmarks

Currently this is by far the fastest known stable stringify implementation.
This is especially important for big objects.

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

Sponsored by [nearForm](http://nearform.com)

## License

MIT

[`replacer`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The%20replacer%20parameter
[`spacer`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The%20space%20argument
[`toJSON`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON()_behavior
[JSON.stringify]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
