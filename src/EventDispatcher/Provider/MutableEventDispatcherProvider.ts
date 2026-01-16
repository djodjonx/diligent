/**
 * Mutable Event Dispatcher Provider
 *
 * Default implementation of EventDispatcherProvider that stores
 * listeners in memory and resolves them through the DI container.
 *
 * @module
 */

import type {
    EventDispatcherProvider,
    EventDispatcherProviderOptions,
    EventToken,
    ListenerToken,
} from './types'
import type { ContainerProvider } from '../../Provider'

/**
 * Default EventDispatcherProvider implementation
 *
 * This provider stores listeners in memory and resolves them through the DI container
 * when dispatching events. Each listener must implement an `onEvent(event)` method.
 *
 * @example Basic usage
 * ```typescript
 * import {
 *     MutableEventDispatcherProvider,
 *     useEventDispatcherProvider,
 *     getContainerProvider
 * } from '@djodjonx/wiredi'
 *
 * const eventProvider = new MutableEventDispatcherProvider({
 *     containerProvider: getContainerProvider()
 * })
 * useEventDispatcherProvider(eventProvider)
 * ```
 *
 * @example Dispatching events
 * ```typescript
 * const dispatcher = getEventDispatcherProvider()
 * dispatcher.dispatch(new UserCreatedEvent(user))
 * ```
 */
export class MutableEventDispatcherProvider implements EventDispatcherProvider {
    /** @inheritdoc */
    readonly name = 'mutable-event-dispatcher'

    /** Map of event names to their registered listener tokens */
    private listeners: Map<string, ListenerToken[]> = new Map()

    /** DI container provider for resolving listener instances */
    private containerProvider: ContainerProvider

    /**
     * Creates a new MutableEventDispatcherProvider instance
     *
     * @param options - Configuration options including the container provider
     */
    constructor(options: EventDispatcherProviderOptions) {
        this.containerProvider = options.containerProvider
    }

    /**
     * Extracts the event name from an event token (class constructor)
     * @internal
     */
    private getEventName(eventToken: EventToken): string {
        return eventToken.name
    }

    /**
     * Extracts the event name from an event instance
     * @internal
     */
    private getEventNameFromInstance(event: object): string {
        return event.constructor.name
    }

    /** @inheritdoc */
    register(eventToken: EventToken, listenerToken: ListenerToken): void {
        const eventName = this.getEventName(eventToken)

        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, [])
        }

        this.listeners.get(eventName)!.push(listenerToken)
    }

    /** @inheritdoc */
    dispatch(event: object): void {
        const eventName = this.getEventNameFromInstance(event)
        const listenerTokens = this.listeners.get(eventName) ?? []

        for (const listenerToken of listenerTokens) {
            try {
                const listener = this.containerProvider.resolve<{ onEvent(event: object): void }>(listenerToken)
                listener.onEvent(event)
            } catch (error: any) {
                console.error(
                    `[MutableEventDispatcherProvider] Error dispatching event "${eventName}":`,
                    error.stack || error.message
                )
                throw error
            }
        }
    }

    /** @inheritdoc */
    hasListeners(eventToken: EventToken): boolean {
        const eventName = this.getEventName(eventToken)
        const listeners = this.listeners.get(eventName)
        return listeners !== undefined && listeners.length > 0
    }

    /** @inheritdoc */
    clearListeners(eventToken: EventToken): void {
        const eventName = this.getEventName(eventToken)
        this.listeners.delete(eventName)
    }

    /** @inheritdoc */
    clearAllListeners(): void {
        this.listeners.clear()
    }

    /**
     * Returns the internal listeners map
     * @returns Map of event names to listener tokens
     */
    getUnderlyingDispatcher(): Map<string, ListenerToken[]> {
        return this.listeners
    }
}

