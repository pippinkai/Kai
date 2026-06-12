# 🚀 Production Deployment Guide: Netlify & GitHub Integration

This document walks you through the steps to set up a production-ready deployment pipeline connecting this application with **GitHub** and **Netlify** under continuous delivery.

---

## 📦 Prerequisites

1. Fully configured and working Firebase Project (see [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)).
2. A free or premium account on [GitHub](https://github.com).
3. A free tier or team account on [Netlify](https://netlify.com).

---

## 🛠 Step 1: Push Your Code to a GitHub Repository

1. Initialize a Git repository inside your local workspace:
   ```bash
   git init
   ```
2. Stage and commit all source project files (excluding generated folders or sensitive tokens filtered by `.gitignore`):
   ```bash
   git add .
   git commit -m "Initialize PNU HR Portal with production-ready security rules"
   ```
3. Create a public or private repository on GitHub, map it, and push your branch:
   ```bash
   git remote add origin https://github.com/your-username/pnu-hr-portal.git
   git branch -M main
   git push -u origin main
   ```

---

## 🌩 Step 2: Deploy to Netlify (Continuous Deployment)

1. Sign in to your **Netlify Dashboard** and select **Add new site** -> **Import an existing project**.
2. Select **GitHub** as your git provider and authorize Netlify to access your repositories.
3. Choose the repository `pnu-hr-portal` from your repository list.
4. Configure your site's deployment parameters:
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **Deploy site**.

> 💡 **Note on Routing Integration**: This project includes a pre-configured `netlify.toml` file in the root directory. This configures Netlify's reverse proxy redirect rules (`[[redirects]]`) to handle SPA route fallback, pointing all request pathways safely to `/index.html` preventing immediate `404 Not Found` page errors during browser refreshes.

---

## 🔐 Step 3: Configure Environment Variables on Netlify

Since Vite bundles parameters into client javascript bundles during compilation, you must provide your live Firebase production keys in Netlify's environment environment.

1. Go to your Netlify site page -> **Site settings** -> **Environment variables**.
2. Click **Add a variable** and define the following variables precisely matching your credentials:
   - `VITE_FIREBASE_API_KEY`: *(your live API Key)*
   - `VITE_FIREBASE_AUTH_DOMAIN`: `your-project.firebaseapp.com`
   - `VITE_FIREBASE_PROJECT_ID`: `your-project-id`
   - `VITE_FIREBASE_STORAGE_BUCKET`: `your-project.appspot.com`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: *(your 12-digit Sender ID)*
   - `VITE_FIREBASE_APP_ID`: *(your App ID `1:xxxx:web:xxxx`)*
   - `VITE_FIREBASE_FIRESTORE_DATABASE_ID`: `default`
3. Click **Save variables**.
4. To trigger a fresh build applying these configurations, navigate to the **Deploys** tab and choose **Trigger deploy** -> **Clear cache and deploy site**.

Your site will be compiled, assets will be prepared under high-performance Netlify edge networks, and your client can log in securely!
