# Vercel Deployment Guide

This project is now configured for deployment on Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. A Google Generative AI API key (get one from https://makersuite.google.com/app/apikey)

## Deployment Steps

### 1. Connect Your Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your Git repository (GitHub, GitLab, or Bitbucket)
4. Select the repository `adhd-task-manager`

### 2. Configure Project Settings

**IMPORTANT**: In the project configuration, set the **Root Directory** to `frontend`. This is a critical step!

Vercel should auto-detect Next.js, but verify these settings:

- **Framework Preset**: Next.js
- **Root Directory**: `frontend` (set this in the Vercel dashboard, not in vercel.json)
- **Build Command**: `npm run build` (or leave default)
- **Output Directory**: `.next` (or leave default)
- **Install Command**: `npm install` (or leave default)

### 3. Set Environment Variables

In the Vercel project settings, go to **Settings → Environment Variables** and add:

```
GOOGLE_API_KEY=your_actual_api_key_here
```

Make sure to add this for all environments (Production, Preview, and Development).

### 4. Deploy

Click "Deploy" and Vercel will:
- Install dependencies
- Build your Next.js application
- Deploy it to a production URL

Your app will be available at `https://your-project-name.vercel.app`

## Local Development

For local development, create a `frontend/.env.local` file:

```bash
GOOGLE_API_KEY=your_api_key_here
```

Then run:

```bash
cd frontend
npm install
npm run dev
```

## Important Notes

- **API Routes**: Unlike GitHub Pages (which required static export), Vercel supports Next.js API routes natively. Your `/api/break-tasks` and `/api/classify` routes will work perfectly.

- **Environment Variables**: Never commit your `.env.local` file. It's already in `.gitignore`.

- **Automatic Deployments**: Vercel will automatically deploy when you push to your main branch, and create preview deployments for pull requests.

## Troubleshooting

- If API routes don't work, verify that `GOOGLE_API_KEY` is set in Vercel environment variables
- Check Vercel build logs if deployment fails
- Ensure the root directory is set to `frontend` in Vercel project settings (this must be configured in the dashboard, not in vercel.json)

