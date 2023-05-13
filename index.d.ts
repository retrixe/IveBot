declare module 'json5' {
  export const parse: (text: string, reviver?: (this: any, key: string, value: any) => any) => any
}

declare module 'ms' {
  export default (toParse: string, options?: { long: boolean }): number => number
}
declare module 'mathjs' {
  export const evaluate: (expression: string) => number
}
