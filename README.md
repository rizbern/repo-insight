# RepoManager

RepoManager is a centralized GitHub Organization repository lifecycle management tool. It is designed for Tech Leads and Administrators to automatically manage test repositories, enforce retention policies, and maintain a strict, tamper-proof audit log of repository and collaborator activity.

## Key Features

- **Automated Lifecycle Management:** Automatically deletes or archives repositories that match a specific prefix (e.g., `pt-*`) after a configurable retention period (default 90 days).
- **Dashboard & Insights:** A sleek interface providing real-time statistics, a list of active repositories, and warnings for repositories nearing their expiration date.
- **Dynamic Configuration:** Administrators can change the retention period, warning thresholds, repository prefix, and default expiry action (Archive vs Delete) on the fly.
- **Repository Overrides:** Need to keep a test repo around longer? Set manual expiration overrides for specific repositories with a required justification.
- **Tamper-Proof Audit Log:** Tracks all critical events—including configuration changes, manual overrides, and GitHub webhook events (like adding/removing collaborators or deleting repos)—to ensure accountability.
- **Strict Authentication:** Authenticates users via GitHub OAuth, explicitly verifying Organization membership and ensuring that a valid Smee webhook is configured before allowing access.

---

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, React Router
- **Backend:** NestJS, TypeScript
- **Database:** PostgreSQL, Prisma ORM
- **Integrations:** GitHub API (`@octokit/rest`), GitHub OAuth (`passport-github2`), Webhook Proxy (`smee-client`)

---

## Initial Setup Guide

Follow these steps to set up the project for local development.

### 1. Database Setup
You need a running instance of PostgreSQL (either installed locally or hosted via Neon.tech / Supabase).
1. Create a database named `repomanager`.
2. Keep the connection string handy (e.g., `postgresql://postgres:password@localhost:5432/repomanager?schema=public`).

### 2. GitHub App & Tokens Configuration
To integrate with GitHub, you need an OAuth App and a Personal Access Token (PAT).

**Create an OAuth App:**
1. Go to your GitHub Profile -> **Settings** -> **Developer Settings** -> **OAuth Apps**.
2. Click **New OAuth App**.
3. Set the **Homepage URL** to `http://localhost:5173`.
4. Set the **Authorization callback URL** to `http://localhost:3000/auth/github/callback`.
5. Generate and save the **Client ID** and **Client Secret**.

**Create a Personal Access Token (PAT):**
1. Go to **Developer Settings** -> **Personal access tokens** -> **Tokens (classic)**.
2. Generate a new token.
3. **Required Scopes:** `repo`, `admin:org`, `admin:org_hook`, `delete_repo`, `read:user`.
4. Copy the generated `ghp_...` token.

### 3. Webhook Setup
To receive GitHub events locally, we use a proxy.
1. Go to [smee.io](https://smee.io/) and click **Start a new channel**. Copy the Webhook Proxy URL.
2. Go to your GitHub **Organization Settings** -> **Webhooks**.
3. Click **Add webhook**.
4. Paste the Smee URL as the **Payload URL**.
5. Set **Content type** to `application/json`.
6. Select **Send me everything** and click **Add webhook**.

### 4. Environment Variables
Create a `.env` file inside the `backend/` directory and populate it with your keys:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/repomanager?schema=public"

# GitHub OAuth Credentials
CLIENT_ID="your_oauth_client_id"
CLIENT_SECRET="your_oauth_client_secret"
GITHUB_CALLBACK_URL="http://localhost:3000/auth/github/callback"

# Backend GitHub Token
GITHUB_TOKEN="your_personal_access_token_with_org_hook_scope"
ALLOWED_GITHUB_USERS="your-github-org-name"

# Security & Webhook
JWT_SECRET="your_super_secret_jwt_key"
GITHUB_WEBHOOK_SECRET="local-dev-webhook-secret"
WEBHOOK_PROXY_URL="https://smee.io/your_smee_channel_id"

# Frontend Integration
FRONTEND_URL="http://localhost:5173"
```

### 5. Install & Run
Open two terminal windows—one for the backend and one for the frontend.

**Terminal 1: Backend**
```bash
cd backend
npm install
npx prisma db push       # Syncs your database schema
npx prisma generate      # Generates Prisma client
npm run start:dev        # Starts the NestJS server on port 3000
```

**Terminal 2: Frontend**
```bash
cd frontend
npm install
npm run dev              # Starts the Vite React server on port 5173
```

### 6. Log In
1. Open your browser and navigate to `http://localhost:5173`.
2. Click **Continue with GitHub**.
3. Ensure you grant the OAuth app access to your Organization on the GitHub consent screen.
4. Once authenticated, you will be redirected to your dashboard!
