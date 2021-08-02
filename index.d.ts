declare module '*config.json5' {
  export const weatherAPIkey: string
  export const fixerAPIkey: string
  export const cvAPIkey: string
  export const host: string
  export const NASAtoken: string
  export const oxfordAPI: { appKey: string, appId: string }
  export const testPilots: string[]
  export const mongoURL: string
  export const rootURL: string
  export const token: string
  export default {
    weatherAPIkey, fixerAPIkey, cvAPIkey, host, NASAtoken, oxfordAPI, testPilots, mongoURL, rootURL, token
  }
}

declare module 'ms' {
  export default (toParse: string, options?: { long: boolean }): number => number
}
declare module 'mathjs' {
  export const evaluate: (expression: string) => number
}
declare module 'eris/lib/rest/RequestHandler'
