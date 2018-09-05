const { test } = require('tap')
const stringify = require('./')
const clone = require('clone')

test('circular reference to root', function (assert) {
  const fixture = { name: 'Tywin Lannister' }
  fixture.circle = fixture
  const expected = JSON.stringify(
    { circle: '[Circular]', name: 'Tywin Lannister' }
  )
  const actual = stringify(fixture)
  assert.is(actual, expected)
  assert.end()
})

test('nested circular reference to root', function (assert) {
  const fixture = { name: 'Tywin\n\t"Lannister' }
  fixture.id = { circle: fixture }
  const expected = JSON.stringify(
    { id: { circle: '[Circular]' }, name: 'Tywin\n\t"Lannister' }
  )
  const actual = stringify(fixture)
  assert.is(actual, expected)
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
  assert.is(actual, expected)
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
  assert.is(actual, expected)
  assert.end()
})

test('circular objects in an array', function (assert) {
  const fixture = { name: 'Tywin Lannister' }
  fixture.hand = [fixture, fixture]
  const expected = JSON.stringify({
    hand: ['[Circular]', '[Circular]'], name: 'Tywin Lannister'
  })
  const actual = stringify(fixture)
  assert.is(actual, expected)
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
  assert.is(actual, expected)
  assert.end()
})

test('circular arrays', function (assert) {
  const fixture = []
  fixture.push(fixture, fixture)
  const expected = JSON.stringify(['[Circular]', '[Circular]'])
  const actual = stringify(fixture)
  assert.is(actual, expected)
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
  assert.is(actual, expected)
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
  assert.is(actual, expected)
  assert.end()
})

test('repeated non-circular references in arrays', function (assert) {
  const daenerys = { name: 'Daenerys Targaryen' }
  const fixture = [daenerys, daenerys]
  const expected = JSON.stringify(fixture)
  const actual = stringify(fixture)
  assert.is(actual, expected)
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
  assert.is(actual, expected)

  // check if the fixture has not been modified
  assert.deepEqual(fixture, cloned)
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
  assert.deepEqual(parentObject.childObject.parentObject, parentObject)
  assert.deepEqual(otherParentObject.otherChildObject.otherParentObject, otherParentObject)

  // Should both be idempotent
  assert.equal(stringify(parentObject), '{"childObject":{"special":"case"}}')
  assert.equal(stringify(otherParentObject), '{"special":"case"}')

  // Therefore the following assertion should be `true`
  assert.deepEqual(parentObject.childObject.parentObject, parentObject)
  assert.deepEqual(otherParentObject.otherChildObject.otherParentObject, otherParentObject)

  assert.end()
})

test('null object', function (assert) {
  const expected = JSON.stringify(null)
  const actual = stringify(null)
  assert.is(actual, expected)
  assert.end()
})

test('null property', function (assert) {
  const expected = JSON.stringify({ f: null })
  const actual = stringify({ f: null })
  assert.is(actual, expected)
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
  assert.is(actual, expected)
  assert.end()
})

test('replacer removing elements', function (assert) {
  const replacer = function (k, v) {
    if (k === 'remove') return
    return v
  }
  const expected = JSON.stringify({ f: null, remove: true }, replacer)
  const actual = stringify({ f: null, remove: true }, replacer)
  assert.is(actual, expected)
  assert.end()
})

test('replacer removing elements and indentation', function (assert) {
  const replacer = function (k, v) {
    if (k === 'remove') return
    return v
  }
  const expected = JSON.stringify({ f: null, remove: true }, replacer, 2)
  const actual = stringify({ f: null, remove: true }, replacer, 2)
  assert.is(actual, expected)
  assert.end()
})

test('replacer removing all elements', function (assert) {
  const replacer = function (k, v) {
    if (k !== '') return
    return k
  }
  const expected = JSON.stringify([{ f: null, remove: true }], replacer)
  const actual = stringify([{ f: null, remove: true }], replacer)
  assert.is(actual, expected)
  assert.end()
})

test('replacer removing all elements and indentation', function (assert) {
  const replacer = function (k, v) {
    if (k !== '') return
    return k
  }
  const expected = JSON.stringify([{ f: null, remove: true }], replacer, 2)
  const actual = stringify([{ f: null, remove: true }], replacer, 2)
  assert.is(actual, expected)
  assert.end()
})

test('array replacer', function (assert) {
  const replacer = ['f', 1, null]
  // The null element will be removed!
  const expected = JSON.stringify({ f: null, null: true, 1: false }, replacer)
  const actual = stringify({ f: null, null: true, 1: false }, replacer)
  assert.is(actual, expected)
  assert.end()
})

test('array replacer and indentation', function (assert) {
  const replacer = ['f', 1, null]
  // The null element will be removed!
  const expected = JSON.stringify({ f: null, null: true, 1: [false, -Infinity, 't'] }, replacer, 2)
  const actual = stringify({ f: null, null: true, 1: [false, -Infinity, 't'] }, replacer, 2)
  assert.is(actual, expected)
  assert.end()
})

test('indent zero', function (assert) {
  const expected = JSON.stringify({ f: null, null: true, 1: false }, null, 0)
  const actual = stringify({ f: null, null: true, 1: false }, null, 0)
  assert.is(actual, expected)
  assert.end()
})

test('replacer and indentation without match', function (assert) {
  const replacer = function (k, v) {
    if (k === '') return v
  }
  const expected = JSON.stringify({ f: 1, b: null, c: 't', d: Infinity, e: true }, replacer, '   ')
  const actual = stringify({ f: 1, b: null, c: 't', d: Infinity, e: true }, replacer, '   ')
  assert.is(actual, expected)
  assert.end()
})

test('array replacer and indentation without match', function (assert) {
  const replacer = ['']
  const expected = JSON.stringify({ f: 1, b: null, c: 't', d: Infinity, e: true }, replacer, '   ')
  const actual = stringify({ f: 1, b: null, c: 't', d: Infinity, e: true }, replacer, '   ')
  assert.is(actual, expected)
  assert.end()
})

test('indentation without match', function (assert) {
  const expected = JSON.stringify({ f: undefined }, undefined, 3)
  const actual = stringify({ f: undefined }, undefined, 3)
  assert.is(actual, expected)
  assert.end()
})

test('array nulls and indentation', function (assert) {
  const expected = JSON.stringify([null, null], undefined, 3)
  const actual = stringify([null, null], undefined, 3)
  assert.is(actual, expected)
  assert.end()
})

test('array nulls, replacer and indentation', function (assert) {
  const expected = JSON.stringify([null, Infinity, 5, true, false], (_, v) => v, 3)
  const actual = stringify([null, Infinity, 5, true, false], (_, v) => v, 3)
  assert.is(actual, expected)
  assert.end()
})

test('array nulls and replacer', function (assert) {
  const expected = JSON.stringify([null, Infinity, 5, true, false], (_, v) => v)
  const actual = stringify([null, Infinity, 5, true, false], (_, v) => v)
  assert.is(actual, expected)
  assert.end()
})

test('array nulls, array replacer and indentation', function (assert) {
  const expected = JSON.stringify([null, null], [false], 3)
  const actual = stringify([null, null], [false], 3)
  assert.is(actual, expected)
  assert.end()
})

test('array and array replacer', function (assert) {
  const expected = JSON.stringify([null, null, 't', Infinity, true, false], [2])
  const actual = stringify([null, null, 't', Infinity, true, false], [2])
  assert.is(actual, expected)
  assert.end()
})

test('indentation with elements', function (assert) {
  const expected = JSON.stringify({ a: 1, b: [null, 't', Infinity, true] }, null, 5)
  const actual = stringify({ a: 1, b: [null, 't', Infinity, true] }, null, 5)
  assert.is(actual, expected)
  assert.end()
})

test('object with undefined values', function (assert) {
  let obj = { a: 1, c: undefined, b: 'hello' }

  let expected = JSON.stringify(obj)
  let actual = stringify(obj)
  assert.is(actual, expected)

  obj = { b: 'hello', a: undefined, c: 1 }

  expected = JSON.stringify(obj)
  actual = stringify(obj)
  assert.is(actual, expected)

  assert.end()
})

test('undefined values and indented', function (assert) {
  let obj = { a: 1, c: undefined, b: 'hello' }

  let expected = JSON.stringify(obj, null, 2)
  let actual = stringify(obj, null, 2)
  assert.is(actual, expected)

  obj = { b: 'hello', a: undefined, c: 1 }

  expected = JSON.stringify(obj)
  actual = stringify(obj)
  assert.is(actual, expected)

  assert.end()
})
