declare function stringify(value: any, replacer?: (key: string, value: any) => any, space?: string | number): string;
declare function stringify(value: any, replacer?: (number | string)[] | null, space?: string | number): string;

export interface StringifyOptions {
  bigint?: boolean,
  circularValue?: string | null,
  deterministic?: boolean,
}

declare function configure(StringifyOptions): stringify;

stringify.configure = configure;

export default stringify;
