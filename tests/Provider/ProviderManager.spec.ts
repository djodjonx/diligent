import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  useContainerProvider,
  getContainerProvider,
  hasContainerProvider,
  resetContainerProvider
} from '../../src/Provider/ProviderManager'
import type { ContainerProvider } from '../../src/Provider/types'

describe('ProviderManager', () => {
  let mockProvider: ContainerProvider

  beforeEach(() => {
    resetContainerProvider()
    mockProvider = {
      name: 'mock-provider',
      dispose: vi.fn(),
    } as unknown as ContainerProvider
  })

  describe('useContainerProvider', () => {
    it('should set the provider', () => {
      useContainerProvider(mockProvider)
      expect(getContainerProvider()).toBe(mockProvider)
    })

    it('should throw error if provider already set', () => {
      useContainerProvider(mockProvider)
      expect(() => useContainerProvider(mockProvider)).toThrow(/Provider already configured/)
    })
  })

  describe('getContainerProvider', () => {
    it('should throw error if no provider set', () => {
      expect(() => getContainerProvider()).toThrow(/No container provider configured/)
    })

    it('should return the provider if set', () => {
      useContainerProvider(mockProvider)
      expect(getContainerProvider()).toBe(mockProvider)
    })
  })

  describe('hasContainerProvider', () => {
    it('should return false if no provider set', () => {
      expect(hasContainerProvider()).toBe(false)
    })

    it('should return true if provider set', () => {
      useContainerProvider(mockProvider)
      expect(hasContainerProvider()).toBe(true)
    })
  })

  describe('resetContainerProvider', () => {
    it('should reset the provider and call dispose', () => {
      useContainerProvider(mockProvider)
      resetContainerProvider()
      expect(hasContainerProvider()).toBe(false)
      expect(mockProvider.dispose).toHaveBeenCalled()
    })

    it('should not fail if no provider set', () => {
      expect(() => resetContainerProvider()).not.toThrow()
    })
  })
})
