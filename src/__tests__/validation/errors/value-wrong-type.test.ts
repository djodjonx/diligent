import { defineBuilderConfig } from '../../../index'
import { TOKENS } from '../fixtures'


// ❌ ERROR: Value returns wrong type
const errorValueWrongType = defineBuilderConfig({
    builderId: 'error.value.wrong',
    injections: [
        {
            token: TOKENS.Config,
            value: () => ({ wrongProperty: 'test' }), // ❌ Doesn't match ConfigInterface
            // Expected: Type error (but may not be caught without proper typing)
        },
    ],
})

