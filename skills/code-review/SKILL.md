# Skill: Code Review

## Purpose
Realizar code review estruturado com foco em qualidade, seguranca e manutenibilidade.

## Trigger
Use quando: "revise este codigo", "faca code review", "o que voce mudaria aqui?"

## Process

### 1. Security Scan
- Verificar inputs sem sanitizacao
- Identificar secrets hardcoded
- Avaliar superficie de ataque

### 2. Code Quality
- DRY (Don't Repeat Yourself)
- SRP (Single Responsibility Principle)
- Complexidade ciclomatica elevada

### 3. Performance
- N+1 queries
- Loops desnecessarios
- Chamadas sincronas onde async seria mais eficiente

## Output Format
```
## Code Review -- [arquivo/funcao]

### CRITICO
- [problema] -> [sugestao de fix]

### MELHORIAS
- [problema] -> [sugestao]

### POSITIVO
- [o que esta bem feito]
```
