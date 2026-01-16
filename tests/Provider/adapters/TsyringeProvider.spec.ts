import 'reflect-metadata'
import { describe, it, expect, beforeEach } from 'vitest'
import { container, Lifecycle } from 'tsyringe'
import { TsyringeProvider } from '../../../src/Provider/adapters/TsyringeProvider'
import { ProviderLifecycle } from '../../../src/Provider/types'

describe('TsyringeProvider', () => {
  let provider: TsyringeProvider

  beforeEach(() => {
    // Use a child container for each test to ensure isolation
    provider = new TsyringeProvider(
      { container: container.createChildContainer(), Lifecycle },
      { useChildContainer: false }
    )
  })

  it('should have the correct name', () => {
    expect(provider.name).toBe('tsyringe')
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

    it('should register with symbol and implementation', () => {
        const token = Symbol('service')
        provider.registerClass(token, TestService)
        const instance = provider.resolve(token)
        expect(instance).toBeInstanceOf(TestService)
    })

    it('should throw if symbol registered without implementation', () => {
        const token = Symbol('service')
        expect(() => provider.registerClass(token as any)).toThrow(/Implementation required/)
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
      expect(scope).toBeInstanceOf(TsyringeProvider)
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
