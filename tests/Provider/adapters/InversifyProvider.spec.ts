import 'reflect-metadata'
import { describe, it, expect, beforeEach } from 'vitest'
import * as inversify from 'inversify'
import { InversifyProvider } from '../../../src/Provider/adapters/InversifyProvider'
import { ProviderLifecycle } from '../../../src/Provider/types'

// Note: Inversify requires @injectable() on classes
@inversify.injectable()
class TestService {
  static count = 0
  constructor() {
    TestService.count++
  }
}

describe('InversifyProvider', () => {
  let provider: InversifyProvider

  beforeEach(() => {
    provider = InversifyProvider.createSync(inversify)
  })

  it('should have the correct name', () => {
    expect(provider.name).toBe('inversify')
  })

  describe('initialization', () => {
    it('should initialize asynchronously', async () => {
      const p = new InversifyProvider()
      await p.init()
      expect(() => p.getUnderlyingContainer()).not.toThrow()
    })

    it('should throw if used before initialization', () => {
        const p = new InversifyProvider()
        expect(() => p.resolve(Symbol('test'))).toThrow(/Container not initialized/)
    })
  })

  describe('registerValue', () => {
    it('should register and resolve a value', () => {
      const token = Symbol('test-value')
      const value = { foo: 'bar' }
      provider.registerValue(token, value)
      expect(provider.resolve(token)).toBe(value)
    })
    it('should overwrite existing value binding', () => {
        const token = Symbol('test-value')
        provider.registerValue(token, 'first')
        provider.registerValue(token, 'second')
        expect(provider.resolve(token)).toBe('second')
    })
  })

  describe('registerFactory', () => {
    it('should register and resolve a factory', () => {
      const token = Symbol('test-factory')
      provider.registerFactory(token, () => ({ created: true }))
      const result = provider.resolve<{ created: boolean }>(token)
      expect(result.created).toBe(true)
    })

    it('should overwrite existing factory binding', () => {
        const token = Symbol('test-factory')
        provider.registerFactory(token, () => 'first')
        provider.registerFactory(token, () => 'second')
        expect(provider.resolve(token)).toBe('second')
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
    beforeEach(() => {
      TestService.count = 0
    })

    it('should register and resolve a class', () => {
      provider.registerClass(TestService)
      const instance = provider.resolve(TestService)
      expect(instance).toBeInstanceOf(TestService)
    })

    it('should overwrite existing class binding', () => {
        provider.registerClass(TestService)
        // re-register same class, should unbind and bind again
        provider.registerClass(TestService) 
        expect(provider.resolve(TestService)).toBeInstanceOf(TestService)
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
      expect(scope).toBeInstanceOf(InversifyProvider)
      expect(scope).not.toBe(provider)
    })

    // Inversify's container inheritance is different, 
    // New container created in createScope doesn't automatically inherit parent bindings 
    // in the current implementation of InversifyProvider.createScope()
  })

  describe('dispose', () => {
    it('should not throw on dispose', () => {
      expect(() => provider.dispose()).not.toThrow()
    })
  })
})
