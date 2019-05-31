declare module '*.json'
declare module '*.json5'

declare module 'isomorphic-unfetch' {
  // eslint-disable-next-line no-undef,import/export
  export default fetch
}
declare module 'ms' {
  // eslint-disable-next-line no-undef,import/export
  export default (toParse: string, options?: { long: boolean }): number => number
}
declare module 'mathjs'
declare module 'eris/lib/rest/RequestHandler'
