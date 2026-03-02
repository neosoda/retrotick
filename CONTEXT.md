## Informations manquantes ou ambiguës (bloquantes pour un cadrage parfait)
1. **Objectifs produit chiffrés**: aucune SLO/SLA (temps de chargement, FPS cible, taux de succès d'exécution d'EXE) n'est définie.
2. **Périmètre de compatibilité prioritaire**: liste officielle des exécutables critiques absente (démo vs production réelle).
3. **Politique sécurité opérationnelle**: pas de politique documentée sur CSP, isolation iframe/worker, gestion des uploads malveillants, ni revue sécurité formelle.
4. **Contexte réglementaire**: aucune exigence RGPD, export control, conformité entreprise ou contrainte légale d'hébergement explicitée.
5. **Environnements de déploiement exacts**: Cloudflare Pages est suggéré, mais pas confirmé comme unique cible.
6. **Stratégie d'observabilité**: aucun standard de logs, erreurs, métriques, traces, ni pipeline d'alerting documenté.
7. **Politique de versioning et de release**: absence de convention de branches, semver, gates de release, rollback.
8. **Politique de tests minimale obligatoire**: pas de baseline écrite (unitaires, headless exe-tests, non-régression).
9. **Budget performance/mémoire**: aucun plafond navigateur mobile/desktop explicite.
10. **Modèle de menace officiel**: risques explicitement acceptés/refusés non documentés (DOS CPU, payloads malformés, abuse Web APIs).

# PROJECT CONTEXT

## Purpose
RetroTick exécute des exécutables Windows/DOS classiques (PE/NE/MZ) directement dans le navigateur, sans installation locale. Le projet existe pour offrir une compatibilité d'exécution et de rendu suffisante pour des applications historiques via émulation x86 + API Win32/Win16/DOS. La priorité est la fiabilité d'exécution progressive, pas la fidélité parfaite.

## Non-Goals
- Ce projet ne vise pas la compatibilité 100% Windows ni la certification de conformité API complète.
- Ce projet ne vise pas l'exécution native hors navigateur (pas de runtime desktop natif officiel).
- Ce projet ne doit pas devenir une sandbox de sécurité forte pour binaires non fiables.
- Ce projet ne couvre pas les DRM, anti-cheat, drivers kernel, ou logiciels modernes dépendants de NT avancé.
- Ce projet ne promet pas une UX moderne prioritaire sur la robustesse de l'émulation.

## Target Environment
- OS/Runtime: navigateurs modernes avec ES2020, Canvas/WebGL2, IndexedDB; build via Node.js + Vite.
- Environnement cible: web public (HYPOTHÈSE), déploiement statique CDN/edge, compatible Cloudflare Pages (indice script `deploy`).
- Contraintes d'exécution:
  - Latence perçue acceptable au chargement d'un EXE de démonstration (HYPOTHÈSE: <3s sur desktop moyen).
  - Fonctionnement offline non garanti.
  - Mémoire limitée par onglet navigateur; éviter allocations non bornées.
  - Sécurité de base navigateur (same-origin, sandbox JS), sans isolation système forte.

## Architecture Overview
- Stack: TypeScript + Preact + Vite (rolldown-vite), Tailwind v4, application front-end monolithique.
- Cœur technique:
  - Émulateur x86 en TypeScript (`src/lib/emu/x86/*`).
  - Loaders PE/NE/MZ + parsing ressources (`src/lib/pe/*`, `src/lib/emu/*-loader.ts`).
  - Couche compat API Win32/Win16 modulaire (`src/lib/emu/win32/*`, `src/lib/emu/win16/*`).
  - UI desktop simulée et composants Windows-like (`src/components/*`, `src/components/win2k/*`).
- Pattern assumé: architecture en couches orientée compatibilité, avec stubs API incrémentaux.
- Volontairement simple: app mono-repo front sans backend obligatoire.
- Volontairement complexe: interprétation instruction-par-instruction x86, thunking Win32/Win16, rendu GDI/OpenGL.

## Constraints (NON NEGOTIABLE)
- Ne jamais casser la chaîne principale: parse binaire → chargement mémoire → exécution CPU → dispatch API → rendu UI.
- Ne jamais modifier silencieusement la sémantique des opcodes x86 sans test ciblé et justification explicite.
- Ne jamais introduire de dépendance qui impose un backend obligatoire pour l'exécution locale navigateur.
- Ne jamais remplacer les valeurs de constantes Windows par des nombres magiques non nommés.
- Ne jamais accepter une régression de build TypeScript/Vite (`npm run build`).
- Toute extension API doit préserver la compatibilité du comportement existant (retours, stackBytes, conventions d'appel).

## Coding Rules
- Style:
  - TypeScript strict pragmatique; noms explicites; fonctions courtes; zéro logique cachée.
  - Préférer `const` nommées pour flags, messages, opcodes, erreurs.
  - Interdire `any` nouveau (aligné avec ESLint).
- Patterns préférés:
  - Enregistrement API explicite par module (`register('Func', nArgs, handler)`).
  - Gestion d'erreur défensive avec retours déterministes côté émulation.
  - Changements localisés au module concerné (pas de refactor global opportuniste).
- Patterns interdits:
  - Refactor massif non demandé.
  - Couplage circulaire entre couche UI et cœur émulateur.
  - Écriture disque/réseau implicite hors mécanismes existants.
- Erreurs:
  - Toute condition inconnue doit produire un signal explicite (log de diagnostic), pas un échec silencieux.
  - En émulation, privilégier "degrade gracefully" contrôlé plutôt que crash navigateur.
- Logging/observabilité:
  - Logs orientés diagnostic technique (thunks, opcodes, APIs manquantes).
  - Interdire les logs verbeux permanents dans le hot path de production sans garde.

## Dependency Policy
- Autorisées:
  - Dépendances légères front-end, maintenues, compatibles ESM navigateur, valeur claire.
  - Outils build/lint TypeScript nécessaires au maintien de qualité.
- Interdites:
  - Dépendances natives Node obligatoires à l'exécution navigateur.
  - Dépendances non maintenues ou à surface de risque sécurité élevée sans mitigation.
  - Frameworks lourds introduits sans nécessité prouvée.
- Politique d'ajout:
  - Ajouter uniquement si gain concret mesurable (fiabilité, sécurité, maintenance).
  - Documenter impact bundle/perf/sécurité et stratégie de rollback.
  - Validation humaine obligatoire pour toute nouvelle dépendance runtime.

## Security Model
- Modèle de menace (HYPOTHÈSE): utilisateur charge des exécutables potentiellement malformés ou hostiles, mais exécutés dans sandbox navigateur JS.
- Actifs sensibles:
  - Intégrité de l'application web.
  - Disponibilité UI (éviter freeze/DoS CPU mémoire).
  - Données locales stockées IndexedDB (fichiers importés).
- Hypothèses de sécurité:
  - Pas d'échappement natif hors navigateur.
  - Le risque principal est logique (plantage, consommation ressources, corruption état émulateur), pas RCE système.
- Mesures minimales obligatoires:
  - Validation défensive des offsets/tailles lors du parsing binaire.
  - Bornage des lectures/écritures mémoire émulée.
  - Refus explicite des entrées invalides; pas de confiance implicite dans les headers PE/NE/MZ.
  - Pas de secrets applicatifs codés en dur côté client.
- Non traité volontairement:
  - Protection anti-malware complète.
  - Confidentialité forte des données locales côté poste utilisateur compromis.

## AI USAGE RULES
- Autorisé sans validation humaine:
  - Corrections locales de bugs clairement reproduits.
  - Ajout de stubs/API manquantes à faible risque dans un module isolé.
  - Amélioration de lisibilité locale sans changer le comportement.
- Validation explicite requise:
  - Changement d'architecture, de modèle mémoire, de stratégie de rendu.
  - Ajout/suppression de dépendance runtime.
  - Modification des conventions d'appel, ABI interne, ou formats persistés.
- Strictement interdit:
  - Changements silencieux de comportement.
  - Refactors globaux déguisés en "cleanup".
  - Suppression de garde-fous de sécurité/perf pour "faire passer" un EXE.
- Obligations:
  - Toute hypothèse doit être taguée `HYPOTHÈSE`.
  - Tout risque doit être explicité (impact + zone affectée).
  - Toute zone inconnue doit être marquée `Inconnu / Risque`.

## Decision Log (Initial)
- **Décision**: Conserver un front-end monolithique TypeScript/Preact sans backend obligatoire.  
  **Raison**: réduire surface opérationnelle et faciliter exécution locale.  
  **Alternatives rejetées**: backend d'émulation distant.  
  **Trade-off**: limites perf/mémoire client acceptées.
- **Décision**: Couche API Win32/Win16 par modules avec stubs incrémentaux.  
  **Raison**: permet progression par compatibilité réelle observée.  
  **Alternatives rejetées**: implémentation exhaustive upfront.  
  **Trade-off**: comportement incomplet assumé sur long terme.
- **Décision**: Build unique `npm run build` comme gate minimale actuelle.  
  **Raison**: pipeline simple et rapide.  
  **Alternatives rejetées**: matrice de tests lourde immédiate.  
  **Trade-off**: risque de régression fonctionnelle non détectée automatiquement.
- **Dette technique consciente**: absence de SLO, test strategy formelle, threat model validé sécurité.
- **À revalider**: budget performance, politique de logs production, exigences conformité légale, priorisation officielle des EXE.

## How to Extend Safely
- Où ajouter du code:
  - Nouveau parsing ressource: `src/lib/pe/` via extracteur dédié.
  - Nouvelle API Win32/Win16: module DLL concerné dans `src/lib/emu/win32/` ou `src/lib/emu/win16/`.
  - Ajustement UI: composants ciblés dans `src/components/` sans impacter le cœur CPU.
- Où ne pas toucher sans nécessité critique:
  - `src/lib/emu/x86/dispatch.ts`, `cpu.ts`, `decode.ts`.
  - Gestion mémoire centrale `src/lib/emu/memory.ts`.
  - Thunks PE/NE (`emu-thunks-pe.ts`, `emu-thunks-ne.ts`).
- Règles d'ajout feature:
  - Isoler la feature par couche (parseur, émulateur, API, UI).
  - Préserver interfaces et signatures existantes.
  - Ajouter garde-fous d'erreur aux frontières d'entrée.
  - Éviter toute mutation d'état global non documentée.
- Zones sensibles:
  - ABI thunk et stack discipline (`stackBytes`, stdcall/cdecl).
  - Traduction OpenGL→WebGL (fragile aux régressions visuelles/perf).
  - File system IndexedDB (risques de persistance corrompue).
