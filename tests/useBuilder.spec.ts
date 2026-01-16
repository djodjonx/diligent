import { describe, it, expect, beforeEach, vi } from 'vitest'
import useBuilder, { 
    defineBuilderConfig, 
    definePartialConfig,
    useContainerProvider,
    resetContainerProvider,
    ProviderLifecycle
} from '../src/index'
import type { ContainerProvider } from '../src/Provider/types'

describe('useBuilder', () => {
  let mockProvider: ContainerProvider

  beforeEach(() => {
    resetContainerProvider()
    mockProvider = {
      name: 'mock-provider',
      registerValue: vi.fn(),
      registerFactory: vi.fn(),
      registerClass: vi.fn(),
      isRegistered: vi.fn().mockReturnValue(false),
      resolve: vi.fn(),
      dispose: vi.fn(),
    } as unknown as ContainerProvider
    useContainerProvider(mockProvider)
  })

  class TestService {}
  const TOKEN = Symbol('TOKEN')

  describe('defineBuilderConfig', () => {
    it('should create a valid config', () => {
      const config = defineBuilderConfig({
        builderId: 'test',
        injections: [
          { token: TestService }
        ],
        listeners: []
      })

      expect(config.builderId).toBe('test')
      expect(config.injections).toHaveLength(1)
    })

    it('should merge partials', () => {
      const partial = definePartialConfig({
        injections: [{ token: TOKEN, value: () => 'bar' }]
      })

      const config = defineBuilderConfig({
        builderId: 'test',
        extends: [partial],
        injections: [{ token: TestService }],
        listeners: []
      })

      expect(config.injections).toHaveLength(2)
      expect(config.injections[1].token).toBe(TOKEN)
    })
  })

  describe('useBuilder', () => {
    it('should register injections in the provider', () => {
      const config = defineBuilderConfig({
        builderId: 'test-builder',
        injections: [
          { token: TestService },
          { token: TOKEN, value: () => 'some-value' }
        ],
        listeners: []
      })

      useBuilder(config)

      expect(mockProvider.registerClass).toHaveBeenCalledWith(TestService, TestService, ProviderLifecycle.Singleton)
      expect(mockProvider.registerValue).toHaveBeenCalledWith(TOKEN, 'some-value')
    })

    it('should only register once for the same builderId', () => {
        const config = defineBuilderConfig({
          builderId: 'once',
          injections: [{ token: TestService }],
          listeners: []
        })
  
        // First call
        useBuilder(config)
        expect(mockProvider.registerClass).toHaveBeenCalledTimes(1)
  
        // Simulate registration being stored
        vi.mocked(mockProvider.isRegistered).mockImplementation((token) => {
            if (typeof token === 'symbol' && token.description?.includes('__builder__once')) {
                return true
            }
            return false
        })

        // Second call
        useBuilder(config)
        expect(mockProvider.registerClass).toHaveBeenCalledTimes(1) // Still 1
      })

    it('should resolve dependencies', () => {
      const config = defineBuilderConfig({
        builderId: 'resolver',
        injections: [{ token: TestService }],
        listeners: []
      })

      const instance = new TestService()
      vi.mocked(mockProvider.resolve).mockReturnValue(instance)

      const { resolve } = useBuilder(config)
      const result = resolve(TestService)

      expect(result).toBe(instance)
      expect(mockProvider.resolve).toHaveBeenCalledWith(TestService)
    })

    it('should pass context to value providers', () => {
        const VAL_TOKEN = Symbol('VAL')
        const config = defineBuilderConfig({
            builderId: 'ctx',
            injections: [
                { token: VAL_TOKEN, value: (ctx: { key: string }) => ctx.key }
            ],
            listeners: []
        })

        useBuilder(config, { key: 'expected' })
        expect(mockProvider.registerValue).toHaveBeenCalledWith(VAL_TOKEN, 'expected')
    })
  })
})
