declare module 'json5' {
  export const parse: (text: string) => unknown
}

declare module 'ms' {
  const ms: (toParse: string, options?: { long: boolean }) => number
  export default ms
}
declare module 'mathjs' {
  export const evaluate: (expression: string) => number
}
