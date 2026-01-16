/**
 * Example: Node.js EventEmitter Event Dispatcher Provider
 *
 * This example shows how to implement an EventDispatcherProvider using
 * Node.js built-in EventEmitter for simple event handling.
 *
 * @see https://nodejs.org/api/events.html
 */

import { EventEmitter } from 'events'
import type {
    EventDispatcherProvider,
    EventDispatcherProviderOptions,
    EventToken,
    ListenerToken,
} from '@djodjonx/diligent'
import type { ContainerProvider } from '@djodjonx/diligent'

/**
 * Configuration options for EventEmitterDispatcherProvider
 */
export interface EventEmitterDispatcherOptions extends EventDispatcherProviderOptions {
    /**
     * Maximum number of listeners per event
     * @default 10
     */
    maxListeners?: number

    /**
     * Capture rejections and emit 'error' event
     * @default true
     */
    captureRejections?: boolean
}

/**
 * EventEmitter-based Event Dispatcher Provider
 *
 * Uses Node.js EventEmitter for lightweight event dispatching.
 * Suitable for Node.js backend applications.
 *
 * @example
 * ```typescript
 * import { EventEmitterDispatcherProvider } from './EventEmitterDispatcherProvider'
 * import { useEventDispatcherProvider, getContainerProvider } from '@djodjonx/diligent'
 *
 * const eventProvider = new EventEmitterDispatcherProvider({
 *     containerProvider: getContainerProvider(),
 *     maxListeners: 20
 * })
 * useEventDispatcherProvider(eventProvider)
 * ```
 */
export class EventEmitterDispatcherProvider implements EventDispatcherProvider {
    readonly name = 'eventemitter-dispatcher'

    private emitter: EventEmitter
    private listeners = new Map<string, ListenerToken[]>()
    private containerProvider: ContainerProvider

    constructor(options: EventEmitterDispatcherOptions) {
        this.containerProvider = options.containerProvider

        this.emitter = new EventEmitter({
            captureRejections: options.captureRejections ?? true
        })

        if (options.maxListeners) {
            this.emitter.setMaxListeners(options.maxListeners)
        }

        // Handle async errors
        this.emitter.on('error', (error) => {
            console.error('[EventEmitterDispatcherProvider] Error:', error)
        })
    }

    register(eventToken: EventToken, listenerToken: ListenerToken): void {
        const eventName = eventToken.name

        // Store listener reference
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, [])
        }
        this.listeners.get(eventName)!.push(listenerToken)

        // Create EventEmitter listener
        const handler = (event: any) => {
            try {
                const listener = this.containerProvider.resolve<{ onEvent(event: any): void | Promise<void> }>(listenerToken)
                const result = listener.onEvent(event)

                // Handle async listeners
                if (result && typeof result === 'object' && 'then' in result) {
                    (result as Promise<void>).catch(error => {
                        console.error(
                            `[EventEmitterDispatcherProvider] Async error in listener for "${eventName}":`,
                            error
                        )
                    })
                }
            } catch (error: any) {
                console.error(
                    `[EventEmitterDispatcherProvider] Error in listener for "${eventName}":`,
                    error.stack || error.message
                )
            }
        }

        this.emitter.on(eventName, handler)
    }

    dispatch(event: object): void {
        const eventName = event.constructor.name
        this.emitter.emit(eventName, event)
    }

    hasListeners(eventToken: EventToken): boolean {
        const eventName = eventToken.name
        return this.emitter.listenerCount(eventName) > 0
    }

    clearListeners(eventToken: EventToken): void {
        const eventName = eventToken.name
        this.emitter.removeAllListeners(eventName)
        this.listeners.delete(eventName)
    }

    clearAllListeners(): void {
        this.emitter.removeAllListeners()
        this.listeners.clear()
    }

    /**
     * Returns the underlying EventEmitter instance
     * Allows direct access for advanced use cases
     *
     * @example
     * ```typescript
     * const emitter = provider.getUnderlyingDispatcher()
     * emitter.once('UserCreatedEvent', (event) => {
     *     console.log('First user created:', event)
     * })
     * ```
     */
    getUnderlyingDispatcher(): EventEmitter {
        return this.emitter
    }

    /**
     * Gets listener count for an event
     */
    getListenerCount(eventToken: EventToken): number {
        return this.emitter.listenerCount(eventToken.name)
    }
}

// ============================================================
// USAGE EXAMPLE
// ============================================================

/**
 * Example: Using EventEmitter with once() pattern
 */
class OrderPlacedEvent {
    constructor(
        public readonly orderId: string,
        public readonly amount: number
    ) {}
}

class OrderPlacedListener {
    async onEvent(event: OrderPlacedEvent): Promise<void> {
        console.log(`Processing order ${event.orderId}`)
        // Async processing...
        await new Promise(resolve => setTimeout(resolve, 100))
        console.log(`Order ${event.orderId} processed`)
    }
}

/**
 * Advanced example: Direct EventEmitter access
 */
function setupAdvancedHandling(provider: EventEmitterDispatcherProvider) {
    const emitter = provider.getUnderlyingDispatcher()

    // Listen to all events
    emitter.on('newListener', (event, _listener) => {
        console.log(`New listener added for: ${event}`)
    })

    // One-time listener
    emitter.once('OrderPlacedEvent', (_event: OrderPlacedEvent) => {
        console.log('First order placed!')
    })

    // Prepend listener (execute first)
    emitter.prependListener('OrderPlacedEvent', (_event: OrderPlacedEvent) => {
        console.log('This runs before other listeners')
    })
}

export { OrderPlacedEvent, OrderPlacedListener, setupAdvancedHandling }

