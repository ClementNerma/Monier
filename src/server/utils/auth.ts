import type { AstroGlobal } from 'astro'
import { serverApp } from '..'

export async function isLoggedIn(astro: AstroGlobal): Promise<boolean> {
	const app = await serverApp(astro)
	const viewer = await app.auth.viewer()
	return viewer !== null
}
