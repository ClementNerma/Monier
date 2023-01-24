import { createApiClient } from './common/trpc-client'
import { isBrowser } from './common/utils'

export const trpc = createApiClient(isBrowser ? window.location.origin : 'about:blank')
