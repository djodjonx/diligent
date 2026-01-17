/**
 * Event Dispatcher Provider Types
 *
 * Defines the interfaces and types for the event dispatching system.
 * This abstraction allows plugging different event dispatching implementations.
 *
 * @module
 */

import type { ContainerProvider } from '../../Provider'

/**
 * Token representing an event type (class constructor)
 * Events are identified by their class constructor
 */
export type EventToken = new (...args: any[]) => any

/**
 * Token representing a listener (class constructor or symbol)
 * Listeners can be registered as classes or symbol tokens
 */
export type ListenerToken = (new (...args: any[]) => any) | symbol

/**
 * Configuration entry for registering a listener to an event
 *
 * @example
 * ```typescript
 * const entry: EventListenerEntry = {
 *     event: UserCreatedEvent,
 *     listener: SendWelcomeEmailListener
 * }
 * ```
 */
export interface EventListenerEntry {
    /** The event class to listen for */
    event: EventToken
    /** The listener class or token to invoke */
    listener: ListenerToken
}

/**
 * Interface for Event Dispatcher Provider
 *
 * This abstraction allows plugging different event dispatching systems
 * (e.g., custom implementation, EventEmitter, RxJS, etc.)
 *
 * @example
 * ```typescript
 * // Create and register provider at app startup
 * const eventProvider = new MutableEventDispatcherProvider({
 *     containerProvider: getContainerProvider()
 * })
 * useEventDispatcherProvider(eventProvider)
 *
 * // Later, dispatch events
 * const dispatcher = getEventDispatcherProvider()
 * dispatcher.dispatch(new UserCreatedEvent(user))
 * ```
 */
export interface EventDispatcherProvider {
    /**
     * Unique name identifying this provider implementation
     * Used for debugging and logging purposes
     */
    readonly name: string

    /**
     * Registers a listener for a specific event type
     *
     * @param eventToken - The event class/constructor to listen for
     * @param listenerToken - The listener class/symbol to invoke when event is dispatched
     *
     * @example
     * ```typescript
     * provider.register(UserCreatedEvent, SendWelcomeEmailListener)
     * ```
     */
    register(eventToken: EventToken, listenerToken: ListenerToken): void

    /**
     * Dispatches an event to all registered listeners
     * Listeners are resolved from the DI container and their `onEvent` method is called
     *
     * @param event - The event instance to dispatch
     *
     * @example
     * ```typescript
     * provider.dispatch(new UserCreatedEvent(user))
     * ```
     */
    dispatch(event: object): void

    /**
     * Checks if any listeners are registered for an event type
     *
     * @param eventToken - The event class/constructor to check
     * @returns `true` if at least one listener is registered
     */
    hasListeners(eventToken: EventToken): boolean

    /**
     * Checks if a specific listener is registered for an event type
     *
     * @param eventToken - The event class/constructor
     * @param listenerToken - The listener class/symbol
     * @returns `true` if the listener is already registered
     */
    hasListener(eventToken: EventToken, listenerToken: ListenerToken): boolean

    /**
     * Removes all listeners for a specific event type
     *
     * @param eventToken - The event class/constructor to clear
     */
    clearListeners(eventToken: EventToken): void

    /**
     * Removes all registered listeners from all events
     */
    clearAllListeners(): void

    /**
     * Returns the underlying event dispatcher implementation
     * Useful for advanced use cases or testing
     *
     * @returns The internal data structure (implementation-specific)
     */
    getUnderlyingDispatcher(): unknown
}

/**
 * Configuration options for creating an EventDispatcherProvider
 */
export interface EventDispatcherProviderOptions {
    /**
     * The DI container provider used to resolve listener instances
     * Listeners are resolved from this container when events are dispatched
     */
    containerProvider: ContainerProvider
}

