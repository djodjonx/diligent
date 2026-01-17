import { defineBuilderConfig } from '../../../index'
import { TOKENS, UserRepository } from '../fixtures'


// ❌ ERROR: Factory returns wrong type
const errorFactoryWrongType = defineBuilderConfig({
    builderId: 'error.factory.wrong',
    injections: [
        {
            token: TOKENS.Logger,
            factory: () => new UserRepository(), // ❌ Returns UserRepository instead of LoggerInterface
            // Expected: Type error (but may not be caught without proper typing)
        },
    ],
})

