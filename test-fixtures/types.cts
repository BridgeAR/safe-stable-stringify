import stringify = require('safe-stable-stringify')
import type { Replacer, StringifyOptions } from 'safe-stable-stringify'

const options: StringifyOptions = { deterministic: false }
const replacer: Replacer = ['value']
const result: string | undefined = stringify({ value: 1 })
const alias: string | undefined = stringify.stringify({ result })
stringify.default({ alias })
stringify.configure(options)({ value: 1 }, replacer)

const namespacedOptions: stringify.StringifyOptions = options
const namespacedReplacer: stringify.Replacer = replacer
stringify.configure(namespacedOptions)({ value: 1 }, namespacedReplacer)

const configured = stringify.configure(options)
const configuredResult: string = configured('value')
const omitted: undefined = configured(undefined)
configured({ configuredResult, omitted })

// @ts-expect-error
configured.stringify({ value: 1 })
// @ts-expect-error
configured.default({ value: 1 })
// @ts-expect-error
configured.configure(options)

// @ts-expect-error
stringify.configure({ bigint: 'invalid' })
