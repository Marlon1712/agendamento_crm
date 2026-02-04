# Sistema de Agendamento (Manicure CRM)

Um sistema completo de agendamento profissional (estilo Calendly) desenvolvido com **Next.js 14** e **MySQL**.

## Estrutura do Projeto

- **/app**: Páginas e rotas (Next.js App Router).
  - **/booking**: Assistente de agendamento (Público).
  - **/admin**: Painel administrativo (Protegido).
  - **/api**: Endpoints da API (Backend).
- **/lib**: Utilitários (Conexão DB, Auth).
- **/scripts**: Scripts de configuração.
- **schema.sql**: Estrutura do Banco de Dados.

## Pré-requisitos

1. **Node.js** 18+ instalado.
2. **MySQL** rodando localmente (XAMPP, Laragon, ou Docker).

## Configuração

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure o Banco de Dados:**
   Crie um arquivo `.env.local` na raiz com suas credenciais:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=agenda_crm
   JWT_SECRET=super-segredo-mude-isso
   ```

3. **Inicialize as Tabelas:**
   Rode o script para criar o banco e as tabelas:
   ```bash
   node scripts/init-db.js
   ```

4. **Crie um Usuário Admin:**
   Acesse seu MySQL e rode:
   ```sql
   USE agenda_crm;
   -- Senha é 'admin123' (hash bcrypt para exemplo)
   INSERT INTO users (email, password) VALUES ('admin@admin.com', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa');
   ```


## Rodando com Docker (Recomendado)

1. **Subir o ambiente:**
   ```bash
   docker-compose up -d --build
   ```
   Isso irá subir o App (porta 3000) e o MySQL (porta 3306) automaticamente.
   O banco deados será inicializado automaticamente com o `schema.sql`.

2. **Acessar:**
   - App: http://localhost:3000
   - Admin Login: `admin@admin.com` / `admin123` (usuário criado via seed no schema ou manualmente se preferir)

## Rodando Localmente (Sem Docker)

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse:
- **Agendamento (Público):** http://localhost:3000
- **Painel Admin:** http://localhost:3000/admin/login
  - Login: `admin@admin.com`
  - Senha: `admin123`

## Funcionalidades

- **Lead**: Escolha de dia e hora (validação de conflitos), Cadastro de dados.
- **Admin**: Dashboard com métricas, Lista de agendamentos, Cancelar/Confirmar reuniões.
