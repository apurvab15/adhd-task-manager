# adhd-task-manager

Google form for inferring subtype: https://forms.gle/yoQKsMZj8q2wUzUz6 

## Deployment

This project is configured for deployment on Vercel. See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the repository in [Vercel Dashboard](https://vercel.com/dashboard)
3. Set the **Root Directory** to `frontend` in project settings
4. Set the **Root Directory** to `frontend` in Vercel project settings (in the dashboard, not in vercel.json)
5. Add environment variable `GOOGLE_API_KEY` in Vercel project settings
6. Deploy!

Your app will be live at `https://your-project-name.vercel.app`

## Local Development

```bash
cd frontend
npm install
npm run dev
```

Create a `frontend/.env.local` file with:
```
GOOGLE_API_KEY=your_api_key_here
```
