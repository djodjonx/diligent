import { defineBuilderConfig, definePartialConfig, type ContainerProvider } from '../../../index'
import { TOKENS, ConsoleLogger, type ConfigInterface } from '../fixtures'

// ✅ Partial with factory - should be valid
export const partialWithFactory = definePartialConfig({
    injections: [
        {
            token: TOKENS.Config,
            factory: (_provider: ContainerProvider): ConfigInterface => ({
                apiUrl: 'http://api.com',
                timeout: 5000,
                retries: 3
            }),
        },
    ],
})

export const configValidWithFactoryPartial = defineBuilderConfig({
    builderId: 'test.valid.factory.partial',
    extends: [partialWithFactory],
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
    ],
})
