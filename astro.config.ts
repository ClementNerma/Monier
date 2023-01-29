/** @file https://astro.build/config */

import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import { map } from './src/common/utils';
import tailwind from '@astrojs/tailwind';
import deno from "@astrojs/deno";

export default defineConfig({
  output: 'server',
  adapter: deno(),
  integrations: [vue(), tailwind()],
  server: {
    port: map(process.env['CURRENT_SERVER_PORT'], parseInt) ?? 7288
  }
});
