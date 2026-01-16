/**
 * Builder qui utilise le partial avec l'erreur
 * L'erreur NE DOIT PAS apparaître ici, mais dans badRepository.ts
 */

import { inject, injectable } from 'tsyringe'
import { defineBuilderConfig } from '@djodjonx/wiredi'
import { badRepositoryPartial, TYPE_TEST_TOKENS } from './partials/badRepository'

// Interface attendue
interface ProductRepositoryInterface {
    findById(id: string): Promise<unknown>
    findAll(): Promise<unknown[]>
}

// Service qui utilise le repository
@injectable()
class ProductService {
    constructor(
        @inject(TYPE_TEST_TOKENS.ProductRepository) private repo: ProductRepositoryInterface,
    ) {}
}

// Ce builder utilise le partial avec l'erreur
// L'erreur NE devrait PAS apparaître ici
export const testBuilderConfig = defineBuilderConfig({
    builderId: 'test.type.partial',
    extends: [badRepositoryPartial], // Le partial contient l'erreur
    injections: [
        { token: ProductService },
    ],
    listeners: [],
})

