/**
 * Test de compatibilité de type avec partial séparé
 * L'erreur doit apparaître dans le fichier du partial, pas dans le builder
 */

import { inject, injectable } from 'tsyringe'
import { definePartialConfig } from '@djodjonx/wiredi'

// Interfaces
interface ProductRepositoryInterface {
    findById(id: string): Promise<unknown>
    findAll(): Promise<unknown[]>
}

// Mauvaise implémentation (ne respecte pas l'interface)
@injectable()
class WrongProductRepository {
    // Manque findById et findAll !
    doSomethingElse(): void {
        console.log('wrong')
    }
}

// Tokens
export const TYPE_TEST_TOKENS = {
    ProductRepository: Symbol('ProductRepository'),
} as const

// ❌ ERREUR: WrongProductRepository n'implémente pas ProductRepositoryInterface
// L'erreur devrait apparaître ICI, sur cette ligne
export const badRepositoryPartial = definePartialConfig({
    injections: [
        { token: TYPE_TEST_TOKENS.ProductRepository, provider: WrongProductRepository }, // ❌ Erreur ici!
    ],
    listeners: [],
})

