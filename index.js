'use strict'

const stringify = main()
stringify.configure = main
stringify.default = stringify

module.exports = stringify

// eslint-disable-next-line
const strEscapeSequencesRegExp = /[\x00-\x1f\x22\x5c]/
// eslint-disable-next-line
const strEscapeSequencesReplacer = /[\x00-\x1f\x22\x5c]/g

// Escaped special characters. Use empty strings to fill up unused entries.
const meta = [
  '\\u0000', '\\u0001', '\\u0002', '\\u0003', '\\u0004',
  '\\u0005', '\\u0006', '\\u0007', '\\b', '\\t',
  '\\n', '\\u000b', '\\f', '\\r', '\\u000e',
  '\\u000f', '\\u0010', '\\u0011', '\\u0012', '\\u0013',
  '\\u0014', '\\u0015', '\\u0016', '\\u0017', '\\u0018',
  '\\u0019', '\\u001a', '\\u001b', '\\u001c', '\\u001d',
  '\\u001e', '\\u001f', '', '', '\\"',
  '', '', '', '', '', '', '', '', '', '',
  '', '', '', '', '', '', '', '', '', '',
  '', '', '', '', '', '', '', '', '', '',
  '', '', '', '', '', '', '', '', '', '',
  '', '', '', '', '', '', '', '', '', '',
  '', '', '', '', '', '', '', '\\\\'
]

function escapeFn (str) {
  return meta[str.charCodeAt(0)]
}

// Escape control characters, double quotes and the backslash.
// Note: it is faster to run this only once for a big string instead of only for
// the parts that it is necessary for. But this is only true if we do not add
// extra indentation to the string before.
function strEscape (str) {
  // Some magic numbers that worked out fine while benchmarking with v8 8.0
  if (str.length < 5000 && !strEscapeSequencesRegExp.test(str)) {
    return str
  }
  if (str.length > 100) {
    return str.replace(strEscapeSequencesReplacer, escapeFn)
  }
  let result = ''
  let last = 0
  let i = 0
  for (; i < str.length; i++) {
    const point = str.charCodeAt(i)
    if (point === 34 || point === 92 || point < 32) {
      if (last === i) {
        result += meta[point]
      } else {
        result += `${str.slice(last, i)}${meta[point]}`
      }
      last = i + 1
    }
  }
  if (last === 0) {
    result = str
  } else if (last !== i) {
    result += str.slice(last)
  }
  return result
}

function insertSort (array) {
  // Insertion sort is very efficient for small input sizes but it has a bad
  // worst case complexity. Thus, use native array sort for bigger values.
  if (array.length > 2e2) {
    return array.sort()
  }
  for (let i = 1; i < array.length; i++) {
    const currentValue = array[i]
    let position = i
    while (position !== 0 && array[position - 1] > currentValue) {
      array[position] = array[position - 1]
      position--
    }
    array[position] = currentValue
  }
  return array
}

const typedArrayPrototypeGetSymbolToStringTag =
  Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(
      Object.getPrototypeOf(
        new Uint8Array()
      )
    ),
    Symbol.toStringTag
  ).get

function isTypedArray (value) {
  return typedArrayPrototypeGetSymbolToStringTag.call(value) !== undefined
}

function stringifyTypedArray (array, separator) {
  if (array.length === 0) {
    return ''
  }
  const whitespace = separator === ',' ? '' : ' '
  let res = `"0":${whitespace}${array[0]}`
  for (let i = 1; i < array.length; i++) {
    res += `${separator}"${i}":${whitespace}${array[i]}`
  }
  return res
}

function getCircularValueOption (options) {
  if (options && Object.prototype.hasOwnProperty.call(options, 'circularValue')) {
    var circularValue = options.circularValue
    if (typeof circularValue === 'string') {
      circularValue = `"${circularValue}"`
    } else if (circularValue !== null) {
      throw new TypeError('The "circularValue" argument must be of type string or the value null')
    }
  }
  return circularValue === undefined ? '"[Circular]"' : circularValue
}

function getBigIntOption (options) {
  if (options && Object.prototype.hasOwnProperty.call(options, 'bigint')) {
    var bigint = options.bigint
    if (typeof bigint !== 'boolean') {
      throw new TypeError('The "bigint" argument must be of type boolean')
    }
  }
  return bigint === undefined ? true : bigint
}

function getDeterministicOption (options) {
  if (options && Object.prototype.hasOwnProperty.call(options, 'deterministic')) {
    var deterministic = options.deterministic
    if (typeof deterministic !== 'boolean') {
      throw new TypeError('The "deterministic" argument must be of type boolean')
    }
  }
  return deterministic === undefined ? true : deterministic
}

function main (options) {
  const circularValue = getCircularValueOption(options)
  const bigint = getBigIntOption(options)
  const deterministic = getDeterministicOption(options)

  // Full version: supports all options
  function stringifyFullFn (key, parent, stack, replacer, spacer, indentation) {
    let value = parent[key]

    if (typeof value === 'object' && value !== null && typeof value.toJSON === 'function') {
      value = value.toJSON(key)
    }
    value = replacer.call(parent, key, value)

    switch (typeof value) {
      case 'string':
        return `"${strEscape(value)}"`
      case 'object': {
        if (value === null) {
          return 'null'
        }
        if (stack.indexOf(value) !== -1) {
          return circularValue
        }

        let res = ''
        let join = ','
        const originalIndentation = indentation

        if (Array.isArray(value)) {
          if (value.length === 0) {
            return '[]'
          }
          stack.push(value)
          if (spacer !== '') {
            indentation += spacer
            res += `\n${indentation}`
            join = `,\n${indentation}`
          }
          let i = 0
          for (; i < value.length - 1; i++) {
            const tmp = stringifyFullFn(i, value, stack, replacer, spacer, indentation)
            res += tmp !== undefined ? tmp : 'null'
            res += join
          }
          const tmp = stringifyFullFn(i, value, stack, replacer, spacer, indentation)
          res += tmp !== undefined ? tmp : 'null'
          if (spacer !== '') {
            res += `\n${originalIndentation}`
          }
          stack.pop()
          return `[${res}]`
        }

        let keys = Object.keys(value)
        if (keys.length === 0) {
          return '{}'
        }
        let whitespace = ''
        let separator = ''
        if (spacer !== '') {
          indentation += spacer
          join = `,\n${indentation}`
          whitespace = ' '
        }
        if (isTypedArray(value)) {
          res += stringifyTypedArray(value, join)
          keys = keys.slice(value.length)
          separator = join
        }
        if (deterministic) {
          keys = insertSort(keys)
        }
        stack.push(value)
        for (const key of keys) {
          const tmp = stringifyFullFn(key, value, stack, replacer, spacer, indentation)
          if (tmp !== undefined) {
            res += `${separator}"${strEscape(key)}":${whitespace}${tmp}`
            separator = join
          }
        }
        if (spacer !== '' && separator.length > 1) {
          res = `\n${indentation}${res}\n${originalIndentation}`
        }
        stack.pop()
        return `{${res}}`
      }
      case 'number':
        return isFinite(value) ? String(value) : 'null'
      case 'boolean':
        return value === true ? 'true' : 'false'
      case 'bigint':
        return bigint ? String(value) : undefined
    }
  }

  function stringifyFullArr (key, value, stack, replacer, spacer, indentation) {
    if (typeof value === 'object' && value !== null && typeof value.toJSON === 'function') {
      value = value.toJSON(key)
    }

    switch (typeof value) {
      case 'string':
        return `"${strEscape(value)}"`
      case 'object': {
        if (value === null) {
          return 'null'
        }
        if (stack.indexOf(value) !== -1) {
          return circularValue
        }

        const originalIndentation = indentation
        let res = ''
        let join = ','

        if (Array.isArray(value)) {
          if (value.length === 0) {
            return '[]'
          }
          stack.push(value)
          if (spacer !== '') {
            indentation += spacer
            res += `\n${indentation}`
            join = `,\n${indentation}`
          }
          let i = 0
          for (; i < value.length - 1; i++) {
            const tmp = stringifyFullArr(i, value[i], stack, replacer, spacer, indentation)
            res += tmp !== undefined ? tmp : 'null'
            res += join
          }
          const tmp = stringifyFullArr(i, value[i], stack, replacer, spacer, indentation)
          res += tmp !== undefined ? tmp : 'null'
          if (spacer !== '') {
            res += `\n${originalIndentation}`
          }
          stack.pop()
          return `[${res}]`
        }

        if (replacer.length === 0) {
          return '{}'
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
          if (typeof key === 'string' || typeof key === 'number') {
            const tmp = stringifyFullArr(key, value[key], stack, replacer, spacer, indentation)
            if (tmp !== undefined) {
              res += `${separator}"${strEscape(key)}":${whitespace}${tmp}`
              separator = join
            }
          }
        }
        if (spacer !== '' && separator.length > 1) {
          res = `\n${indentation}${res}\n${originalIndentation}`
        }
        stack.pop()
        return `{${res}}`
      }
      case 'number':
        return isFinite(value) ? String(value) : 'null'
      case 'boolean':
        return value === true ? 'true' : 'false'
      case 'bigint':
        return bigint ? String(value) : undefined
    }
  }

  // Supports only the spacer option
  function stringifyIndent (key, value, stack, spacer, indentation) {
    switch (typeof value) {
      case 'string':
        return `"${strEscape(value)}"`
      case 'object': {
        if (value === null) {
          return 'null'
        }
        if (typeof value.toJSON === 'function') {
          value = value.toJSON(key)
          // Prevent calling `toJSON` again.
          if (typeof value !== 'object') {
            return stringifyIndent(key, value, stack, spacer, indentation)
          }
          if (value === null) {
            return 'null'
          }
        }
        if (stack.indexOf(value) !== -1) {
          return circularValue
        }
        const originalIndentation = indentation

        if (Array.isArray(value)) {
          if (value.length === 0) {
            return '[]'
          }
          stack.push(value)
          indentation += spacer
          let res = `\n${indentation}`
          const join = `,\n${indentation}`
          let i = 0
          for (; i < value.length - 1; i++) {
            const tmp = stringifyIndent(i, value[i], stack, spacer, indentation)
            res += tmp !== undefined ? tmp : 'null'
            res += join
          }
          const tmp = stringifyIndent(i, value[i], stack, spacer, indentation)
          res += tmp !== undefined ? tmp : 'null'
          res += `\n${originalIndentation}`
          stack.pop()
          return `[${res}]`
        }

        let keys = Object.keys(value)
        if (keys.length === 0) {
          return '{}'
        }
        indentation += spacer
        const join = `,\n${indentation}`
        let res = ''
        let separator = ''
        if (isTypedArray(value)) {
          res += stringifyTypedArray(value, join)
          keys = keys.slice(value.length)
          separator = join
        }
        if (deterministic) {
          keys = insertSort(keys)
        }
        stack.push(value)
        for (const key of keys) {
          const tmp = stringifyIndent(key, value[key], stack, spacer, indentation)
          if (tmp !== undefined) {
            res += `${separator}"${strEscape(key)}": ${tmp}`
            separator = join
          }
        }
        if (separator !== '') {
          res = `\n${indentation}${res}\n${originalIndentation}`
        }
        stack.pop()
        return `{${res}}`
      }
      case 'number':
        return isFinite(value) ? String(value) : 'null'
      case 'boolean':
        return value === true ? 'true' : 'false'
      case 'bigint':
        return bigint ? String(value) : undefined
    }
  }

  // Simple without any options
  function stringifySimple (key, value, stack) {
    switch (typeof value) {
      case 'string':
        return `"${strEscape(value)}"`
      case 'object': {
        if (value === null) {
          return 'null'
        }
        if (typeof value.toJSON === 'function') {
          value = value.toJSON(key)
          // Prevent calling `toJSON` again
          if (typeof value !== 'object') {
            return stringifySimple(key, value, stack)
          }
          if (value === null) {
            return 'null'
          }
        }
        if (stack.indexOf(value) !== -1) {
          return circularValue
        }

        let res = ''

        if (Array.isArray(value)) {
          if (value.length === 0) {
            return '[]'
          }
          stack.push(value)
          let i = 0
          for (; i < value.length - 1; i++) {
            const tmp = stringifySimple(i, value[i], stack)
            res += tmp !== undefined ? tmp : 'null'
            res += ','
          }
          const tmp = stringifySimple(i, value[i], stack)
          res += tmp !== undefined ? tmp : 'null'
          stack.pop()
          return `[${res}]`
        }

        let keys = Object.keys(value)
        if (keys.length === 0) {
          return '{}'
        }
        let separator = ''
        if (isTypedArray(value)) {
          res += stringifyTypedArray(value, ',')
          keys = keys.slice(value.length)
        }
        if (deterministic) {
          keys = insertSort(keys)
        }
        stack.push(value)
        for (const key of keys) {
          const tmp = stringifySimple(key, value[key], stack)
          if (tmp !== undefined) {
            res += `${separator}"${strEscape(key)}":${tmp}`
            separator = ','
          }
        }
        stack.pop()
        return `{${res}}`
      }
      case 'number':
        return isFinite(value) ? String(value) : 'null'
      case 'boolean':
        return value === true ? 'true' : 'false'
      case 'bigint':
        return bigint ? String(value) : undefined
    }
  }

  function stringify (value, replacer, space) {
    if (arguments.length > 1) {
      let spacer = ''
      if (typeof space === 'number') {
        spacer = ' '.repeat(space)
      } else if (typeof space === 'string') {
        spacer = space
      }
      if (replacer != null) {
        if (typeof replacer === 'function') {
          return stringifyFullFn('', { '': value }, [], replacer, spacer, '')
        }
        if (Array.isArray(replacer)) {
          return stringifyFullArr('', value, [], replacer, spacer, '')
        }
      }
      if (spacer !== '') {
        return stringifyIndent('', value, [], spacer, '')
      }
    }
    return stringifySimple('', value, [])
  }

  return stringify
}
