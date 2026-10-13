interface StringifyFunction {
  (value: undefined | symbol | ((...args: unknown[]) => unknown), replacer?: stringify.Replacer, space?: string | number): undefined
  (value: string | number | unknown[] | null | boolean | object, replacer?: stringify.Replacer, space?: string | number): string
  (value: unknown, replacer?: ((key: string, value: unknown) => unknown) | (number | string)[] | null | undefined, space?: string | number): string | undefined
}

declare const stringify: StringifyFunction & {
  configure(options: stringify.StringifyOptions): StringifyFunction
  stringify: typeof stringify
  default: typeof stringify
}

declare namespace stringify {
  export type Replacer = (number | string)[] | null | undefined | ((key: string, value: unknown) => string | number | boolean | null | object)

  export interface StringifyOptions {
    bigint?: boolean | 'string',
    /** Defaults to '[Circular: N]', where N is the ancestor depth, starting at 0 for the root. */
    circularValue?: string | null | TypeErrorConstructor | ErrorConstructor,
    deterministic?: boolean | ((a: string, b: string) => number),
    maximumBreadth?: number,
    maximumDepth?: number,
    strict?: boolean,
    safe?: boolean,
  }
}

export = stringify
