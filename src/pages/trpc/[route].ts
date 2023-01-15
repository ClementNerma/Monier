import type { APIRoute } from 'astro'
import { requestHandler } from '../../api'

export const all: APIRoute = ({ request }) => requestHandler(request)
