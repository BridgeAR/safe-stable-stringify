'use strict'

const { hasOwnProperty } = Object.prototype

/** @typedef {{toJSON: (key: string) => unknown}} ToJSON */

// eslint-disable-next-line no-control-regex
const strEscapeSequencesRegExp = /[\u0000-\u001f\u0022\u005c\ud800-\udfff]/
const nodeVersion = typeof process === 'object' ? process?.versions?.node : undefined
const strEscapeLength = Number(nodeVersion?.slice(0, nodeVersion.indexOf('.'))) >= 22 ? 128 : 5000

// Escape C0 control characters, double quotes, the backslash and every code
// unit with a numeric value in the inclusive range 0xD800 to 0xDFFF.
function strEscape (str) {
  // Native escaping is faster for longer strings on Node.js 22 and later.
  if (str.length < strEscapeLength && !strEscapeSequencesRegExp.test(str)) {
    return `"${str}"`
  }
  return JSON.stringify(str)
}

/**
 * @param {string[]} array
 * @param {(a: string, b: string) => number} [comparator]
 */
function sort (array, comparator) {
  // Insertion sort is very efficient for small input sizes, but it has a bad
  // worst case complexity. Thus, use native array sort for bigger values.
  if (array.length > 2e2 || comparator) {
    return array.sort(comparator)
  }
  let moves = 0
  if (array.length > 1 && array[0] > array[1]) {
    const currentValue = array[1]
    if (array.length > 32 && currentValue > array[array.length - 1]) {
      return array.sort()
    }
    array[1] = array[0]
    array[0] = currentValue
    moves = 1
  }
  for (let i = 2; i < array.length; i++) {
    const currentValue = array[i]
    if (array[i - 1] <= currentValue) continue
    let position = i
    do {
      array[position] = array[position - 1]
      position--
    } while (position !== 0 && array[position - 1] > currentValue)
    array[position] = currentValue
    moves += i - position
    if (moves > array.length && moves > 32) return array.sort()
  }
  return array
}

const typedArrayPrototypeGetSymbolToStringTag =
  // @ts-expect-error
  Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(
      Object.getPrototypeOf(
        new Int8Array()
      )
    ),
    Symbol.toStringTag
  ).get

/** @param {object & {length?: unknown}} value */
function getTypedArrayType (value) {
  // @ts-expect-error
  const type = typedArrayPrototypeGetSymbolToStringTag.call(value)
  return type !== undefined && value.length !== 0 ? type : undefined
}

/** @param {number | bigint} value */
function wrapInQuotes (value) {
  return `"${value}"`
}

/**
 * @param {ArrayLike<number | bigint>} array
 * @param {string} separator
 * @param {number} maximumBreadth
 * @param {boolean | 'string'} bigint
 * @param {((value: number | bigint) => string) | undefined} fail
 * @param {string} type
 */
function stringifyTypedArray (array, separator, maximumBreadth, bigint, fail, type) {
  if (array.length < maximumBreadth) {
    maximumBreadth = array.length
  }
  const whitespace = separator === ',' ? '' : ' '
  const bigintDisabled = bigint === false && type[0] === 'B'
  if (type[0] === 'F' || bigintDisabled) {
    if (bigintDisabled && fail === undefined) return ''
    let value = array[0]
    let res = `"0":${whitespace}${Number.isFinite(value) ? value : fail ? fail(value) : 'null'}`
    for (let i = 1; i < maximumBreadth; i++) {
      value = array[i]
      res += `${separator}"${i}":${whitespace}${Number.isFinite(value) ? value : fail ? fail(value) : 'null'}`
    }
    return res
  }
  const method = bigint === 'string' && array.length > 0 && typeof array[0] === 'bigint'
    ? wrapInQuotes
    : String
  let res = `"0":${whitespace}${method(array[0])}`
  for (let i = 1; i < maximumBreadth; i++) {
    res += `${separator}"${i}":${whitespace}${method(array[i])}`
  }
  return res
}

/** @param {number} index */
function stringifyCircularDepth (index) {
  return `"[Circular: ${index}]"`
}

/** @param {Record<string, unknown>} options */
function getCircularValueOption (options) {
  if (hasOwnProperty.call(options, 'circularValue')) {
    const circularValue = options.circularValue
    if (typeof circularValue === 'string') {
      return `"${circularValue}"`
    }
    if (circularValue == null) {
      return circularValue
    }
    if (circularValue === Error || circularValue === TypeError) {
      return {
        toString () {
          throw new TypeError('Converting circular structure to JSON')
        }
      }
    }
    throw new TypeError('The "circularValue" argument must be of type string or the value null or undefined')
  }
  return stringifyCircularDepth
}

function getDeterministicOption (options) {
  let value
  if (hasOwnProperty.call(options, 'deterministic')) {
    value = options.deterministic
    if (typeof value !== 'boolean' && typeof value !== 'function') {
      throw new TypeError('The "deterministic" argument must be of type boolean or comparator function')
    }
  }
  return value === undefined ? true : value
}

function getBigIntOption (options) {
  let value
  if (hasOwnProperty.call(options, 'bigint')) {
    value = options.bigint
    if (typeof value === 'string') {
      if (value !== 'string') {
        throw new TypeError('The "bigint" argument must be of type boolean or the string "string"')
      }
    } else if (typeof value !== 'boolean') {
      throw new TypeError('The "bigint" argument must be of type boolean or the string "string"')
    }
  }
  return value === undefined ? true : value
}

function getBooleanOption (options, key, defaultValue) {
  let value
  if (hasOwnProperty.call(options, key)) {
    value = options[key]
    if (typeof value !== 'boolean') {
      throw new TypeError(`The "${key}" argument must be of type boolean`)
    }
  }
  return value === undefined ? defaultValue : value
}

function getPositiveIntegerOption (options, key) {
  let value
  if (hasOwnProperty.call(options, key)) {
    value = options[key]
    if (typeof value !== 'number') {
      throw new TypeError(`The "${key}" argument must be of type number`)
    }
    if (!Number.isInteger(value)) {
      throw new TypeError(`The "${key}" argument must be an integer`)
    }
    if (value < 1) {
      throw new RangeError(`The "${key}" argument must be >= 1`)
    }
  }
  return value === undefined ? Infinity : value
}

function getItemCount (number) {
  if (number === 1) {
    return '1 item'
  }
  return `${number} items`
}

function getUniqueReplacerSet (replacerArray) {
  const replacerSet = new Set()
  for (const value of replacerArray) {
    if (typeof value === 'string' || typeof value === 'number') {
      replacerSet.add(String(value))
    }
  }
  return replacerSet
}

function getStrictOption (options) {
  if (hasOwnProperty.call(options, 'strict')) {
    const value = options.strict
    if (typeof value !== 'boolean') {
      throw new TypeError('The "strict" argument must be of type boolean')
    }
    if (value) {
      return (value) => {
        let message = `Object can not safely be stringified. Received type ${typeof value}`
        if (typeof value !== 'function') message += ` (${safeErrorMessage(value)})`
        throw new Error(message)
      }
    }
  }
}

function safeErrorMessage (error) {
  try {
    return String(error)
  } catch {
    return 'Failed'
  }
}

function getErrorMessage (error, name) {
  const message = typeof error?.message === 'string'
    ? error.message
    : safeErrorMessage(error)
  if (name) {
    return `Error: Stringification failed with ${name} (${message})`
  }
  return `Error: Stringification failed (${message})`
}

function callSafe (method, thisArg, input) {
  try {
    return method.call(thisArg, input)
  } catch (error) {
    return getErrorMessage(error, method.name)
  }
}

function makeSafe (method, name) {
  const safeMethod = function (...input) {
    try {
      return method(...input)
    } catch (error) {
      if (name !== undefined) {
        return getErrorMessage(error, name)
      }
      return `"${getErrorMessage(error, name)}"`
    }
  }
  Object.defineProperty(safeMethod, 'name', { value: `safe_${method.name}` })
  return safeMethod
}

function configure (options) {
  options = { ...options }
  const fail = getStrictOption(options)
  if (fail) {
    if (options.bigint === undefined) {
      options.bigint = false
    }
    if (!('circularValue' in options)) {
      options.circularValue = Error
    }
  }
  const circularValue = getCircularValueOption(options)
  const bigint = getBigIntOption(options)
  const deterministic = getDeterministicOption(options)
  const comparator = typeof deterministic === 'function' ? deterministic : undefined
  const maximumDepth = getPositiveIntegerOption(options, 'maximumDepth')
  const maximumBreadth = getPositiveIntegerOption(options, 'maximumBreadth')
  const safe = getBooleanOption(options, 'safe', false)
  const failTypedArray = safe && fail ? makeSafe(fail) : fail

  let stringifyFnReplacer = function (key, parent, stack, replacer, spacer, indentation) {
    let value = parent[key]

    if (typeof value === 'object' && value !== null && typeof value.toJSON === 'function') {
      value = safe ? callSafe(value.toJSON, value, key) : value.toJSON(key)
    }
    value = replacer.call(parent, key, value)

    if (typeof value === 'object') {
      if (value === null) {
        return 'null'
      }
      const circularIndex = stack.indexOf(value)
      if (circularIndex !== -1) {
        return typeof circularValue === 'function' ? circularValue(circularIndex) : circularValue
      }

      let res = ''
      let join = ','
      const originalIndentation = indentation

      if (Array.isArray(value)) {
        if (value.length === 0) {
          return '[]'
        }
        if (maximumDepth < stack.length + 1) {
          return '"[Array]"'
        }
        stack.push(value)
        if (spacer !== '') {
          indentation += spacer
          res += `\n${indentation}`
          join = `,\n${indentation}`
        }
        const maximumValuesToStringify = Math.min(value.length, maximumBreadth)
        let i = 0
        for (; i < maximumValuesToStringify - 1; i++) {
          const tmp = stringifyFnReplacer(String(i), value, stack, replacer, spacer, indentation)
          res += tmp !== undefined ? tmp : 'null'
          res += join
        }
        const tmp = stringifyFnReplacer(String(i), value, stack, replacer, spacer, indentation)
        res += tmp !== undefined ? tmp : 'null'
        if (value.length > maximumBreadth) {
          const removedKeys = value.length - maximumBreadth
          res += `${join}"... ${getItemCount(removedKeys)} not stringified"`
        }
        if (spacer !== '') {
          res += `\n${originalIndentation}`
        }
        stack.pop()
        return `[${res}]`
      }

      let keys = Object.keys(value)
      const keyLength = keys.length
      if (keyLength === 0) {
        return '{}'
      }
      if (maximumDepth < stack.length + 1) {
        return '"[Object]"'
      }
      let whitespace = ''
      let separator = ''
      if (spacer !== '') {
        indentation += spacer
        join = `,\n${indentation}`
        whitespace = ' '
      }
      const maximumPropertiesToStringify = Math.min(keyLength, maximumBreadth)
      if (deterministic && getTypedArrayType(value) === undefined) {
        keys = sort(keys, comparator)
      }
      stack.push(value)
      for (let i = 0; i < maximumPropertiesToStringify; i++) {
        const key = keys[i]
        const tmp = stringifyFnReplacer(key, value, stack, replacer, spacer, indentation)
        if (tmp !== undefined) {
          res += `${separator}${strEscape(key)}:${whitespace}${tmp}`
          separator = join
        }
      }
      if (keyLength > maximumBreadth) {
        const removedKeys = keyLength - maximumBreadth
        res += `${separator}"...":${whitespace}"${getItemCount(removedKeys)} not stringified"`
        separator = join
      }
      if (spacer !== '' && separator.length > 1) {
        res = `\n${indentation}${res}\n${originalIndentation}`
      }
      stack.pop()
      return `{${res}}`
    }
    return stringifyFnPrimitive(value)
  }

  /**
   * @param {string | number} key
   * @param {object | null} value
   * @param {object[]} stack
   * @param {Set<string>} replacer
   * @param {string} spacer
   * @param {string} indentation
   */
  let stringifyArrayReplacer = function (key, value, stack, replacer, spacer, indentation) {
    if (value === null) {
      return 'null'
    }
    if (typeof /** @type {ToJSON} */ (value).toJSON === 'function') {
      if (typeof key === 'number') key = String(key)
      const jsonValue = safe ? callSafe(/** @type {ToJSON} */ (value).toJSON, value, key) : /** @type {ToJSON} */ (value).toJSON(key)
      if (typeof jsonValue !== 'object') {
        return stringifyPrimitive(jsonValue)
      }
      if (jsonValue === null) {
        return 'null'
      }
      value = jsonValue
    }
    const circularIndex = stack.indexOf(value)
    if (circularIndex !== -1) {
      return typeof circularValue === 'function' ? circularValue(circularIndex) : circularValue
    }

    const originalIndentation = indentation
    let res = ''
    let join = ','

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '[]'
      }
      if (maximumDepth < stack.length + 1) {
        return '"[Array]"'
      }
      stack.push(value)
      if (spacer !== '') {
        indentation += spacer
        res += `\n${indentation}`
        join = `,\n${indentation}`
      }
      const maximumValuesToStringify = Math.min(value.length, maximumBreadth)
      let i = 0
      for (; i < maximumValuesToStringify - 1; i++) {
        const item = value[i]
        const tmp = typeof item === 'object' ? stringifyArrayReplacer(i, item, stack, replacer, spacer, indentation) : stringifyPrimitive(item)
        res += tmp !== undefined ? tmp : 'null'
        res += join
      }
      const item = value[i]
      const tmp = typeof item === 'object' ? stringifyArrayReplacer(i, item, stack, replacer, spacer, indentation) : stringifyPrimitive(item)
      res += tmp !== undefined ? tmp : 'null'
      if (value.length > maximumBreadth) {
        const removedKeys = value.length - maximumBreadth
        res += `${join}"... ${getItemCount(removedKeys)} not stringified"`
      }
      if (spacer !== '') {
        res += `\n${originalIndentation}`
      }
      stack.pop()
      return `[${res}]`
    }
    if (maximumDepth < stack.length + 1) {
      return '"[Object]"'
    }
    stack.push(value)
    let whitespace = ''
    if (spacer !== '') {
      indentation += spacer
      join = `,\n${indentation}`
      whitespace = ' '
    }
    let separator = ''
    for (const key of replacer) {
      const item = /** @type {Record<string, unknown>} */ (value)[key]
      const tmp = typeof item === 'object' ? stringifyArrayReplacer(key, item, stack, replacer, spacer, indentation) : stringifyPrimitive(item)
      if (tmp !== undefined) {
        res += `${separator}${strEscape(key)}:${whitespace}${tmp}`
        separator = join
      }
    }
    if (spacer !== '' && separator.length > 1) {
      res = `\n${indentation}${res}\n${originalIndentation}`
    }
    stack.pop()
    return `{${res}}`
  }

  /**
   * @param {string | number} key
   * @param {object | null} value
   * @param {object[]} stack
   * @param {string} spacer
   * @param {string} indentation
   */
  let stringifyIndent = function (key, value, stack, spacer, indentation) {
    if (value === null) {
      return 'null'
    }
    if (typeof /** @type {ToJSON} */ (value).toJSON === 'function') {
      if (typeof key === 'number') key = String(key)
      const jsonValue = safe ? callSafe(/** @type {ToJSON} */ (value).toJSON, value, key) : /** @type {ToJSON} */ (value).toJSON(key)
      if (typeof jsonValue !== 'object') {
        return stringifyPrimitive(jsonValue)
      }
      if (jsonValue === null) {
        return 'null'
      }
      value = jsonValue
    }
    const circularIndex = stack.indexOf(value)
    if (circularIndex !== -1) {
      return typeof circularValue === 'function' ? circularValue(circularIndex) : circularValue
    }
    const originalIndentation = indentation

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '[]'
      }
      if (maximumDepth < stack.length + 1) {
        return '"[Array]"'
      }
      stack.push(value)
      indentation += spacer
      let res = `\n${indentation}`
      const join = `,\n${indentation}`
      const maximumValuesToStringify = Math.min(value.length, maximumBreadth)
      let i = 0
      for (; i < maximumValuesToStringify - 1; i++) {
        const item = value[i]
        const tmp = typeof item === 'object' ? stringifyIndent(i, item, stack, spacer, indentation) : stringifyPrimitive(item)
        res += tmp !== undefined ? tmp : 'null'
        res += join
      }
      const item = value[i]
      const tmp = typeof item === 'object' ? stringifyIndent(i, item, stack, spacer, indentation) : stringifyPrimitive(item)
      res += tmp !== undefined ? tmp : 'null'
      if (value.length > maximumBreadth) {
        const removedKeys = value.length - maximumBreadth
        res += `${join}"... ${getItemCount(removedKeys)} not stringified"`
      }
      res += `\n${originalIndentation}`
      stack.pop()
      return `[${res}]`
    }

    let keys = Object.keys(value)
    const keyLength = keys.length
    if (keyLength === 0) {
      return '{}'
    }
    if (maximumDepth < stack.length + 1) {
      return '"[Object]"'
    }
    indentation += spacer
    const join = `,\n${indentation}`
    let res = ''
    let separator = ''
    let maximumPropertiesToStringify = Math.min(keyLength, maximumBreadth)
    const typedArrayType = getTypedArrayType(value)
    if (typedArrayType !== undefined) {
      res += stringifyTypedArray(/** @type {ArrayLike<number | bigint>} */ (value), join, maximumBreadth, bigint, failTypedArray, typedArrayType)
      keys = keys.slice(/** @type {{length: number}} */ (value).length)
      maximumPropertiesToStringify -= /** @type {{length: number}} */ (value).length
      separator = res === '' ? '' : join
    }
    if (deterministic) {
      keys = sort(keys, comparator)
    }
    stack.push(value)
    for (let i = 0; i < maximumPropertiesToStringify; i++) {
      const key = keys[i]
      const item = /** @type {Record<string, unknown>} */ (value)[key]
      const tmp = typeof item === 'object' ? stringifyIndent(key, item, stack, spacer, indentation) : stringifyPrimitive(item)
      if (tmp !== undefined) {
        res += `${separator}${strEscape(key)}: ${tmp}`
        separator = join
      }
    }
    if (keyLength > maximumBreadth) {
      const removedKeys = keyLength - maximumBreadth
      res += `${separator}"...": "${getItemCount(removedKeys)} not stringified"`
      separator = join
    }
    if (separator !== '') {
      res = `\n${indentation}${res}\n${originalIndentation}`
    }
    stack.pop()
    return `{${res}}`
  }

  let stringifyPrimitive = function (value) {
    switch (typeof value) {
      case 'string':
        return strEscape(value)
      case 'number':
        return isFinite(value) ? String(value) : fail ? fail(value) : 'null'
      case 'boolean':
        return value === true ? 'true' : 'false'
      case 'undefined':
        return undefined
      case 'bigint':
        if (bigint) {
          return bigint === 'string' ? `"${value}"` : String(value)
        }
        // fallthrough
      default:
        return fail ? fail(value) : undefined
    }
  }

  let stringifyObject = function (key, value, stack) {
    if (value === null) {
      return 'null'
    }
    if (typeof /** @type {ToJSON} */ (value).toJSON === 'function') {
      if (typeof key === 'number') key = String(key)
      const jsonValue = safe ? callSafe(/** @type {ToJSON} */ (value).toJSON, value, key) : /** @type {ToJSON} */ (value).toJSON(key)
      // Prevent calling `toJSON` again
      if (typeof jsonValue !== 'object') {
        return stringifyPrimitive(jsonValue)
      }
      if (jsonValue === null) {
        return 'null'
      }
      value = jsonValue
    }
    const circularIndex = stack.indexOf(value)
    if (circularIndex !== -1) {
      return typeof circularValue === 'function' ? circularValue(circularIndex) : circularValue
    }

    let res = ''

    const hasLength = /** @type {{length?: unknown}} */ (value).length !== undefined
    if (hasLength && Array.isArray(value)) {
      if (value.length === 0) {
        return '[]'
      }
      if (maximumDepth < stack.length + 1) {
        return '"[Array]"'
      }
      stack.push(value)
      const maximumValuesToStringify = Math.min(value.length, maximumBreadth)
      let i = 0
      for (; i < maximumValuesToStringify - 1; i++) {
        const item = value[i]
        const tmp = typeof item === 'object'
          ? stringifyObject(i, item, stack)
          : stringifyPrimitive(item)
        res += tmp !== undefined ? tmp : 'null'
        res += ','
      }
      const item = value[i]
      const tmp = typeof item === 'object'
        ? stringifyObject(i, item, stack)
        : stringifyPrimitive(item)
      res += tmp !== undefined ? tmp : 'null'
      if (value.length > maximumBreadth) {
        const removedKeys = value.length - maximumBreadth
        res += `,"... ${getItemCount(removedKeys)} not stringified"`
      }
      stack.pop()
      return `[${res}]`
    }

    let keys = Object.keys(value)
    const keyLength = keys.length
    if (keyLength === 0) {
      return '{}'
    }
    if (maximumDepth < stack.length + 1) {
      return '"[Object]"'
    }
    let separator = ''
    let maximumPropertiesToStringify = Math.min(keyLength, maximumBreadth)
    const typedArrayType = hasLength ? getTypedArrayType(value) : undefined
    if (typedArrayType !== undefined) {
      res += stringifyTypedArray(/** @type {ArrayLike<number | bigint>} */ (value), ',', maximumBreadth, bigint, failTypedArray, typedArrayType)
      keys = keys.slice(/** @type {{length: number}} */ (value).length)
      maximumPropertiesToStringify -= /** @type {{length: number}} */ (value).length
      separator = res === '' ? '' : ','
    }
    if (deterministic) {
      keys = sort(keys, comparator)
    }
    stack.push(value)
    for (let i = 0; i < maximumPropertiesToStringify; i++) {
      const key = keys[i]
      const item = /** @type {Record<string, unknown>} */ (value)[key]
      const tmp = typeof item === 'object'
        ? stringifyObject(key, item, stack)
        : stringifyPrimitive(item)
      if (tmp !== undefined) {
        res += `${separator}${strEscape(key)}:${tmp}`
        separator = ','
      }
    }
    if (keyLength > maximumBreadth) {
      const removedKeys = keyLength - maximumBreadth
      res += `${separator}"...":"${getItemCount(removedKeys)} not stringified"`
    }
    stack.pop()
    return `{${res}}`
  }

  const stringifyFnPrimitive = stringifyPrimitive
  if (safe) {
    stringifyFnReplacer = makeSafe(stringifyFnReplacer)
    stringifyArrayReplacer = makeSafe(stringifyArrayReplacer)
    stringifyIndent = makeSafe(stringifyIndent)
    stringifyObject = makeSafe(stringifyObject)
    stringifyPrimitive = makeSafe(stringifyPrimitive)
  }

  function stringify (value, replacer, space) {
    if (arguments.length > 1) {
      let spacer = ''
      if (typeof space === 'number') {
        spacer = ' '.repeat(Math.max(0, Math.min(space, 10)))
      } else if (typeof space === 'string') {
        spacer = space.slice(0, 10)
      }
      if (replacer != null) {
        if (typeof replacer === 'function') {
          if (safe) {
            replacer = makeSafe(replacer, replacer.name)
          }
          return stringifyFnReplacer('', { '': value }, [], replacer, spacer, '')
        }
        if (Array.isArray(replacer)) {
          return typeof value === 'object'
            ? stringifyArrayReplacer('', value, [], getUniqueReplacerSet(replacer), spacer, '')
            : stringifyPrimitive(value)
        }
      }
      if (spacer.length !== 0) {
        return typeof value === 'object'
          ? stringifyIndent('', value, [], spacer, '')
          : stringifyPrimitive(value)
      }
    }
    return typeof value === 'object'
      ? stringifyObject('', value, [])
      : stringifyPrimitive(value)
  }

  return stringify
}

const sharedGlobal = /** @type {Record<symbol, typeof import('./index.js').default | undefined>} */ (
  globalThis
)
const exportSymbol = Symbol.for('safe-stable-stringify@3.0.0')

if (sharedGlobal[exportSymbol] === undefined) {
  const stringify = configure()
  // @ts-expect-error
  stringify.configure = configure
  // @ts-expect-error
  stringify.stringify = stringify
  // @ts-expect-error
  stringify.default = stringify
  Object.defineProperty(sharedGlobal, exportSymbol, {
    configurable: true,
    enumerable: false,
    value: /** @type {typeof import('./index.js').default} */ (stringify),
    writable: true
  })
}
