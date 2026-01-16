/**
 * Test de compatibilité de type
 * Ce fichier devrait générer une erreur car ConsoleLogger n'implémente pas ProductRepositoryInterface
 */

import { inject, injectable } from 'tsyringe'
import { defineBuilderConfig, definePartialConfig } from '@djodjonx/wiredi'

// Interfaces
interface ProductRepositoryInterface {
    findById(id: string): Promise<unknown>
    findAll(): Promise<unknown[]>
}

interface LoggerInterface {
    info(message: string): void
}

// Implementations
@injectable()
class ConsoleLogger implements LoggerInterface {
    info(message: string): void {
        console.log(message)
    }
}

// Tokens
const TOKENS = {
    ProductRepository: Symbol('ProductRepository'),
    Logger: Symbol('Logger'),
} as const

// Service qui dépend du ProductRepository
@injectable()
class ProductService {
    constructor(
        @inject(TOKENS.ProductRepository) private repo: ProductRepositoryInterface,
        @inject(TOKENS.Logger) private logger: LoggerInterface,
    ) {}
}

// ❌ ERREUR: ConsoleLogger est passé comme ProductRepository mais n'implémente pas ProductRepositoryInterface
export const badConfig = defineBuilderConfig({
    builderId: 'test.type.mismatch',
    extends: [],
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger }, // ✅ OK
        { token: TOKENS.ProductRepository, provider: ConsoleLogger }, // ❌ Type mismatch!
        { token: ProductService },
    ],
    listeners: [],
})

