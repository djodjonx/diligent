import useBuilder, { defineBuilderConfig } from '@djodjonx/wiredi'

// Partials
import { commonServicesPartial } from './partials/commonServices'
import { repositoriesPartial } from './partials/repositories'

// Use Cases
import GetUserByIdUseCase from '../../../Application/UseCase/GetUserByIdUseCase'
import ListProductsUseCase from '../../../Application/UseCase/ListProductsUseCase'
import {TOKENS} from "@/Presentation/builder/myBuilder/tokens";
import InMemoryProductRepository from "@/Infrastructure/Repository/InMemoryProductRepository";

/**
 * Main builder configuration for the application
 *
 * This builder assembles all the dependencies:
 * - Common services (Logger)
 * - Repositories (User, Product)
 * - Use Cases (using class tokens directly)
 */
export const myBuilderConfig = defineBuilderConfig({
    builderId: 'app.myBuilder',
    extends: [
        commonServicesPartial,
        repositoriesPartial,
    ],
    injections: [
        // Use Cases - using class as token directly
        { token: GetUserByIdUseCase },
        { token: ListProductsUseCase },

    ],
    listeners: [],
})


/**
 * Composable to use the builder
 * Returns a type-safe resolve function
 */
export function useMyBuilder() {
    return useBuilder(myBuilderConfig)
}

