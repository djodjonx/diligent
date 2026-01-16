/**
 * Example: RxJS Event Dispatcher Provider
 *
 * This example shows how to implement an EventDispatcherProvider using RxJS
 * Subject/Observable pattern for reactive event handling.
 *
 * **Installation Required:**
 * ```bash
 * npm install rxjs
 * # or
 * pnpm add rxjs
 * ```
 *
 * @see https://rxjs.dev/
 */

// @ts-ignore - RxJS must be installed separately: npm install rxjs
import { Subject, Observable, Subscription } from 'rxjs'
import type {
    EventDispatcherProvider,
    EventDispatcherProviderOptions,
    EventToken,
    ListenerToken,
} from '@djodjonx/wiredi'
import type { ContainerProvider } from '@djodjonx/wiredi'

/**
 * RxJS-based Event Dispatcher Provider
 *
 * Uses RxJS Subjects for event streams, allowing reactive programming patterns
 * and powerful operators (filter, map, debounce, etc.)
 *
 * @example
 * ```typescript
 * import { RxJsEventDispatcherProvider } from './RxJsEventDispatcherProvider'
 * import { useEventDispatcherProvider, getContainerProvider } from '@djodjonx/wiredi'
 *
 * const eventProvider = new RxJsEventDispatcherProvider({
 *     containerProvider: getContainerProvider()
 * })
 * useEventDispatcherProvider(eventProvider)
 *
 * // Subscribe to specific event stream
 * const userCreatedStream = eventProvider.getEventStream(UserCreatedEvent)
 * userCreatedStream.subscribe(event => {
 *     console.log('User created:', event)
 * })
 * ```
 */
export class RxJsEventDispatcherProvider implements EventDispatcherProvider {
    readonly name = 'rxjs-event-dispatcher'

    /** Map of event names to their RxJS Subjects */
    private eventStreams = new Map<string, Subject<any>>()

    /** Map of event names to registered listener tokens */
    private listeners = new Map<string, ListenerToken[]>()

    /** Map of subscriptions for cleanup */
    private subscriptions = new Map<string, Subscription[]>()

    private containerProvider: ContainerProvider

    constructor(options: EventDispatcherProviderOptions) {
        this.containerProvider = options.containerProvider
    }

    /**
     * Gets the RxJS Observable for a specific event type
     * Allows subscribing to event streams with RxJS operators
     *
     * @param eventToken - The event class to get the stream for
     * @returns Observable that emits events of the specified type
     *
     * @example
     * ```typescript
     * import { debounceTime, map } from 'rxjs/operators'
     *
     * const stream = provider.getEventStream(SearchQueryChangedEvent)
     * stream.pipe(
     *     debounceTime(300),
     *     map(event => event.query)
     * ).subscribe(query => {
     *     // Perform search
     * })
     * ```
     */
    getEventStream<T>(eventToken: EventToken): Observable<T> {
        const eventName = eventToken.name

        if (!this.eventStreams.has(eventName)) {
            this.eventStreams.set(eventName, new Subject<T>())
        }

        return this.eventStreams.get(eventName)!.asObservable()
    }

    register(eventToken: EventToken, listenerToken: ListenerToken): void {
        const eventName = eventToken.name

        // Add to listeners list
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, [])
        }
        this.listeners.get(eventName)!.push(listenerToken)

        // Create Subject if doesn't exist
        if (!this.eventStreams.has(eventName)) {
            this.eventStreams.set(eventName, new Subject())
        }

        // Subscribe listener to event stream
        const subject = this.eventStreams.get(eventName)!
        const subscription = subject.subscribe((event: any) => {
            try {
                const listener = this.containerProvider.resolve<{ onEvent(event: any): void }>(listenerToken)
                listener.onEvent(event)
            } catch (error: any) {
                console.error(
                    `[RxJsEventDispatcherProvider] Error in listener for "${eventName}":`,
                    error.stack || error.message
                )
            }
        })

        // Store subscription for cleanup
        if (!this.subscriptions.has(eventName)) {
            this.subscriptions.set(eventName, [])
        }
        this.subscriptions.get(eventName)!.push(subscription)
    }

    dispatch(event: object): void {
        const eventName = event.constructor.name

        if (this.eventStreams.has(eventName)) {
            this.eventStreams.get(eventName)!.next(event)
        }
    }

    hasListeners(eventToken: EventToken): boolean {
        const eventName = eventToken.name
        const listeners = this.listeners.get(eventName)
        return listeners !== undefined && listeners.length > 0
    }

    clearListeners(eventToken: EventToken): void {
        const eventName = eventToken.name

        // Unsubscribe all subscriptions
        const subs = this.subscriptions.get(eventName) ?? []
        subs.forEach(sub => sub.unsubscribe())
        this.subscriptions.delete(eventName)

        // Complete the subject
        if (this.eventStreams.has(eventName)) {
            this.eventStreams.get(eventName)!.complete()
            this.eventStreams.delete(eventName)
        }

        this.listeners.delete(eventName)
    }

    clearAllListeners(): void {
        // Unsubscribe all
        this.subscriptions.forEach(subs => {
            subs.forEach(sub => sub.unsubscribe())
        })
        this.subscriptions.clear()

        // Complete all subjects
        this.eventStreams.forEach(subject => subject.complete())
        this.eventStreams.clear()

        this.listeners.clear()
    }

    getUnderlyingDispatcher(): Map<string, Subject<any>> {
        return this.eventStreams
    }
}

// ============================================================
// USAGE EXAMPLE
// ============================================================

/**
 * Example event class
 */
class UserCreatedEvent {
    constructor(
        public readonly userId: string,
        public readonly email: string,
        public readonly timestamp: Date = new Date()
    ) {}
}

/**
 * Example listener using RxJS operators
 */
class UserCreatedListener {
    onEvent(event: UserCreatedEvent): void {
        console.log(`User created: ${event.email}`)
    }
}

/**
 * Advanced example: Using RxJS operators directly
 */
function setupAdvancedEventHandling(provider: RxJsEventDispatcherProvider) {
    const { debounceTime, map, filter } = require('rxjs/operators')

    // Subscribe to user creation events with operators
    provider.getEventStream(UserCreatedEvent)
        .pipe(
            // Only process events from gmail users
            filter((event: UserCreatedEvent) => event.email.endsWith('@gmail.com')),
            // Debounce to avoid spam
            debounceTime(1000),
            // Extract just the email
            map((event: UserCreatedEvent) => event.email)
        )
        .subscribe((email: string) => {
            console.log('Gmail user registered:', email)
        })
}

export { UserCreatedEvent, UserCreatedListener, setupAdvancedEventHandling }

