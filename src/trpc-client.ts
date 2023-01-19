import { createApiClient } from './server'

export const trpc = createApiClient(window.location.origin)
