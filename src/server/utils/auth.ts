import type { AstroGlobal } from 'astro'
import { serverApp } from '..'

export async function isLoggedIn(astro: AstroGlobal): Promise<boolean> {
	const viewer = await serverApp(astro).auth.viewer()
	return viewer !== null
}
