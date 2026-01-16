import type Event from './Event'

/**
 * Interface for event dispatcher implementations
 * @deprecated Use EventDispatcherProvider from '@djodjonx/wiredi' instead
 */
export interface EventDispatcherInterface {
  dispatch(event: Event): void
}
