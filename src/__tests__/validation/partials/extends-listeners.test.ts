import { defineBuilderConfig, definePartialConfig } from '../../../index'
import { UserCreatedEvent, EmailNotificationListener, ProductCreatedEvent, SmsNotificationListener } from '../fixtures'

// ✅ Config extending partial with listeners
export const configExtendsPartialListeners = defineBuilderConfig({
    builderId: 'valid.partial.listeners',
    extends: [
        definePartialConfig({
            listeners: [{ event: UserCreatedEvent, listener: EmailNotificationListener }],
        }),
    ],
    injections: [],
    listeners: [
        { event: ProductCreatedEvent, listener: SmsNotificationListener },
    ],
})
