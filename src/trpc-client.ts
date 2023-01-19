import { createApiClient } from './common/trpc-client'

export const trpc = createApiClient(window.location.origin)
