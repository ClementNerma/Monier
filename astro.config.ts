/** @file https://astro.build/config */

import { defineConfig } from 'astro/config'
import node from '@astrojs/node'
import vue from '@astrojs/vue'
import { map } from './src/common/utils'

export default defineConfig({
	output: 'server',
	adapter: node({
		mode: 'standalone',
	}),
	integrations: [vue()],
	server: {
		port: map(process.env['CURRENT_SERVER_PORT'], parseInt) ?? 7288,
	},
})
