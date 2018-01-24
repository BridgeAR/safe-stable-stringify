# safe-stable-stringify

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

full replacer:   simple object x 993,352 ops/sec ±1.49% (92 runs sampled)
full replacer:   circular      x 467,264 ops/sec ±0.68% (95 runs sampled)
full replacer:   deep          x 14,855 ops/sec ±0.82% (91 runs sampled)
full replacer:   deep circular x 14,608 ops/sec ±1.68% (95 runs sampled)

full array:   simple object x 1,233,430 ops/sec ±0.58% (92 runs sampled)
full array:   circular      x 1,205,360 ops/sec ±1.33% (90 runs sampled)
full array:   deep          x 1,175,758 ops/sec ±0.63% (92 runs sampled)
full array:   deep circular x 1,171,813 ops/sec ±1.08% (92 runs sampled)

indentation:   simple object x 1,385,853 ops/sec ±2.18% (94 runs sampled)
indentation:   circular      x 598,650 ops/sec ±1.26% (92 runs sampled)
indentation:   deep          x 16,060 ops/sec ±0.76% (93 runs sampled)
indentation:   deep circular x 15,784 ops/sec ±1.31% (95 runs sampled)
```

Comparing `safe-stable-stringify` with known alternatives:

```md
fast-json-stable-stringify x 8,906 ops/sec ±0.87% (91 runs sampled)
json-stable-stringify x 6,821 ops/sec ±2.93% (88 runs sampled)
fast-stable-stringify x 10,540 ops/sec ±0.51% (92 runs sampled)
faster-stable-stringify x 8,450 ops/sec ±1.62% (89 runs sampled)
fast-safe-stringify x 15,640 ops/sec ±0.51% (95 runs sampled)
this x 25,482 ops/sec ±1.59% (87 runs sampled)

The fastest is this
```

## Acknowledgements

Sponsored by [nearForm](http://nearform.com)

## License

MIT

[`replacer`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The%20replacer%20parameter
[`spacer`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The%20space%20argument
[`toJSON`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON()_behavior
[JSON.stringify]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
