# marketing-ascom

Hub de Agentes IA · Marketing ICTDF — agentes, campanhas, calendário editorial, aprovação de artes,
tarefas, fluxos de projeto e contatos, com login e níveis de acesso.

- Front-end: `index.html`
- APIs serverless (Vercel): pasta `api/`
- Banco: Neon Postgres (Vercel → Storage → Neon)

## Variáveis de ambiente (Vercel)

| Variável | Obrigatória | Para que serve |
| --- | --- | --- |
| `DATABASE_URL` | sim | Criada automaticamente ao conectar o Neon pela aba Storage |
| `AUTH_SECRET` | sim | Chave longa e aleatória que assina as sessões |
| `ADMIN_PASSWORD` | sim (1º deploy) | Senha inicial do admin `ADMIN_EMAIL` (padrão `ascom@ictdf.org.br`) |
| `APP_URL` | recomendada | Endereço público, usado nos links de redefinição de senha |
| `SUPERADMIN_PASSWORD` | opcional | Cria a conta Admin Geral (`thiago.silverio@ictdf.org.br`) se ainda não existir |
| `SMTP_*` ou `RESEND_API_KEY` + `EMAIL_FROM` | opcional | Envio do e-mail de "Esqueci minha senha" |

Detalhes em [backend.md](backend.md).

## Desenvolvimento

```bash
npm install
npm run test:api
npx vercel dev
```
