import type { APIRoute } from 'astro'
import { requestHandler } from '../../server'

export const all: APIRoute = ({ request }) => requestHandler(request)
