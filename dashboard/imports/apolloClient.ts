import { useMemo } from 'react'
import { ApolloClient, HttpLink, InMemoryCache, type NormalizedCacheObject } from '@apollo/client'
import isEqual from 'lodash/isEqual'
import merge from 'deepmerge'
import config from '../config.json'

export const APOLLO_STATE_PROP_NAME = '__APOLLO_STATE__'

let apolloClient: ApolloClient<NormalizedCacheObject> | undefined

function createApolloClient(): ApolloClient<NormalizedCacheObject> {
  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    link: new HttpLink({
      uri: config.rootUrl + '/api/graphql', // Server URL (must be absolute)
      credentials: 'same-origin', // Additional fetch() options like `credentials` or `headers`
    }),
    cache: new InMemoryCache(),
  })
}

export function initializeApollo(
  initialState: NormalizedCacheObject | null = null,
): ApolloClient<NormalizedCacheObject> {
  const _apolloClient = apolloClient ?? createApolloClient()

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract()

    // Merge the existing cache into data passed from getStaticProps/getServerSideProps
    const data = merge(initialState, existingCache as Partial<InMemoryCache>, {
      // combine arrays using object equality (like in sets)
      arrayMerge: (destinationArray: unknown[], sourceArray: unknown[]) => [
        ...sourceArray,
        ...destinationArray.filter(d => sourceArray.every(s => !isEqual(d, s))),
      ],
    })

    // Restore the cache with the merged data
    _apolloClient.cache.restore(data)
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === 'undefined') return _apolloClient
  // Create the Apollo Client once in the client
  apolloClient ??= _apolloClient

  return _apolloClient
}

export function addApolloState(
  client: ApolloClient<InMemoryCache>,
  pageProps?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (pageProps?.props) {
    ;(pageProps.props as Record<string, unknown>)[APOLLO_STATE_PROP_NAME] = client.cache.extract()
  }
  return pageProps
}

export function useApollo(pageProps: Record<string, unknown>): ApolloClient<NormalizedCacheObject> {
  const state = pageProps[APOLLO_STATE_PROP_NAME] as NormalizedCacheObject | null
  const store = useMemo(() => initializeApollo(state), [state])
  return store
}
