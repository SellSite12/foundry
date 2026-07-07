# Push to GitHub + connect Netlify

## Step 1 — Log into GitHub (one time, in your terminal)

Open a terminal in this folder and run:

```powershell
gh auth login
```

Choose:
- **GitHub.com**
- **HTTPS**
- **Login with a web browser** (copy the code it shows, press Enter, paste in browser)

## Step 2 — Create repo and push (run in this folder)

```powershell
cd C:\Users\vince\OneDrive\Desktop\foundry
gh repo create foundry --public --source=. --remote=origin --push
```

If the name `foundry` is taken, use your username:

```powershell
gh repo create hilarious-platypus-foundry --public --source=. --remote=origin --push
```

## Step 3 — Connect Netlify to GitHub

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. **GitHub** → authorize Netlify if asked
3. Select your **foundry** repository
4. Build settings are read from `netlify.toml` automatically
5. **Before deploy:** Site configuration → **Environment variables** → **Import from .env**
6. Upload `netlify-env.import` (create with `npm run export:netlify-env`)
7. **Deploy site**

## If you already have site `hilarious-platypus-d57cfb`

1. Site → **Site configuration** → **Build & deploy** → **Link repository**
2. Connect GitHub → select this repo
3. Import env vars from `netlify-env.import`
4. **Trigger deploy**

## Your live URL

https://hilarious-platypus-d57cfb.netlify.app
