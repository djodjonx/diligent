import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as awilix from 'awilix'
import { AwilixProvider } from '../../../src/Provider/adapters/AwilixProvider'
import { ProviderLifecycle } from '../../../src/Provider/types'

describe('AwilixProvider', () => {
  let provider: AwilixProvider

  beforeEach(() => {
    provider = AwilixProvider.createSync(awilix)
  })

  it('should have the correct name', () => {
    expect(provider.name).toBe('awilix')
  })

  describe('initialization', () => {
    it('should initialize asynchronously', async () => {
      const p = new AwilixProvider()
      await p.init()
      expect(() => p.getUnderlyingContainer()).not.toThrow()
    })

    it('should support CLASSIC injection mode', async () => {
        const p = new AwilixProvider({ injectionMode: 'CLASSIC' })
        await p.init()
        expect(p).toBeDefined()
    })

    it('should throw if used before initialization', () => {
        const p = new AwilixProvider()
        expect(() => p.resolve(Symbol('test'))).toThrow(/Container not initialized/)
    })

    it('should be safe to call init multiple times', async () => {
        const p = new AwilixProvider()
        await p.init()
        await p.init() // Should just return
        expect(() => p.getUnderlyingContainer()).not.toThrow()
    })
  })

  describe('registerValue', () => {
    it('should register and resolve a value', () => {
      const token = Symbol('test-value')
      const value = { foo: 'bar' }
      provider.registerValue(token, value)
      expect(provider.resolve(token)).toBe(value)
    })
  })

  describe('registerFactory', () => {
    it('should register and resolve a factory', () => {
      const token = Symbol('test-factory')
      provider.registerFactory(token, () => ({ created: true }))
      const result = provider.resolve<{ created: boolean }>(token)
      expect(result.created).toBe(true)
    })

    it('should resolve dependencies within factory', () => {
      const valueToken = Symbol('value')
      const factoryToken = Symbol('factory')
      
      provider.registerValue(valueToken, 'hello')
      provider.registerFactory(factoryToken, (p) => {
        return p.resolve<string>(valueToken) + ' world'
      })

      expect(provider.resolve(factoryToken)).toBe('hello world')
    })
  })

  describe('registerClass', () => {
    class TestService {
      static count = 0
      constructor() {
        TestService.count++
      }
    }

    beforeEach(() => {
      TestService.count = 0
    })

    it('should register and resolve a class', () => {
      provider.registerClass(TestService)
      const instance = provider.resolve(TestService)
      expect(instance).toBeInstanceOf(TestService)
    })

    it('should handle singleton lifecycle (default)', () => {
      provider.registerClass(TestService, TestService, ProviderLifecycle.Singleton)
      const instance1 = provider.resolve(TestService)
      const instance2 = provider.resolve(TestService)
      expect(instance1).toBe(instance2)
      expect(TestService.count).toBe(1)
    })

    it('should handle transient lifecycle', () => {
      provider.registerClass(TestService, TestService, ProviderLifecycle.Transient)
      const instance1 = provider.resolve(TestService)
      const instance2 = provider.resolve(TestService)
      expect(instance1).not.toBe(instance2)
      expect(TestService.count).toBe(2)
    })
  })

  describe('isRegistered', () => {
    it('should return true if token is registered', () => {
      const token = Symbol('test')
      provider.registerValue(token, 'val')
      expect(provider.isRegistered(token)).toBe(true)
    })

    it('should return false if token is not registered', () => {
      const token = Symbol('not-here')
      expect(provider.isRegistered(token)).toBe(false)
    })
  })

  describe('createScope', () => {
    it('should create a scoped provider', () => {
      const scope = provider.createScope()
      expect(scope).toBeInstanceOf(AwilixProvider)
      expect(scope).not.toBe(provider)
    })

    it('should resolve singleton from parent but allow overriding in scope', () => {
        const token = Symbol('token')
        provider.registerValue(token, 'parent')
        
        const scope = provider.createScope()
        expect(scope.resolve(token)).toBe('parent')
        
        scope.registerValue(token, 'child')
        expect(scope.resolve(token)).toBe('child')
        expect(provider.resolve(token)).toBe('parent')
    })
  })

  describe('dispose', () => {
    it('should not throw on dispose', () => {
      expect(() => provider.dispose()).not.toThrow()
    })
  })
})
