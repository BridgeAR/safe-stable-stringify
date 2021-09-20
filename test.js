const { test } = require('tap')
const stringify = require('./')()
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
    { name: 'Jon Snow', bastards: fixture },
    { name: 'Ramsay Bolton', bastards: fixture }
  )
  const expected = JSON.stringify([
    { bastards: '[Circular]', name: 'Jon Snow' },
    { bastards: '[Circular]', name: 'Ramsay Bolton' }
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
  // Create a test object that has an overriden `toJSON` property
  TestObject.prototype.toJSON = function () { return { special: 'case' } }
  function TestObject (content) {}

  // Creating a simple circular object structure
  const parentObject = {}
  parentObject.childObject = new TestObject()
  parentObject.childObject.parentObject = parentObject

  // Creating a simple circular object structure
  const otherParentObject = new TestObject()
  otherParentObject.otherChildObject = {}
  otherParentObject.otherChildObject.otherParentObject = otherParentObject

  // Making sure our original tests work
  assert.same(parentObject.childObject.parentObject, parentObject)
  assert.same(otherParentObject.otherChildObject.otherParentObject, otherParentObject)

  // Should both be idempotent
  assert.equal(stringify(parentObject), '{"childObject":{"special":"case"}}')
  assert.equal(stringify(otherParentObject), '{"special":"case"}')

  // Therefore the following assertion should be `true`
  assert.same(parentObject.childObject.parentObject, parentObject)
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
        a.b = 2
        return '[Redacted]'
      }
    },
    baz: {
      circle,
      toJSON: function () {
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
  const expected = JSON.stringify(obj, [false], 3)
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

test('circular value option', function (assert) {
  let stringifyCircularValue = stringify.configure({ circularValue: 'YEAH!!!' })

  const obj = {}
  obj.circular = obj

  const expected = '{"circular":"YEAH!!!"}'
  const actual = stringifyCircularValue(obj)
  assert.equal(actual, expected)
  assert.equal(actual, expected)
  assert.equal(stringify(obj), '{"circular":"[Circular]"}')

  assert.throws(() => stringify.configure({ circularValue: { objects: 'are not allowed' } }), /circularValue/)

  stringifyCircularValue = stringify.configure({ circularValue: null })
  assert.equal(stringifyCircularValue(obj), '{"circular":null}')

  assert.end()
})

test('non-deterministic', function (assert) {
  const stringifyNonDeterministic = stringify.configure({ deterministic: false })

  const obj = { b: true, a: false }

  const expected = JSON.stringify(obj)
  const actual = stringifyNonDeterministic(obj)
  assert.equal(actual, expected)

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
  obj.foo = true
  const expected = JSON.stringify(obj)
  const actual = stringify(obj)
  assert.equal(actual, expected)
  assert.end()
})

test('trigger sorting fast path for objects with lots of properties', function (assert) {
  const obj = {}
  for (let i = 0; i < 1e4; i++) {
    obj[`a${i}`] = i
  }
  const start = Date.now()
  stringify(obj)
  assert.ok(Date.now() - start < 100)
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
    stringify(o, (k, v) => v, 2),
    indentedJSONReplacer.replace(circularIdentifier, circularReplacement)
  )

  assert.end()
})

test('should stop if max depth is reached', (assert) => {
  const serialize = require('./')({
    maxDepth: 5
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
  console.log(res)
  assert.ok(res.indexOf('"nest_4":"[...]"') !== -1)
  assert.end()
})

test('should serialize only first 10 elements', (assert) => {
  const serialize = require('./')({
    maxBreadth: 10
  })
  const breadth = {}
  const MAX_BREADTH = 100
  for (let i = 0; i < MAX_BREADTH; i++) {
    const k = 'key_' + i
    breadth[k] = 'foobar'
  }
  const res = serialize(breadth)
  const expected = '{"key_0":"foobar","key_1":"foobar","key_2":"foobar","key_3":"foobar","key_4":"foobar","key_5":"foobar","key_6":"foobar","key_7":"foobar","key_8":"foobar","key_9":"foobar"}'
  assert.equal(res, expected)
  assert.end()
})
