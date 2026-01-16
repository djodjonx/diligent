/**
 * Event Dispatcher Provider Module
 *
 * Provides global management of the event dispatcher provider.
 * The event dispatcher is optional - if not configured, event listeners
 * in builder configurations are silently ignored.
 *
 * @module
 */

import type { EventDispatcherProvider } from './types'

export type {
    EventDispatcherProvider,
    EventDispatcherProviderOptions,
    EventToken,
    ListenerToken,
    EventListenerEntry,
} from './types'

export { MutableEventDispatcherProvider } from './MutableEventDispatcherProvider'

/**
 * Currently configured global event dispatcher provider
 * @internal
 */
let globalEventDispatcherProvider: EventDispatcherProvider | null = null

/**
 * Sets the global EventDispatcherProvider instance
 *
 * Call this once at application startup after setting up the container provider.
 * The event dispatcher uses the container provider to resolve listener instances.
 *
 * @param provider - The EventDispatcherProvider implementation to use
 * @throws Error if a provider is already registered
 *
 * @example
 * ```typescript
 * import {
 *     useContainerProvider,
 *     TsyringeProvider,
 *     useEventDispatcherProvider,
 *     MutableEventDispatcherProvider,
 *     getContainerProvider
 * } from '@djodjonx/wiredi'
 *
 * // 1. Setup DI container first
 * useContainerProvider(new TsyringeProvider({ container, Lifecycle }))
 *
 * // 2. Setup event dispatcher (optional)
 * useEventDispatcherProvider(new MutableEventDispatcherProvider({
 *     containerProvider: getContainerProvider()
 * }))
 * ```
 */
export function useEventDispatcherProvider(provider: EventDispatcherProvider): void {
    if (globalEventDispatcherProvider !== null) {
        throw new Error(
            `[EventDispatcher] Provider already registered: "${globalEventDispatcherProvider.name}". ` +
            `Cannot register "${provider.name}". Call resetEventDispatcherProvider() first if you need to change it.`
        )
    }
    globalEventDispatcherProvider = provider
}

/**
 * Retrieves the currently registered EventDispatcherProvider
 *
 * @returns The registered EventDispatcherProvider instance
 * @throws Error if no provider has been registered
 *
 * @example
 * ```typescript
 * const eventDispatcher = getEventDispatcherProvider()
 * eventDispatcher.dispatch(new UserCreatedEvent(user))
 * ```
 */
export function getEventDispatcherProvider(): EventDispatcherProvider {
    if (globalEventDispatcherProvider === null) {
        throw new Error(
            '[EventDispatcher] No provider registered. ' +
            'Call useEventDispatcherProvider() at application startup.'
        )
    }
    return globalEventDispatcherProvider
}

/**
 * Checks if an EventDispatcherProvider has been registered
 *
 * @returns `true` if a provider is registered, `false` otherwise
 *
 * @example
 * ```typescript
 * if (hasEventDispatcherProvider()) {
 *     getEventDispatcherProvider().dispatch(event)
 * }
 * ```
 */
export function hasEventDispatcherProvider(): boolean {
    return globalEventDispatcherProvider !== null
}

/**
 * Resets the global EventDispatcherProvider
 *
 * Clears all registered listeners and removes the provider.
 * Useful for testing or reconfiguration scenarios.
 *
 * ⚠️ WARNING: This should rarely be used in production code.
 *
 * @example
 * ```typescript
 * // In a test file
 * afterEach(() => {
 *     resetEventDispatcherProvider()
 * })
 * ```
 */
export function resetEventDispatcherProvider(): void {
    if (globalEventDispatcherProvider !== null) {
        globalEventDispatcherProvider.clearAllListeners()
    }
    globalEventDispatcherProvider = null
}

