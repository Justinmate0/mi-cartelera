---
name: commit
description: Crea un commit en formato Conventional Commits con los cambios que están en staging. Úsala cuando el usuario quiera guardar su trabajo en git.
disable-model-invocation: true
---

# Commit

1. Ejecuta `git diff --staged --stat` y `git diff --staged`, y lee los cambios.
2. Si no hay nada en staging, avisa y detente. Nunca hagas `git add` por tu cuenta.
3. Si los cambios incluyen `.env`, `.env.local` o algo que parezca una clave (`sb_secret_`, `service_role`, un token largo de TMDB o un JWT), detente y avisa sin mostrar el valor.
4. Si el cambio implementa un ticket, el ámbito es su id: `feat(NP-04): …`. Si es documentación, usa el área: `docs(prd): …`, `docs(backlog): …`, `docs(specs): …`.
5. Escribe el mensaje en formato `tipo(ámbito): resumen`, en español, en minúsculas y con máximo 72 caracteres en la primera línea. Tipos: feat, fix, docs, test, refactor, style, chore.
6. Muestra el mensaje y haz el commit. Nunca hagas push.
