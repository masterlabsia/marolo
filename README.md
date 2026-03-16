# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Setup local com Supabase

O frontend usa o Supabase diretamente (auth + tabelas). Para evitar erro **404 em `/rest/v1/perfis`** e conseguir logar e ver dados:

1. Crie um projeto em [Supabase](https://supabase.com) e configure as variáveis no frontend (`.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`).
2. No painel do Supabase, abra **SQL Editor** → **New Query**.
3. Copie e execute todo o conteúdo do arquivo **`backend/src/db/schema.sql`** (cria as tabelas `perfis`, `jogadores`, `jogos`, `membros`, `caixa`, `pagamentos`, `presencas`, etc.).
4. Se aparecer na URL `#error=access_denied&error_code=otp_expired` (link de e-mail expirado), o app agora limpa a URL, faz sign out e exibe um aviso; entre com **e-mail e senha** na tela de login.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
