/**
 * Point d'entrée de l'application
 * Configure le provider DI avant tout autre import
 */

// L'utilisateur importe tsyringe lui-même - il contrôle la version
import { container, Lifecycle } from 'tsyringe'
import 'reflect-metadata'

import { useContainerProvider, TsyringeProvider } from '@djodjonx/wiredi'

// ⚠️ IMPORTANT: Configurer le provider AVANT d'importer les builders
// L'utilisateur passe les dépendances tsyringe - il a le contrôle total
useContainerProvider(
    new TsyringeProvider({ container, Lifecycle })
)

// Maintenant on peut importer et utiliser les builders
export * from './Presentation/builder/myBuilder'

