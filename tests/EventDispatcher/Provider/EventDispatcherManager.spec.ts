import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  useEventDispatcherProvider,
  getEventDispatcherProvider,
  hasEventDispatcherProvider,
  resetEventDispatcherProvider
} from '../../../src/EventDispatcher/Provider/index'
import type { EventDispatcherProvider } from '../../../src/EventDispatcher/Provider/types'

describe('EventDispatcherManager', () => {
  let mockProvider: EventDispatcherProvider

  beforeEach(() => {
    resetEventDispatcherProvider()
    mockProvider = {
      name: 'mock-event-provider',
      register: vi.fn(),
      dispatch: vi.fn(),
      hasListeners: vi.fn(),
      clearListeners: vi.fn(),
      clearAllListeners: vi.fn(),
      getUnderlyingDispatcher: vi.fn(),
    }
  })

  describe('useEventDispatcherProvider', () => {
    it('should set the provider', () => {
      useEventDispatcherProvider(mockProvider)
      expect(getEventDispatcherProvider()).toBe(mockProvider)
    })

    it('should throw error if provider already set', () => {
      useEventDispatcherProvider(mockProvider)
      expect(() => useEventDispatcherProvider(mockProvider)).toThrow(/Provider already registered/)
    })
  })

  describe('getEventDispatcherProvider', () => {
    it('should throw error if no provider set', () => {
      expect(() => getEventDispatcherProvider()).toThrow(/No provider registered/)
    })

    it('should return the provider if set', () => {
      useEventDispatcherProvider(mockProvider)
      expect(getEventDispatcherProvider()).toBe(mockProvider)
    })
  })

  describe('hasEventDispatcherProvider', () => {
    it('should return false if no provider set', () => {
      expect(hasEventDispatcherProvider()).toBe(false)
    })

    it('should return true if provider set', () => {
      useEventDispatcherProvider(mockProvider)
      expect(hasEventDispatcherProvider()).toBe(true)
    })
  })

  describe('resetEventDispatcherProvider', () => {
    it('should reset the provider and call clearAllListeners', () => {
      useEventDispatcherProvider(mockProvider)
      resetEventDispatcherProvider()
      expect(hasEventDispatcherProvider()).toBe(false)
      expect(mockProvider.clearAllListeners).toHaveBeenCalled()
    })

    it('should not fail if no provider set', () => {
      expect(() => resetEventDispatcherProvider()).not.toThrow()
    })
  })
})
