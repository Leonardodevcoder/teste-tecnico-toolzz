# Teste Técnico Toolzz

> Desafio Técnico Full Stack - NestJS + Next.js

Bem-vindo ao repositório do **Teste Técnico Toolzz**, uma plataforma educacional moderna com chat em tempo real, autenticação segura e gerenciamento de usuários.


---

## 🚀 Tecnologias

O projeto foi desenvolvido utilizando um **Monorepo Nx** para organizar Frontend e Backend de forma eficiente.

### Backend (API)
- **Framework**: NestJS (Node.js)
- **Banco de Dados**: PostgreSQL
- **ORM**: Prisma
- **Autenticação**: JWT + Passport + Google OAuth2
- **Real-time**: Socket.IO (WebSockets)
- **Segurança**: Argon2 (Hashing), Helmet, CORS
- **Documentação**: Swagger (OpenAPI)

### Frontend (Web)
- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Validação**: Zod + React Hook Form
- **UI Components**: Lucide React, Sonner (Toasts)
- **Estado**: React Context + Hooks Customizados

---

## ✨ Funcionalidades

### 🔐 Autenticação e Segurança
- Login com E-mail e Senha (Hash Argon2)
- Login Social com Google OAuth2
- Autenticação de Dois Fatores (2FA) via Aplicativo (Google Authenticator)
- Proteção de Rotas com JWT (Guards)

### 💬 Chat em Tempo Real
- Salas de Bate-papo (Grupos)
- Conversas Privadas (Direct Messages)
- Histórico de Mensagens persistido no Banco
- Indicador de Digitação ("User is typing...")
- Lista de Usuários Online em Tempo Real
- Busca de Mensagens

### 👥 Gerenciamento de Usuários (Admin)
- Listagem com Filtros e Paginação
- Criação, Edição e Exclusão de Usuários
- Controle de Perfis (Aluno, Professor, Admin)

### 🤖 Assistente IA (Chatbot)
- Integração com LLM para responder dúvidas educacionais
- Comandos de Ajuda (`/help`, `/ask`)

---

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js (v18+)
- Docker (opcional, para rodar o banco localmente)
- PostgreSQL (se não usar Docker)

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/teste-tecnico-toolzz.git
cd teste-tecnico-toolzz
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo e preencha com suas credenciais:
```bash
cp .env.example .env
```
> **Nota:** Para funcionalidade completa (Google Login), você precisará criar credenciais no [Google Cloud Console](https://console.cloud.google.com/).

### 4. Configurar Banco de Dados
```bash
# Se usar Docker para subir o banco:
docker-compose up -d

# Rodar Migrations do Prisma
npx prisma migrate dev --name init
```

### 5. Rodar a Aplicação

#### Modo Desenvolvimento (Frontend + Backend)
```bash
npx nx run-many --target=serve --all
```
- **Backend API:** `http://localhost:3000/api`
- **Frontend App:** `http://localhost:4200` (ou a porta que o Next.js indicar)

#### Rodar Separadamente
```bash
# Backend
npx nx serve api

# Frontend
npx nx serve web
```

---

## 📚 Documentação da API (Swagger)

A API possui documentação interativa gerada automaticamente pelo Swagger.

1. Inicie o Backend (`npx nx serve api`)
2. Acesse: **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

Lá você pode testar todos os endpoints (Auth, Users, Chat) e ver os esquemas de dados (DTOs).

### Coleção Postman
Você pode importar a especificação OpenAPI diretamente no Postman:
1. Acesse `/api/docs-json` para obter o JSON.
2. No Postman -> Import -> Link -> Cole a URL do JSON.

---

## 🚢 Deploy

### Frontend (Vercel)
O Frontend é otimizado para Vercel.
1. Conecte seu repositório GitHub na Vercel.
2. Defina o **Root Directory** como `apps/web` (se necessário, ou raiz com configuração Nx).
3. Adicione as Variáveis de Ambiente (`NEXT_PUBLIC_API_URL`).

### Backend (Railway / Render)
O Backend é uma aplicação Node.js padrão.
1. Use o `Dockerfile` (se disponível) ou build nativo (`npm run build`).
2. Defina as Variáveis de Ambiente (`DATABASE_URL`, `JWT_SECRET`).
3. Certifique-se de aplicar as migrations no banco de produção (`npx prisma migrate deploy`).

---

## 🧪 Testes

O projeto conta com testes unitários e de integração.

```bash
# Rodar todos os testes
npx nx run-many --target=test --all

# Testes E2E (se configurado)
npx nx e2e web-e2e
```