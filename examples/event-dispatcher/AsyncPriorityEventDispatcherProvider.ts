/**
 * Example: Async/Priority Event Dispatcher Provider
 *
 * This example shows a custom implementation with:
 * - Priority-based listener ordering
 * - Async event handling with Promise.all
 * - Event queuing for controlled processing
 * - Error resilience (one listener failure doesn't stop others)
 */

import type {
    EventDispatcherProvider,
    EventDispatcherProviderOptions,
    EventToken,
    ListenerToken,
} from '@djodjonx/wiredi'
import type { ContainerProvider } from '@djodjonx/wiredi'

/**
 * Priority levels for listeners
 */
export enum ListenerPriority {
    CRITICAL = 0,
    HIGH = 1,
    NORMAL = 2,
    LOW = 3,
}

/**
 * Listener registration with priority
 */
interface PriorityListener {
    token: ListenerToken
    priority: ListenerPriority
}

/**
 * Options for AsyncPriorityEventDispatcherProvider
 */
export interface AsyncPriorityEventDispatcherOptions extends EventDispatcherProviderOptions {
    /**
     * Enable event queuing (process events sequentially)
     * @default false
     */
    enableQueue?: boolean

    /**
     * Continue processing listeners even if one fails
     * @default true
     */
    continueOnError?: boolean

    /**
     * Timeout for async listeners (ms)
     * @default 5000
     */
    listenerTimeout?: number
}

/**
 * Async Priority-based Event Dispatcher Provider
 *
 * Features:
 * - Listeners execute in priority order
 * - All listeners run in parallel within same priority
 * - Async support with Promise.all
 * - Optional event queuing
 * - Error resilience
 *
 * @example
 * ```typescript
 * import { AsyncPriorityEventDispatcherProvider, ListenerPriority } from './AsyncPriorityEventDispatcherProvider'
 * import { useEventDispatcherProvider, getContainerProvider } from '@djodjonx/wiredi'
 *
 * const eventProvider = new AsyncPriorityEventDispatcherProvider({
 *     containerProvider: getContainerProvider(),
 *     enableQueue: true,
 *     listenerTimeout: 10000
 * })
 *
 * // Register with priority
 * eventProvider.registerWithPriority(
 *     UserCreatedEvent,
 *     CriticalListener,
 *     ListenerPriority.CRITICAL
 * )
 *
 * useEventDispatcherProvider(eventProvider)
 * ```
 */
export class AsyncPriorityEventDispatcherProvider implements EventDispatcherProvider {
    readonly name = 'async-priority-dispatcher'

    private listeners = new Map<string, PriorityListener[]>()
    private eventQueue: Array<{ name: string; event: object }> = []
    private processing = false
    private containerProvider: ContainerProvider
    private options: Required<AsyncPriorityEventDispatcherOptions>

    constructor(options: AsyncPriorityEventDispatcherOptions) {
        this.containerProvider = options.containerProvider
        this.options = {
            containerProvider: options.containerProvider,
            enableQueue: options.enableQueue ?? false,
            continueOnError: options.continueOnError ?? true,
            listenerTimeout: options.listenerTimeout ?? 5000,
        }
    }

    /**
     * Registers a listener with a specific priority
     *
     * @param eventToken - Event class to listen for
     * @param listenerToken - Listener class or token
     * @param priority - Execution priority (lower number = higher priority)
     *
     * @example
     * ```typescript
     * provider.registerWithPriority(
     *     OrderPlacedEvent,
     *     PaymentProcessor,
     *     ListenerPriority.CRITICAL
     * )
     *
     * provider.registerWithPriority(
     *     OrderPlacedEvent,
     *     EmailNotifier,
     *     ListenerPriority.LOW
     * )
     * ```
     */
    registerWithPriority(
        eventToken: EventToken,
        listenerToken: ListenerToken,
        priority: ListenerPriority = ListenerPriority.NORMAL
    ): void {
        const eventName = eventToken.name

        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, [])
        }

        const listeners = this.listeners.get(eventName)!
        listeners.push({ token: listenerToken, priority })

        // Sort by priority (lower number first)
        listeners.sort((a, b) => a.priority - b.priority)
    }

    register(eventToken: EventToken, listenerToken: ListenerToken): void {
        // Default to NORMAL priority
        this.registerWithPriority(eventToken, listenerToken, ListenerPriority.NORMAL)
    }

    async dispatch(event: object): Promise<void> {
        const eventName = event.constructor.name

        if (this.options.enableQueue) {
            this.eventQueue.push({ name: eventName, event })
            await this.processQueue()
        } else {
            await this.dispatchImmediate(eventName, event)
        }
    }

    private async processQueue(): Promise<void> {
        if (this.processing || this.eventQueue.length === 0) return

        this.processing = true

        while (this.eventQueue.length > 0) {
            const { name, event } = this.eventQueue.shift()!
            await this.dispatchImmediate(name, event)
        }

        this.processing = false
    }

    private async dispatchImmediate(eventName: string, event: object): Promise<void> {
        const priorityListeners = this.listeners.get(eventName)
        if (!priorityListeners || priorityListeners.length === 0) return

        // Group by priority
        const priorityGroups = new Map<ListenerPriority, ListenerToken[]>()
        priorityListeners.forEach(({ token, priority }) => {
            if (!priorityGroups.has(priority)) {
                priorityGroups.set(priority, [])
            }
            priorityGroups.get(priority)!.push(token)
        })

        // Execute each priority group in order
        for (const [_priority, tokens] of Array.from(priorityGroups.entries()).sort((a, b) => a[0] - b[0])) {
            const promises = tokens.map(token => this.executeListener(token, event, eventName))

            if (this.options.continueOnError) {
                // Execute all, catch individual errors
                await Promise.allSettled(promises)
            } else {
                // Stop on first error
                await Promise.all(promises)
            }
        }
    }

    private async executeListener(
        listenerToken: ListenerToken,
        event: object,
        eventName: string
    ): Promise<void> {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Listener timeout')), this.options.listenerTimeout)
        })

        try {
            const listener = this.containerProvider.resolve<{ onEvent(event: object): void | Promise<void> }>(
                listenerToken
            )

            const result = listener.onEvent(event)

            if (result instanceof Promise) {
                await Promise.race([result, timeoutPromise])
            }
        } catch (error: any) {
            console.error(
                `[AsyncPriorityEventDispatcherProvider] Error in listener for "${eventName}":`,
                error.stack || error.message
            )

            if (!this.options.continueOnError) {
                throw error
            }
        }
    }

    hasListeners(eventToken: EventToken): boolean {
        const eventName = eventToken.name
        const listeners = this.listeners.get(eventName)
        return listeners !== undefined && listeners.length > 0
    }

    clearListeners(eventToken: EventToken): void {
        const eventName = eventToken.name
        this.listeners.delete(eventName)
    }

    clearAllListeners(): void {
        this.listeners.clear()
        this.eventQueue = []
    }

    /**
     * Gets the current event queue size
     */
    getQueueSize(): number {
        return this.eventQueue.length
    }

    /**
     * Checks if the dispatcher is currently processing events
     */
    isProcessing(): boolean {
        return this.processing
    }

    getUnderlyingDispatcher(): Map<string, PriorityListener[]> {
        return this.listeners
    }
}

// ============================================================
// USAGE EXAMPLE
// ============================================================

class PaymentProcessedEvent {
    constructor(
        public readonly paymentId: string,
        public readonly amount: number
    ) {}
}

// Critical: Must run first
class FraudDetectionListener {
    async onEvent(_event: PaymentProcessedEvent): Promise<void> {
        console.log('[CRITICAL] Running fraud detection...')
        await new Promise(resolve => setTimeout(resolve, 100))
        console.log('[CRITICAL] Fraud check complete')
    }
}

// High priority: Important but not critical
class PaymentConfirmationListener {
    async onEvent(_event: PaymentProcessedEvent): Promise<void> {
        console.log('[HIGH] Sending payment confirmation...')
        await new Promise(resolve => setTimeout(resolve, 50))
        console.log('[HIGH] Confirmation sent')
    }
}

// Normal priority: Standard processing
class AnalyticsListener {
    async onEvent(_event: PaymentProcessedEvent): Promise<void> {
        console.log('[NORMAL] Recording analytics...')
        await new Promise(resolve => setTimeout(resolve, 20))
        console.log('[NORMAL] Analytics recorded')
    }
}

// Low priority: Can be delayed
class ReportGeneratorListener {
    async onEvent(_event: PaymentProcessedEvent): Promise<void> {
        console.log('[LOW] Generating report...')
        await new Promise(resolve => setTimeout(resolve, 200))
        console.log('[LOW] Report generated')
    }
}

/**
 * Example setup with priority ordering
 */
async function setupPriorityHandling() {
    const { getContainerProvider } = await import('WireDI')

    const provider = new AsyncPriorityEventDispatcherProvider({
        containerProvider: getContainerProvider(),
        enableQueue: true,
        continueOnError: true,
        listenerTimeout: 10000,
    })

    // Register in priority order
    provider.registerWithPriority(PaymentProcessedEvent, FraudDetectionListener, ListenerPriority.CRITICAL)
    provider.registerWithPriority(PaymentProcessedEvent, PaymentConfirmationListener, ListenerPriority.HIGH)
    provider.registerWithPriority(PaymentProcessedEvent, AnalyticsListener, ListenerPriority.NORMAL)
    provider.registerWithPriority(PaymentProcessedEvent, ReportGeneratorListener, ListenerPriority.LOW)

    // Dispatch event
    await provider.dispatch(new PaymentProcessedEvent('PAY-123', 99.99))

    console.log('All listeners executed in priority order!')
}

export {
    PaymentProcessedEvent,
    FraudDetectionListener,
    PaymentConfirmationListener,
    AnalyticsListener,
    ReportGeneratorListener,
    setupPriorityHandling,
}

