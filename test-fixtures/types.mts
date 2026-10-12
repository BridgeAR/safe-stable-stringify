import stringify, { configure, stringify as named, type Replacer, type StringifyOptions } from 'safe-stable-stringify'

const options: StringifyOptions = { deterministic: false }
const replacer: Replacer = ['value']
const result: string | undefined = stringify({ value: 1 })
const alias: string | undefined = named({ result })
configure(options)({ alias }, replacer)

const configured = configure(options)
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
configure({ bigint: 'invalid' })
