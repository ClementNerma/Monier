import type { APIRoute } from 'astro'
import { requestHandler } from '../api'

export const post: APIRoute = ({ request }) => requestHandler(request)
