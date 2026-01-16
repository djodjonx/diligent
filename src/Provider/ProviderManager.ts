/**
 * Global Provider Manager for WireDI
 *
 * Manages the global DI container provider instance.
 * The provider should be configured once at application startup
 * before any calls to `useBuilder`.
 *
 * @module
 */

import type { ContainerProvider } from './types'

/**
 * Currently configured global provider
 * @internal
 */
let currentProvider: ContainerProvider | null = null

/**
 * Configures the DI container provider to use globally
 *
 * Must be called ONCE at the application entry point,
 * before any calls to `useBuilder`.
 *
 * @param provider - The provider instance to use
 * @throws Error if a provider is already configured
 *
 * @example
 * ```typescript
 * // main.ts - Application entry point
 * import 'reflect-metadata'
 * import { container, Lifecycle } from 'tsyringe'
 * import { useContainerProvider, TsyringeProvider } from '@djodjonx/wiredi'
 *
 * useContainerProvider(new TsyringeProvider({ container, Lifecycle }))
 *
 * // Now useBuilder can be used anywhere
 * ```
 */
export function useContainerProvider(provider: ContainerProvider): void {
    if (currentProvider !== null) {
        throw new Error(
            `[WireDI] Provider already configured (${currentProvider.name}). ` +
            `useContainerProvider() should only be called once at app entry point. ` +
            `Use resetContainerProvider() first if you need to reconfigure.`
        )
    }
    currentProvider = provider
}

/**
 * Retrieves the configured container provider
 *
 * @returns The configured provider instance
 * @throws Error if no provider is configured
 *
 * @example
 * ```typescript
 * const provider = getContainerProvider()
 * const service = provider.resolve(MyService)
 * ```
 */
export function getContainerProvider(): ContainerProvider {
    if (currentProvider === null) {
        throw new Error(
            '[WireDI] No container provider configured. ' +
            'Call useContainerProvider(provider) at your app entry point before using useBuilder. ' +
            'Example: useContainerProvider(new TsyringeProvider({ container, Lifecycle }))'
        )
    }
    return currentProvider
}

/**
 * Checks if a provider is currently configured
 *
 * @returns `true` if a provider is configured, `false` otherwise
 *
 * @example
 * ```typescript
 * if (!hasContainerProvider()) {
 *     useContainerProvider(new TsyringeProvider({ container, Lifecycle }))
 * }
 * ```
 */
export function hasContainerProvider(): boolean {
    return currentProvider !== null
}

/**
 * Resets the global provider (primarily for testing)
 *
 * ⚠️ WARNING: Do not use in production, only for testing purposes
 *
 * @example
 * ```typescript
 * // In a test file
 * beforeEach(() => {
 *     resetContainerProvider()
 *     useContainerProvider(new TsyringeProvider({ container, Lifecycle }))
 * })
 * ```
 */
export function resetContainerProvider(): void {
    if (currentProvider !== null) {
        try {
            currentProvider.dispose()
        } catch {
            // Ignore dispose errors during reset
        }
    }
    currentProvider = null
}

