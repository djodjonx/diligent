import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: {
        resolver: 'tsc',
    },
    clean: true,
    sourcemap: true,
    outDir: 'dist',
    platform: 'node',
    target: 'node18',
    treeshake: true,
    minify: false,
})

