# Skill: Notebook

## Purpose
Registrar aprendizados e referências do usuário em arquivos markdown organizados por contexto em `.pxto/`.

## Trigger
- **Automático:** usuário diz "caderno", "anote no caderno", "anota isso", "/notebook"
- **Com pergunta prévia:** Claude identifica conteúdo que merece registro (novo comando aprendido, conceito explicado, decisão de arquitetura) — perguntar antes de criar

## Regras

- Diretório: `/home/peixoto/Documentos/VSCODE_PROJ/marolo/.pxto/`
- Nomenclatura: `notebook-{contexto}.md`
- Se o arquivo do contexto já existir, **atualizar** — não criar duplicata
- Se o arquivo não existir, **criar**
- Nunca criar sem autorização explícita ou resposta positiva à pergunta

## Contextos comuns

| Contexto | Arquivo |
|---|---|
| Git | `notebook-git.md` |
| Supabase / banco local | `notebook-supabase.md` |
| Terminal / Linux | `notebook-terminal.md` |
| Docker | `notebook-docker.md` |
| React / frontend | `notebook-frontend.md` |
| TypeScript | `notebook-typescript.md` |

Se o contexto não se encaixar nos acima, criar um novo com nome descritivo.

## Fluxo quando o usuário pede

1. Identificar o contexto pelo assunto da conversa
2. Verificar se o arquivo já existe em `.pxto/`
3. Se existir: atualizar com o novo conteúdo na seção correta
4. Se não existir: criar com header e conteúdo organizado
5. Confirmar ao usuário o que foi salvo e onde

## Fluxo quando Claude identifica

1. Perguntar: "Isso merece ir pro caderno? Posso salvar em `.pxto/notebook-{contexto}.md`"
2. Só criar/atualizar se o usuário confirmar

## Formato do arquivo

```markdown
# {Contexto} — Referência

## {Seção}

conceito ou comando com explicação curta

```bash
comando --exemplo   # o que faz
```
```
