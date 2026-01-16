# ts-di-validator-plugin

Plugin TypeScript Language Service pour la validation statique des dépendances d'injection avec `@djodjonx/wiredi` et `tsyringe`.

## Fonctionnalités

- ✅ **Validation en temps réel** : Détecte les dépendances manquantes directement dans l'IDE
- ✅ **Support des décorateurs `@inject`** : Analyse les paramètres avec `@inject(TOKEN)`
- ✅ **Injection implicite par type** : Support de l'injection basée sur les types de paramètres
- ✅ **Héritage de configuration** : Résolution complète des `extends` dans `defineBuilderConfig`
- ✅ **Détection de cycles** : Protection contre les configurations circulaires
- ✅ **Cache intelligent** : Optimisation des performances avec mise en cache par fichier

## Installation

```bash
npm install ts-di-validator-plugin --save-dev
```

## Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "ts-di-validator-plugin",
        "verbose": false
      }
    ]
  }
}
```

### Visual Studio Code

VS Code doit utiliser la version de TypeScript du workspace :

1. Ouvrez la palette de commandes (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Sélectionnez "TypeScript: Select TypeScript Version"
3. Choisissez "Use Workspace Version"

Ou ajoutez dans `.vscode/settings.json` :

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### IntelliJ IDEA / WebStorm

1. Ouvrez **Settings** → **Languages & Frameworks** → **TypeScript**
2. Assurez-vous que "TypeScript Language Service" est activé
3. Redémarrez l'IDE

## Utilisation

Le plugin analyse automatiquement les fichiers contenant `defineBuilderConfig` ou `definePartialConfig` :

```typescript
import { injectable, inject } from 'tsyringe'
import { defineBuilderConfig, definePartialConfig } from '@djodjonx/wiredi'

// Token
const TOKENS = {
    Logger: Symbol('Logger'),
    UserRepo: Symbol('UserRepo'),
}

// Service avec dépendance
@injectable()
class UserService {
    constructor(
        @inject(TOKENS.Logger) private logger: Logger,
        @inject(TOKENS.UserRepo) private repo: UserRepository,
    ) {}
}

// Configuration partielle
const loggingPartial = definePartialConfig({
    injections: [
        { token: TOKENS.Logger, provider: ConsoleLogger },
    ],
    listeners: [],
})

// Configuration principale
const appConfig = defineBuilderConfig({
    builderId: 'app.main',
    extends: [loggingPartial],
    injections: [
        { token: UserService }, // ❌ Erreur: TOKENS.UserRepo non enregistré
    ],
    listeners: [],
})
```

**Erreur affichée :**
```
[DI] Dépendance manquante: Le service "UserService" requiert "TOKENS.UserRepo"
(paramètre 1) mais ce token n'est pas fourni dans la configuration "app.main" ou ses parents.
```

## Architecture du Plugin

```
plugin/
├── index.ts               # Point d'entrée, Pattern Décorateur sur LanguageService
├── types.ts               # Interfaces et types
├── TokenNormalizer.ts     # Normalisation des tokens (Symbol, Class, String)
├── ConfigurationAnalyzer.ts # Analyse des defineBuilderConfig/definePartialConfig
├── DependencyAnalyzer.ts  # Analyse des constructeurs et @inject
└── ValidationEngine.ts    # Moteur de validation et génération de diagnostics
```

### Stratégie d'identification des tokens

| Type | Exemple | ID Unique |
|------|---------|-----------|
| String | `@inject('API_KEY')` | `STRING:API_KEY` |
| Symbol | `@inject(TOKENS.DB)` | `SYMBOL:/path/to/tokens.ts:150` |
| Class | `@inject(UserService)` | `CLASS:/path/to/UserService.ts:10` |

L'identité des tokens est basée sur leur position de déclaration, pas leur valeur, ce qui permet de distinguer deux `Symbol('DB')` déclarés à des endroits différents.

## Options de configuration

| Option | Type | Par défaut | Description |
|--------|------|------------|-------------|
| `verbose` | `boolean` | `false` | Active les logs de debug dans le TSServer |

## Limitations connues

1. **Configurations dynamiques** : Les configurations générées dynamiquement (ex: `providers: getProviders()`) ne peuvent pas être analysées statiquement

2. **Types génériques** : L'injection basée sur des classes génériques (`Service<T>`) peut ne pas être correctement validée

3. **Path mapping** : Les alias de chemins dans `tsconfig.json` sont supportés via l'API de résolution TypeScript

## Debug

Pour activer les logs de debug :

1. Activez `verbose: true` dans la config du plugin
2. Consultez les logs TSServer :
   - VS Code : "TypeScript" dans l'Output panel
   - IntelliJ : Help → Diagnostic Tools → Debug Log Settings

## Contribution

```bash
# Cloner le repository
git clone <repo>

# Installer les dépendances
pnpm install

# Compiler le plugin
pnpm build:plugin

# Tester
pnpm validate:di test/ide/Presentation/builder/myBuilder/index.ts
```

## License

MIT

