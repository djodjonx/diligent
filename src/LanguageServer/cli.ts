#!/usr/bin/env tsx
/**
 * CLI de test pour le nouveau ValidationEngine avec vérification de types
 */

import * as ts from 'typescript'
import * as path from 'path'

// Import dynamique du ValidationEngine compilé en CommonJS
const { ValidationEngine } = await import('../../dist/plugin/ValidationEngine.js')

const args = process.argv.slice(2)

if (args.length === 0) {
    console.log('Usage: tsx testValidation.ts <files...>')
    process.exit(1)
}

// Résoudre les chemins
const files = args.map(f => path.resolve(f))

// Créer un programme TypeScript
const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.json')
let compilerOptions: ts.CompilerOptions = {}

if (configPath) {
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
    const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configPath))
    compilerOptions = parsed.options
}

const program = ts.createProgram(files, compilerOptions)
const checker = program.getTypeChecker()

// Logger
const logger = (msg: string) => console.log(`[DEBUG] ${msg}`)

// Créer le moteur de validation
const engine = new ValidationEngine(ts, checker, logger)

// Valider
console.log('\n🔍 Test ValidationEngine avec vérification de types\n')

const errors = engine.validate(program)

if (errors.length === 0) {
    console.log('✅ Aucune erreur détectée')
} else {
    console.log(`❌ ${errors.length} erreur(s) détectée(s):\n`)
    for (const error of errors) {
        const pos = error.file.getLineAndCharacterOfPosition(error.start)
        console.log(`${error.file.fileName}:${pos.line + 1}:${pos.character + 1}`)
        console.log(`  start: ${error.start}, length: ${error.length}`)
        console.log(`  ${error.message}\n`)

        if (error.relatedInformation) {
            for (const related of error.relatedInformation) {
                const relPos = related.file.getLineAndCharacterOfPosition(related.start)
                console.log(`  Related: ${related.file.fileName}:${relPos.line + 1}:${relPos.character + 1}`)
                console.log(`    ${related.message}`)
            }
        }
    }
}

