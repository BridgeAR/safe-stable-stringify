const { test } = require('tap')
const { stringify } = require('./index.js')
const clone = require('clone')

test('circular reference to root', function (assert) {
  const fixture = { name: 'Tywin Lannister' }
  fixture.circle = fixture
  const expected = JSON.stringify(
    { circle: '[Circular]', name: 'Tywin Lannister' }
  )
  const actual = stringify(fixture)
  assert.equal(actual, expected)
  assert.end()
})

test('nested circular reference to root', function (assert) {
  const fixture = { name: 'Tywin\n\t"Lannister' }
  fixture.id = { circle: fixture }
  const expected = JSON.stringify(
    { id: { circle: '[Circular]' }, name: 'Tywin\n\t"Lannister' }
  )
  const actual = stringify(fixture)
  assert.equal(actual, expected)
  assert.end()
})

test('throw if circularValue is set to TypeError', function (assert) {
  const noCircularStringify = stringify.configure({ circularValue: TypeError })
  const object = { number: 42, boolean: true, string: 'Yes!' }
  object.circular = object

  assert.throws(() => noCircularStringify(object), TypeError)
  assert.end()
})

test('throw if circularValue is set to Error', function (assert) {
  const noCircularStringify = stringify.configure({ circularValue: Error })
  const object = { number: 42, boolean: true, string: 'Yes!' }
  object.circular = object

  assert.throws(() => noCircularStringify(object), TypeError)
  assert.end()
})

test('child circular reference', function (assert) {
  const fixture = { name: 'Tywin Lannister', child: { name: 'Tyrion\n\t"Lannister'.repeat(20) } }
  fixture.child.dinklage = fixture.child
  const expected = JSON.stringify({
    child: {
      dinklage: '[Circular]', name: 'Tyrion\n\t"Lannister'.repeat(20)
    },
    name: 'Tywin Lannister'
  })
  const actual = stringify(fixture)
  assert.equal(actual, expected)
  assert.end()
})

test('nested child circular reference', function (assert) {
  const fixture = { name: 'Tywin Lannister', child: { name: 'Tyrion Lannister' } }
  fixture.child.actor = { dinklage: fixture.child }
  const expected = JSON.stringify({
    child: {
      actor: { dinklage: '[Circular]' }, name: 'Tyrion Lannister'
    },
    name: 'Tywin Lannister'
  })
  const actual = stringify(fixture)
  assert.equal(actual, expected)
  assert.end()
})

test('circular objects in an array', function (assert) {
  const fixture = { name: 'Tywin Lannister' }
  fixture.hand = [fixture, fixture]
  const expected = JSON.stringify({
    hand: ['[Circular]', '[Circular]'], name: 'Tywin Lannister'
  })
  const actual = stringify(fixture)
  assert.equal(actual, expected)
  assert.end()
})

test('nested circular references in an array', function (assert) {
  const fixture = {
    name: 'Tywin Lannister',
    offspring: [{ name: 'Tyrion Lannister' }, { name: 'Cersei Lannister' }]
  }
  fixture.offspring[0].dinklage = fixture.offspring[0]
  fixture.offspring[1].headey = fixture.offspring[1]

  const expected = JSON.stringify({
    name: 'Tywin Lannister',
    offspring: [
      { dinklage: '[Circular]', name: 'Tyrion Lannister' },
      { headey: '[Circular]', name: 'Cersei Lannister' }
    ]
  })
  const actual = stringify(fixture)
  assert.equal(actual, expected)
  assert.end()
})

test('circular arrays', function (assert) {
  const fixture = []
  fixture.push(fixture, fixture)
  const expected = JSON.stringify(['[Circular]', '[Circular]'])
  const actual = stringify(fixture)
  assert.equal(actual, expected)
  assert.end()
})

test('nested circular arrays', function (assert) {
  const fixture = []
  fixture.push(
    { name: 'Jon Snow', circular: fixture },
    { name: 'Ramsay Bolton', circular: fixture }
  )
  const expected = JSON.stringify([
    { circular: '[Circular]', name: 'Jon Snow' },
    { circular: '[Circular]', name: 'Ramsay Bolton' }
  ])
  const actual = stringify(fixture)
  assert.equal(actual, expected)
  assert.end()
})

test('repeated non-circular references in objects', function (assert) {
  const daenerys = { name: 'Daenerys Targaryen' }
  const fixture = {
    motherOfDragons: daenerys,
    queenOfMeereen: daenerys
  }
  const expected = JSON.stringify(fixture)
  const actual = stringify(fixture)
  assert.equal(actual, expected)
  assert.end()
})

test('repeated non-circular references in arrays', function (assert) {
  const daenerys = { name: 'Daenerys Targaryen' }
  const fixture = [daenerys, daenerys]
  const expected = JSON.stringify(fixture)
  const actual = stringify(fixture)
  assert.equal(actual, expected)
  assert.end()
})

test('double child circular reference', function (assert) {
  // create circular reference
  const child = { name: 'Tyrion Lannister' }
  child.dinklage = child

  // include it twice in the fixture
  const fixture = { name: 'Tywin Lannister', childA: child, childB: child }
  const cloned = clone(fixture)
  const expected = JSON.stringify({
    childA: {
      dinklage: '[Circular]', name: 'Tyrion Lannister'
    },
    childB: {
      dinklage: '[Circular]', name: 'Tyrion Lannister'
    },
    name: 'Tywin Lannister'
  })
  const actual = stringify(fixture)
  assert.equal(actual, expected)

  // check if the fixture has not been modified
  assert.same(fixture, cloned)
  assert.end()
})

test('child circular reference with toJSON', function (assert) {
  // Create a test object that has an overridden `toJSON` property
  TestObject.prototype.toJSON = function () { return { special: 'case' } }
  function TestObject () {}

  // Creating a simple circular object structure
  const parentObject = {}
  parentObject.childObject = new TestObject()
  // @ts-expect-error
  parentObject.childObject.parentObject = parentObject

  // Creating a simple circular object structure
  const otherParentObject = new TestObject()
  // @ts-expect-error
  otherParentObject.otherChildObject = {}
  // @ts-expect-error
  otherParentObject.otherChildObject.otherParentObject = otherParentObject

  // Making sure our original tests work
  // @ts-expect-error
  assert.same(parentObject.childObject.parentObject, parentObject)
  // @ts-expect-error
  assert.same(otherParentObject.otherChildObject.otherParentObject, otherParentObject)

  // Should both be idempotent
  assert.equal(stringify(parentObject), '{"childObject":{"special":"case"}}')
  assert.equal(stringify(otherParentObject), '{"special":"case"}')

  // Therefore the following assertion should be `true`
  // @ts-expect-error
  assert.same(parentObject.childObject.parentObject, parentObject)
  // @ts-expect-error
  assert.same(otherParentObject.otherChildObject.otherParentObject, otherParentObject)

  assert.end()
})

test('null object', function (assert) {
  const expected = JSON.stringify(null)
  const actual = stringify(null)
  assert.equal(actual, expected)
  assert.end()
})

test('null property', function (assert) {
  const obj = { f: null }
  const expected = JSON.stringify(obj)
  const actual = stringify(obj)
  assert.equal(actual, expected)
  assert.end()
})

test('null property', function (assert) {
  const obj = { toJSON () { return null } }
  const expected = JSON.stringify(obj)
  const actual = stringify(obj)
  assert.equal(actual, expected)
  assert.end()
})

test('nested child circular reference in toJSON', function (assert) {
  var circle = { some: 'data' }
  circle.circle = circle
  var a = {
    b: {
      toJSON: function () {
        // @ts-expect-error
        a.b = 2
        return '[Redacted]'
      }
    },
    baz: {
      circle,
      toJSON: function () {
        // @ts-expect-error
        a.baz = circle
        return '[Redacted]'
      }
    }
  }
  var o = {
    a,
    bar: a
  }

  const expected = JSON.stringify({
    a: {
      b: '[Redacted]',
      baz: '[Redacted]'
    },
    bar: {
      b: 2,
      baz: {
        circle: '[Circular]',
        some: 'data'
      }
    }
  })
  const actual = stringify(o)
  assert.equal(actual, expected)
  assert.end()
})

test('invalid replacer being ignored', function (assert) {
  const obj = { a: true }

  // @ts-expect-error
  const actual = stringify(obj, 'invalidReplacer')
  const expected = stringify(obj)
  assert.equal(actual, expected)

  assert.end()
})

test('replacer removing elements', function (assert) {
  const replacer = function (k, v) {
    if (k === 'remove') return
    return v
  }
  const obj = { f: null, remove: true, typed: new Int32Array(1) }
  const expected = JSON.stringify(obj, replacer)
  let actual = stringify(obj, replacer)
  assert.equal(actual, expected)

  obj.obj = obj
  actual = stringify(obj, replacer)
  assert.equal(actual, '{"f":null,"obj":"[Circular]","typed":{"0":0}}')

  assert.end()
})

test('replacer removing elements and indentation', function (assert) {
  const replacer = function (k, v) {
    if (k === 'remove') return
    return v
  }
  const obj = { f: null, remove: true }
  const expected = JSON.stringify(obj, replacer, 2)
  const actual = stringify(obj, replacer, 2)
  assert.equal(actual, expected)
  assert.end()
})

test('replacer removing all elements', function (assert) {
  const replacer = function (k, v) {
    if (k !== '') return
    return k
  }
  const obj = [{ f: null, remove: true }]
  let expected = JSON.stringify(obj, replacer)
  let actual = stringify(obj, replacer)
  assert.equal(actual, expected)

  expected = JSON.stringify({ toJSON () { return obj } }, replacer)
  actual = stringify({ toJSON () { return obj } }, replacer)
  assert.equal(actual, expected)

  assert.end()
})

test('replacer removing all elements and indentation', function (assert) {
  const replacer = function (k, v) {
    if (k !== '') return
    return k
  }
  const obj = [{ f: null, remove: true }]
  const expected = JSON.stringify(obj, replacer, 2)
  const actual = stringify(obj, replacer, 2)
  assert.equal(actual, expected)
  assert.end()
})

test('array replacer', function (assert) {
  const replacer = ['f', 1, null]
  const obj = { f: null, null: true, 1: false }
  // The null element will be removed!
  const expected = JSON.stringify(obj, replacer)
  let actual = stringify(obj, replacer)
  assert.equal(actual, expected)

  obj.f = obj

  actual = stringify({ toJSON () { return obj } }, replacer)
  assert.equal(actual, expected.replace('null', '"[Circular]"'))

  assert.end()
})

test('empty array replacer', function (assert) {
  const replacer = []
  const obj = { f: null, null: true, 1: false }
  // The null element will be removed!
  const expected = JSON.stringify(obj, replacer)
  const actual = stringify(obj, replacer)
  assert.equal(actual, expected)

  assert.end()
})

test('array replacer and indentation', function (assert) {
  const replacer = ['f', 1, null]
  const obj = { f: null, null: true, 1: [false, -Infinity, 't'] }
  // The null element will be removed!
  const expected = JSON.stringify(obj, replacer, 2)
  const actual = stringify(obj, replacer, 2)
  assert.equal(actual, expected)
  assert.end()
})

test('indent zero', function (assert) {
  const obj = { f: null, null: true, 1: false }
  const expected = JSON.stringify(obj, null, 0)
  const actual = stringify(obj, null, 0)
  assert.equal(actual, expected)
  assert.end()
})

test('replacer and indentation without match', function (assert) {
  const replacer = function (k, v) {
    if (k === '') return v
  }
  const obj = { f: 1, b: null, c: 't', d: Infinity, e: true }
  const expected = JSON.stringify(obj, replacer, '   ')
  const actual = stringify(obj, replacer, '   ')
  assert.equal(actual, expected)
  assert.end()
})

test('array replacer and indentation without match', function (assert) {
  const replacer = ['']
  const obj = { f: 1, b: null, c: 't', d: Infinity, e: true }
  const expected = JSON.stringify(obj, replacer, '   ')
  const actual = stringify(obj, replacer, '   ')
  assert.equal(actual, expected)
  assert.end()
})

test('indentation without match', function (assert) {
  const obj = { f: undefined }
  const expected = JSON.stringify(obj, undefined, 3)
  const actual = stringify(obj, undefined, 3)
  assert.equal(actual, expected)
  assert.end()
})

test('array nulls and indentation', function (assert) {
  const obj = [null, null]
  const expected = JSON.stringify(obj, undefined, 3)
  const actual = stringify(obj, undefined, 3)
  assert.equal(actual, expected)
  assert.end()
})

test('array nulls, replacer and indentation', function (assert) {
  const obj = [null, Infinity, 5, true, false]
  const expected = JSON.stringify(obj, (_, v) => v, 3)
  const actual = stringify(obj, (_, v) => v, 3)
  assert.equal(actual, expected)
  assert.end()
})

test('array nulls and replacer', function (assert) {
  const obj = [null, Infinity, 5, true, false, [], {}]
  const expected = JSON.stringify(obj, (_, v) => v)
  const actual = stringify(obj, (_, v) => v)
  assert.equal(actual, expected)
  assert.end()
})

test('array nulls, array replacer and indentation', function (assert) {
  const obj = [null, null, [], {}]
  // @ts-expect-error
  const expected = JSON.stringify(obj, [false], 3)
  // @ts-expect-error
  const actual = stringify(obj, [false], 3)
  assert.equal(actual, expected)
  assert.end()
})

test('array and array replacer', function (assert) {
  const obj = [null, null, 't', Infinity, true, false, [], {}]
  const expected = JSON.stringify(obj, [2])
  const actual = stringify(obj, [2])
  assert.equal(actual, expected)
  assert.end()
})

test('indentation with elements', function (assert) {
  const obj = { a: 1, b: [null, 't', Infinity, true] }
  const expected = JSON.stringify(obj, null, 5)
  const actual = stringify(obj, null, 5)
  assert.equal(actual, expected)
  assert.end()
})

test('object with undefined values', function (assert) {
  let obj = { a: 1, c: undefined, b: 'hello', d: [], e: {} }

  let expected = JSON.stringify(obj)
  let actual = stringify(obj)
  assert.equal(actual, expected)

  // @ts-expect-error
  obj = { b: 'hello', a: undefined, c: 1 }

  expected = JSON.stringify(obj)
  actual = stringify(obj)
  assert.equal(actual, expected)

  assert.end()
})

test('undefined values and indented', function (assert) {
  let obj = { a: 1, c: undefined, b: 'hello' }

  let expected = JSON.stringify(obj, null, 2)
  let actual = stringify(obj, null, 2)
  assert.equal(actual, expected)

  obj = { b: 'hello', a: undefined, c: 1 }

  expected = JSON.stringify(obj)
  actual = stringify(obj)
  assert.equal(actual, expected)

  assert.end()
})

test('bigint option', function (assert) {
  const stringifyNoBigInt = stringify.configure({ bigint: false })
  const stringifyBigInt = stringify.configure({ bigint: true })

  const obj = { a: 1n }
  const actualBigInt = stringifyBigInt(obj, null, 1)
  const actualNoBigInt = stringifyNoBigInt(obj, null, 1)
  const actualDefault = stringify(obj, null, 1)
  const expectedBigInt = '{\n "a": 1\n}'
  const expectedNoBigInt = '{}'

  assert.equal(actualNoBigInt, expectedNoBigInt)
  assert.throws(() => JSON.stringify(obj, null, 1), TypeError)

  assert.equal(actualBigInt, expectedBigInt)
  assert.equal(actualDefault, expectedBigInt)

  assert.throws(() => stringify.configure({ bigint: null }), /bigint/)

  assert.end()
})

test('bigint option with replacer', function (assert) {
  const stringifyBigInt = stringify.configure({ bigint: true })

  const obj = { a: new BigUint64Array([1n]), 0: 1n }
  const actualArrayReplacer = stringifyBigInt(obj, ['0', 'a'])
  const actualFnReplacer = stringifyBigInt(obj, (k, v) => v)
  const expected = '{"0":1,"a":{"0":1}}'

  assert.equal(actualArrayReplacer, expected)
  assert.equal(actualFnReplacer, expected)

  assert.end()
})

test('bigint and typed array with indentation', function (assert) {
  const obj = { a: 1n, t: new Int8Array(1) }
  const expected = '{\n "a": 1,\n "t": {\n  "0": 0\n }\n}'
  const actual = stringify(obj, null, 1)
  assert.equal(actual, expected)
  assert.end()
})

test('bigint and typed array without indentation', function (assert) {
  const obj = { a: 1n, t: new Int8Array(1) }
  const expected = '{"a":1,"t":{"0":0}}'
  const actual = stringify(obj, null, 0)
  assert.equal(actual, expected)
  assert.end()
})

test('no bigint without indentation', function (assert) {
  const stringifyNoBigInt = stringify.configure({ bigint: false })
  const obj = { a: 1n, t: new Int8Array(1) }
  const expected = '{"t":{"0":0}}'
  const actual = stringifyNoBigInt(obj, null, 0)
  assert.equal(actual, expected)
  assert.end()
})

test('circular value option should allow strings and null', function (assert) {
  let stringifyCircularValue = stringify.configure({ circularValue: 'YEAH!!!' })

  const obj = {}
  obj.circular = obj

  const expected = '{"circular":"YEAH!!!"}'
  const actual = stringifyCircularValue(obj)
  assert.equal(actual, expected)
  assert.equal(stringify(obj), '{"circular":"[Circular]"}')

  stringifyCircularValue = stringify.configure({ circularValue: null })
  assert.equal(stringifyCircularValue(obj), '{"circular":null}')

  assert.end()
})

test('circular value option should throw for invalid values', function (assert) {
  // @ts-expect-error
  assert.throws(() => stringify.configure({ circularValue: { objects: 'are not allowed' } }), /circularValue/)

  assert.end()
})

test('circular value option set to undefined should skip serialization', function (assert) {
  const stringifyCircularValue = stringify.configure({ circularValue: undefined })

  const obj = { a: 1 }
  obj.circular = obj
  obj.b = [2, obj]

  const expected = '{"a":1,"b":[2,null]}'
  const actual = stringifyCircularValue(obj)
  assert.equal(actual, expected)

  assert.end()
})

test('non-deterministic', function (assert) {
  const stringifyNonDeterministic = stringify.configure({ deterministic: false })

  const obj = { b: true, a: false }

  const expected = JSON.stringify(obj)
  const actual = stringifyNonDeterministic(obj)
  assert.equal(actual, expected)

  // @ts-expect-error
  assert.throws(() => stringify.configure({ deterministic: 1 }), /deterministic/)

  assert.end()
})

test('non-deterministic with replacer', function (assert) {
  const stringifyNonDeterministic = stringify.configure({ deterministic: false, bigint: false })

  const obj = { b: true, a: 5n, c: Infinity, d: 4, e: [Symbol('null'), 5, Symbol('null')] }
  const keys = Object.keys(obj)

  const expected = stringify(obj, ['b', 'c', 'd', 'e'])
  let actual = stringifyNonDeterministic(obj, keys)
  assert.equal(actual, expected)

  actual = stringifyNonDeterministic(obj, (k, v) => v)
  assert.equal(actual, expected)

  assert.end()
})

test('non-deterministic with indentation', function (assert) {
  const stringifyNonDeterministic = stringify.configure({ deterministic: false, bigint: false })

  const obj = { b: true, a: 5, c: Infinity, d: false, e: [Symbol('null'), 5, Symbol('null')] }

  const expected = JSON.stringify(obj, null, 1)
  const actual = stringifyNonDeterministic(obj, null, 1)
  assert.equal(actual, expected)

  assert.end()
})

test('check typed arrays', function (assert) {
  const obj = [null, null, new Float32Array(99), Infinity, Symbol('null'), true, false, [], {}, Symbol('null')]
  const expected = JSON.stringify(obj)
  const actual = stringify(obj)
  assert.equal(actual, expected)
  assert.end()
})

test('check small typed arrays with extra properties', function (assert) {
  const obj = new Uint8Array(0)
  // @ts-expect-error
  obj.foo = true
  let expected = JSON.stringify(obj)
  let actual = stringify(obj)
  assert.equal(actual, expected)

  expected = JSON.stringify(obj, null, 2)
  actual = stringify(obj, null, 2)
  assert.equal(actual, expected)

  expected = JSON.stringify(obj, ['foo'])
  actual = stringify(obj, ['foo'])
  assert.equal(actual, expected)

  expected = JSON.stringify(obj, (a, b) => b)
  actual = stringify(obj, (a, b) => b)
  assert.equal(actual, expected)

  assert.end()
})

test('trigger sorting fast path for objects with lots of properties', function (assert) {
  const keys = []
  const obj = {}
  for (let i = 0; i < 1e4; i++) {
    obj[`a${i}`] = i
    keys.push(`a${i}`)
  }

  const start = Date.now()

  stringify(obj)
  assert.ok(Date.now() - start < 100)
  const now = Date.now()
  const actualTime = now - start
  keys.sort()
  const expectedTime = Date.now() - now
  assert.ok(Math.abs(actualTime - expectedTime) < 50)
  assert.end()
})

test('maximum spacer length', function (assert) {
  const input = { a: 0 }
  const expected = `{\n${' '.repeat(10)}"a": 0\n}`
  assert.equal(stringify(input, null, 11), expected)
  assert.equal(stringify(input, null, 1e5), expected)
  assert.equal(stringify(input, null, ' '.repeat(11)), expected)
  assert.equal(stringify(input, null, ' '.repeat(1e3)), expected)
  assert.end()
})

test('indent properly; regression test for issue #16', function (assert) {
  const o = {
    collections: {},
    config: {
      label: 'Some\ttext\t',
      options: { toJSON () { return { exportNotes: true } } },
      preferences: []
    },
    items: [{
      creators: [{ lastName: 'Lander' }, { toJSON () { return null } }],
      date: { toJSON () { return '01/01/1989' } }
    }]
  }

  const arrayReplacer = ['config', 'items', 'options', 'circular', 'preferences', 'creators']

  const indentedJSON = JSON.stringify(o, null, 2)
  const indentedJSONArrayReplacer = JSON.stringify(o, arrayReplacer, 2)
  const indentedJSONArrayEmpty = JSON.stringify(o, [], 2)
  const indentedJSONReplacer = JSON.stringify(o, (k, v) => v, 2)

  assert.equal(
    stringify(o, null, 2),
    indentedJSON
  )
  assert.equal(
    stringify(o, arrayReplacer, 2),
    indentedJSONArrayReplacer
  )
  assert.equal(
    stringify(o, [], 2),
    indentedJSONArrayEmpty
  )
  assert.equal(
    // @ts-ignore
    stringify(o, (k, v) => v, 2),
    indentedJSONReplacer
  )

  o.items[0].circular = o

  const circularReplacement = '"items": [\n    {\n      "circular": "[Circular]",\n'
  const circularIdentifier = '"items": [\n    {\n'

  assert.equal(
    stringify(o, arrayReplacer, 2),
    indentedJSONArrayReplacer.replace(circularIdentifier, circularReplacement)
  )
  assert.equal(
    stringify(o, null, 2),
    indentedJSON.replace(circularIdentifier, circularReplacement)
  )
  assert.equal(
    // @ts-ignore
    stringify(o, (k, v) => v, 2),
    indentedJSONReplacer.replace(circularIdentifier, circularReplacement)
  )

  assert.end()
})

test('should stop if max depth is reached', (assert) => {
  const serialize = stringify.configure({
    maximumDepth: 5
  })
  const nested = {}
  const MAX_DEPTH = 10
  let currentNestedObject = null
  for (let i = 0; i < MAX_DEPTH; i++) {
    const k = 'nest_' + i
    if (!currentNestedObject) {
      currentNestedObject = nested
    }
    currentNestedObject[k] = {
      foo: 'bar'
    }
    currentNestedObject = currentNestedObject[k]
  }
  const res = serialize(nested)
  assert.ok(res.indexOf('"nest_4":"[Object]"'))
  assert.end()
})

test('should serialize only first 10 elements', (assert) => {
  const serialize = stringify.configure({
    maximumBreadth: 10
  })
  const breadth = {}
  const MAX_BREADTH = 100
  for (let i = 0; i < MAX_BREADTH; i++) {
    const k = 'key_' + i
    breadth[k] = 'foobar'
  }
  const res = serialize(breadth)
  const expected = '{"key_0":"foobar","key_1":"foobar","key_10":"foobar","key_11":"foobar","key_12":"foobar","key_13":"foobar","key_14":"foobar","key_15":"foobar","key_16":"foobar","key_17":"foobar","...":"90 items not stringified"}'
  assert.equal(res, expected)
  assert.end()
})

test('should serialize only first 10 elements with custom replacer and indentation', (assert) => {
  const serialize = stringify.configure({
    maximumBreadth: 10,
    maximumDepth: 1
  })
  const breadth = { a: Array.from({ length: 100 }, (_, i) => i) }
  const MAX_BREADTH = 100
  for (let i = 0; i < MAX_BREADTH; i++) {
    const k = 'key_' + i
    breadth[k] = 'foobar'
  }
  const res = serialize(breadth, (k, v) => v, 2)
  const expected = `{
  "a": "[Array]",
  "key_0": "foobar",
  "key_1": "foobar",
  "key_10": "foobar",
  "key_11": "foobar",
  "key_12": "foobar",
  "key_13": "foobar",
  "key_14": "foobar",
  "key_15": "foobar",
  "key_16": "foobar",
  "...": "91 items not stringified"
}`
  assert.equal(res, expected)
  assert.end()
})

test('maximumDepth config', function (assert) {
  const obj = { a: { b: { c: 1 }, a: [1, 2, 3] } }

  const serialize = stringify.configure({
    maximumDepth: 2
  })

  const result = serialize(obj, (key, val) => val)
  assert.equal(result, '{"a":{"a":"[Array]","b":"[Object]"}}')

  const res2 = serialize(obj, ['a', 'b'])
  assert.equal(res2, '{"a":{"a":"[Array]","b":{}}}')

  const json = JSON.stringify(obj, ['a', 'b'])
  assert.equal(json, '{"a":{"a":[1,2,3],"b":{}}}')

  const res3 = serialize(obj, null, 2)
  assert.equal(res3, `{
  "a": {
    "a": "[Array]",
    "b": "[Object]"
  }
}`)

  const res4 = serialize(obj)
  assert.equal(res4, '{"a":{"a":"[Array]","b":"[Object]"}}')

  assert.end()
})

test('maximumBreadth config', function (assert) {
  const obj = { a: ['a', 'b', 'c', 'd', 'e'] }

  const serialize = stringify.configure({
    maximumBreadth: 3
  })

  const result = serialize(obj, (key, val) => val)
  assert.equal(result, '{"a":["a","b","c","... 1 item not stringified"]}')

  const res2 = serialize(obj, ['a', 'b'])
  assert.equal(res2, '{"a":["a","b","c","... 1 item not stringified"]}')

  const res3 = serialize(obj, null, 2)
  assert.equal(res3, `{
  "a": [
    "a",
    "b",
    "c",
    "... 1 item not stringified"
  ]
}`)

  const res4 = serialize({ a: { a: 1, b: 1, c: 1, d: 1, e: 1 } }, null, 2)
  assert.equal(res4, `{
  "a": {
    "a": 1,
    "b": 1,
    "c": 1,
    "...": "2 items not stringified"
  }
}`)

  assert.end()
})
test('limit number of keys with array replacer', function (assert) {
  const replacer = ['a', 'b', 'c', 'd', 'e']
  const obj = {
    a: 'a',
    b: 'b',
    c: 'c',
    d: 'd',
    e: 'e',
    f: 'f',
    g: 'g',
    h: 'h'
  }

  const serialize = stringify.configure({
    maximumBreadth: 3
  })
  const res = serialize(obj, replacer, 2)
  const expected = `{
  "a": "a",
  "b": "b",
  "c": "c",
  "d": "d",
  "e": "e"
}`
  assert.equal(res, expected)
  assert.end()
})

test('limit number of keys in array', (assert) => {
  const serialize = stringify.configure({
    maximumBreadth: 3
  })
  const arr = []
  const MAX_BREADTH = 100
  for (let i = 0; i < MAX_BREADTH; i++) {
    arr.push(i)
  }
  const res = serialize(arr)
  const expected = '[0,1,2,"... 96 items not stringified"]'
  assert.equal(res, expected)
  assert.end()
})

test('limit number of keys in typed array', (assert) => {
  const serialize = stringify.configure({
    maximumBreadth: 3
  })
  const MAX = 100
  const arr = new Int32Array(MAX)

  for (let i = 0; i < MAX; i++) {
    arr[i] = i
  }
  // @ts-expect-error we want to explicitly test this behavior.
  arr.foobar = true
  const res = serialize(arr)
  const expected = '{"0":0,"1":1,"2":2,"...":"98 items not stringified"}'
  assert.equal(res, expected)
  const res2 = serialize(arr, (a, b) => b)
  assert.equal(res2, expected)
  const res3 = serialize(arr, [0, 1, 2])
  assert.equal(res3, '{"0":0,"1":1,"2":2}')
  const res4 = serialize(arr, null, 4)
  assert.equal(res4, `{
    "0": 0,
    "1": 1,
    "2": 2,
    "...": "98 items not stringified"
}`)
  assert.end()
})

test('show skipped keys even non were serliazable', (assert) => {
  const serialize = stringify.configure({
    maximumBreadth: 1
  })

  const input = { a: Symbol('ignored'), b: Symbol('ignored') }

  let actual = serialize(input)
  let expected = '{"...":"1 item not stringified"}'
  assert.equal(actual, expected)

  actual = serialize(input, (a, b) => b)
  assert.equal(actual, expected)

  actual = serialize(input, null, 1)
  expected = '{\n "...": "1 item not stringified"\n}'
  assert.equal(actual, expected)

  actual = serialize(input, (a, b) => b, 1)
  assert.equal(actual, expected)

  actual = serialize(input, ['a'])
  expected = '{}'
  assert.equal(actual, expected)

  actual = serialize(input, ['a', 'b', 'c'])
  assert.equal(actual, expected)

  assert.end()
})

test('array replacer entries are unique', (assert) => {
  const input = { 0: 0, b: 1 }

  const replacer = ['b', {}, [], 0, 'b', '0']
  // @ts-expect-error
  const actual = stringify(input, replacer)
  // @ts-expect-error
  const expected = JSON.stringify(input, replacer)
  assert.equal(actual, expected)

  assert.end()
})

test('should throw when maximumBreadth receives malformed input', (assert) => {
  assert.throws(() => {
    stringify.configure({
      // @ts-expect-error
      maximumBreadth: '3'
    })
  })
  assert.throws(() => {
    stringify.configure({
      maximumBreadth: 3.1
    })
  })
  assert.throws(() => {
    stringify.configure({
      maximumBreadth: 0
    })
  })
  assert.end()
})

test('check that all single characters are identical to JSON.stringify', (assert) => {
  for (let i = 0; i < 2 ** 16; i++) {
    const string = String.fromCharCode(i)
    const actual = stringify(string)
    const expected = JSON.stringify(string)
    // Older Node.js versions do not use the well formed JSON implementation.
    if (Number(process.version.split('.')[0].slice(1)) >= 12 || i < 0xd800 || i > 0xdfff) {
      assert.equal(actual, expected)
    } else {
      assert.not(actual, expected)
    }
  }
  // Trigger special case
  const longStringEscape = stringify(`${'a'.repeat(100)}\uD800`)
  assert.equal(longStringEscape, `"${'a'.repeat(100)}\\ud800"`)
  assert.end()
})

test('check for lone surrogate pairs', (assert) => {
  const edgeChar = String.fromCharCode(0xd799)

  for (let charCode = 0xD800; charCode < 0xDFFF; charCode++) {
    const surrogate = String.fromCharCode(charCode)

    assert.equal(
      stringify(surrogate),
      `"\\u${charCode.toString(16)}"`
    )
    assert.equal(
      stringify(`${'a'.repeat(200)}${surrogate}`),
      `"${'a'.repeat(200)}\\u${charCode.toString(16)}"`
    )
    assert.equal(
      stringify(`${surrogate}${'a'.repeat(200)}`),
      `"\\u${charCode.toString(16)}${'a'.repeat(200)}"`
    )
    if (charCode < 0xdc00) {
      const highSurrogate = surrogate
      const lowSurrogate = String.fromCharCode(charCode + 1024)
      assert.notOk(
        stringify(
          `${edgeChar}${highSurrogate}${lowSurrogate}${edgeChar}`
        ).includes('\\u')
      )
      assert.equal(
        (stringify(
          `${highSurrogate}${highSurrogate}${lowSurrogate}`
        ).match(/\\u/g) || []).length,
        1
      )
    } else {
      assert.equal(
        stringify(`${edgeChar}${surrogate}${edgeChar}`),
        `"${edgeChar}\\u${charCode.toString(16)}${edgeChar}"`
      )
    }
  }
  assert.end()
})
