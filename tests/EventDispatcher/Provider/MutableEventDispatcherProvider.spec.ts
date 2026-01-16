import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MutableEventDispatcherProvider } from '../../../src/EventDispatcher/Provider/MutableEventDispatcherProvider'
import type { ContainerProvider } from '../../../src/Provider'
import type { EventToken, ListenerToken } from '../../../src/EventDispatcher/Provider/types'

// Mock classes for testing
class TestEvent {
  constructor(public data: string) {}
}

class TestListener {
  onEvent(event: TestEvent): void {
    // implementation not needed for types, will be mocked
  }
}

class AnotherTestEvent {
    constructor(public id: number) {}
}

describe('MutableEventDispatcherProvider', () => {
  let provider: MutableEventDispatcherProvider
  let mockContainer: ContainerProvider

  beforeEach(() => {
    mockContainer = {
      resolve: vi.fn(),
      name: 'mock-container',
    } as unknown as ContainerProvider

    provider = new MutableEventDispatcherProvider({
      containerProvider: mockContainer,
    })
  })

  describe('register', () => {
    it('should register a listener for an event', () => {
      provider.register(TestEvent, TestListener)

      expect(provider.hasListeners(TestEvent)).toBe(true)
    })

    it('should register multiple listeners for the same event', () => {
      class AnotherListener {
        onEvent() {}
      }

      provider.register(TestEvent, TestListener)
      provider.register(TestEvent, AnotherListener)

      const listeners = provider.getUnderlyingDispatcher().get('TestEvent')
      expect(listeners).toHaveLength(2)
      expect(listeners).toContain(TestListener)
      expect(listeners).toContain(AnotherListener)
    })
  })

  describe('dispatch', () => {
    it('should resolve listener from container and call onEvent', () => {
      const event = new TestEvent('test data')
      const mockListenerInstance = {
        onEvent: vi.fn(),
      }

      // Setup container mock to return our listener instance
      vi.mocked(mockContainer.resolve).mockReturnValue(mockListenerInstance)

      provider.register(TestEvent, TestListener)
      provider.dispatch(event)

      expect(mockContainer.resolve).toHaveBeenCalledWith(TestListener)
      expect(mockListenerInstance.onEvent).toHaveBeenCalledWith(event)
    })

    it('should dispatch to multiple listeners', () => {
      const event = new TestEvent('test data')
      const mockListener1 = { onEvent: vi.fn() }
      const mockListener2 = { onEvent: vi.fn() }

      class Listener1 {}
      class Listener2 {}

      vi.mocked(mockContainer.resolve)
        .mockReturnValueOnce(mockListener1)
        .mockReturnValueOnce(mockListener2)

      provider.register(TestEvent, Listener1)
      provider.register(TestEvent, Listener2)
      provider.dispatch(event)

      expect(mockContainer.resolve).toHaveBeenCalledWith(Listener1)
      expect(mockContainer.resolve).toHaveBeenCalledWith(Listener2)
      expect(mockListener1.onEvent).toHaveBeenCalledWith(event)
      expect(mockListener2.onEvent).toHaveBeenCalledWith(event)
    })

    it('should do nothing if no listeners are registered', () => {
      const event = new TestEvent('test data')
      provider.dispatch(event)

      expect(mockContainer.resolve).not.toHaveBeenCalled()
    })

    it('should handle errors in listeners gracefully (rethrow)', () => {
        const event = new TestEvent('error')
        const error = new Error('Listener failed')
        const mockListener = {
            onEvent: vi.fn().mockImplementation(() => {
                throw error
            })
        }

        vi.mocked(mockContainer.resolve).mockReturnValue(mockListener)
        provider.register(TestEvent, TestListener)

        // Spy on console.error to avoid polluting test output
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        expect(() => provider.dispatch(event)).toThrow(error)
        expect(consoleSpy).toHaveBeenCalled()

        consoleSpy.mockRestore()
    })
  })

  describe('hasListeners', () => {
    it('should return true if listeners exist', () => {
      provider.register(TestEvent, TestListener)
      expect(provider.hasListeners(TestEvent)).toBe(true)
    })

    it('should return false if no listeners exist', () => {
      expect(provider.hasListeners(TestEvent)).toBe(false)
    })
  })

  describe('clearListeners', () => {
    it('should clear listeners for a specific event', () => {
      provider.register(TestEvent, TestListener)
      provider.register(AnotherTestEvent, TestListener)

      provider.clearListeners(TestEvent)

      expect(provider.hasListeners(TestEvent)).toBe(false)
      expect(provider.hasListeners(AnotherTestEvent)).toBe(true)
    })
  })

  describe('clearAllListeners', () => {
    it('should clear all listeners', () => {
      provider.register(TestEvent, TestListener)
      provider.register(AnotherTestEvent, TestListener)

      provider.clearAllListeners()

      expect(provider.hasListeners(TestEvent)).toBe(false)
      expect(provider.hasListeners(AnotherTestEvent)).toBe(false)
    })
  })
})
