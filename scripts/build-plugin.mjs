#!/usr/bin/env node

/**
 * Build script for the TypeScript Language Service Plugin
 *
 * This script:
 * 1. Compiles the plugin TypeScript code
 * 2. Copies the plugin package.json to dist
 * 3. Creates the plugin entry point at project root
 */

import { execSync } from 'child_process'
import { copyFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

try {
    console.log('🔨 Building TypeScript Language Service Plugin...\n')

    // 1. Compile plugin TypeScript code
    console.log('📦 Compiling plugin...')
    execSync('tsc -p src/LanguageServer/tsconfig.plugin.json', {
        cwd: projectRoot,
        stdio: 'inherit'
    })

    // 2. Copy plugin package.json
    console.log('📄 Copying plugin package.json...')
    copyFileSync(
        resolve(projectRoot, 'src/LanguageServer/plugin/package.json'),
        resolve(projectRoot, 'dist/plugin/package.json')
    )

    // 3. Create plugin entry point
    console.log('🔗 Creating plugin entry point...')
    writeFileSync(
        resolve(projectRoot, 'plugin.js'),
        'module.exports = require("./dist/plugin/index.js")\n'
    )

    console.log('\n✅ Plugin build complete!')
} catch (error) {
    console.error('\n❌ Plugin build failed:', error.message)
    process.exit(1)
}

