# Déploiement Bettr → Vercel + Neon

## 1. Neon Postgres

1. Créer un compte sur [console.neon.tech](https://console.neon.tech).
2. Créer un projet "bettr".
3. Récupère **deux** connection strings (Settings → Connection details) :
   - `DATABASE_URL` (Pooled, format `postgresql://...?sslmode=require&pgbouncer=true`)
   - `DIRECT_URL` (Direct, format `postgresql://...?sslmode=require`) — utilisée pour les migrations.

## 2. OAuth apps

### Google
- [console.cloud.google.com](https://console.cloud.google.com) → nouveau projet
- APIs & Services → OAuth consent screen (External, ton email en test user)
- Credentials → Create credentials → OAuth client ID → Web application
- Authorized redirect URIs :
  - `http://localhost:3000/api/auth/callback/google`
  - `https://<ton-domaine-vercel>/api/auth/callback/google`
- Note `Client ID` et `Client Secret`.

### GitHub
- [github.com/settings/developers](https://github.com/settings/developers) → OAuth Apps → New OAuth App
- Authorization callback URL :
  - `http://localhost:3000/api/auth/callback/github` (un par app, tu peux en créer une seconde pour la prod)
- Note `Client ID` + génère `Client Secret`.

## 3. Bascule du schéma vers Postgres

Le projet utilise SQLite en local par défaut. Pour passer en Postgres :

```bash
# Met les Neon URLs dans .env (DATABASE_URL + DIRECT_URL)
npm run schema:postgres
# Édite prisma.config.ts pour ajouter directUrl (voir ci-dessous)
npx prisma migrate dev --name init
npm run db:seed
```

Dans `prisma.config.ts`, le bloc `datasource` devient :
```ts
datasource: {
  url: process.env["DATABASE_URL"],
  directUrl: process.env["DIRECT_URL"],
},
```

Pour revenir en SQLite local : `npm run schema:sqlite`.

## 4. Repo Git + Vercel

```bash
git init && git add -A && git commit -m "init"
gh repo create bettr --private --source=. --remote=origin --push
# ou pousse manuellement sur GitHub

# Vercel
npm i -g vercel
vercel link        # crée le projet
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add AUTH_SECRET production           # openssl rand -base64 32
vercel env add AUTH_GOOGLE_ID production
vercel env add AUTH_GOOGLE_SECRET production
vercel env add AUTH_GITHUB_ID production
vercel env add AUTH_GITHUB_SECRET production
vercel env add ODDS_API_KEY production
vercel env add ODDS_SPORT_KEY production
vercel env add CRON_SECRET production           # openssl rand -base64 32
vercel env add AUTH_TRUST_HOST production       # value: "true"
vercel env add NEXTAUTH_URL production          # value: https://<ton-domaine>.vercel.app

vercel --prod
```

Vercel utilisera `npm run vercel-build` qui exécute `prisma migrate deploy && prisma generate && next build`.

## 5. Vérification post-deploy

- Visite `https://<domaine>.vercel.app` → redirigé vers `/login`
- Connexion Google → arrive sur l'accueil
- Crée un groupe, génère un lien d'invitation, ouvre-le en navigation privée
- Vérifie les crons dans Vercel UI → tab "Crons" → "Run Now"

## 6. Ajouts post-MVP (à faire plus tard)

- Sentry pour observabilité
- Cache Redis (Upstash) pour les leaderboards
- Push notifications pour les invitations
- Domaine custom
