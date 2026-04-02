# Skill: Release

## Purpose
Gerar release notes, versionar o projeto e preparar artefatos de deploy.

## Trigger
Use quando: "prepare o release", "gere release notes", "versionamento"

## Versioning — SemVer
- MAJOR: breaking change
- MINOR: nova feature, backwards-compatible
- PATCH: bugfix

## Release Checklist
- [ ] Todos os testes passando
- [ ] CHANGELOG.md atualizado
- [ ] Versao bumped em package.json
- [ ] ADRs documentadas se houve decisoes arquiteturais
- [ ] Runbook de deploy revisado

## CHANGELOG Format
```
## [x.y.z] - YYYY-MM-DD

### Added
-

### Changed
-

### Fixed
-

### Removed
-
```
