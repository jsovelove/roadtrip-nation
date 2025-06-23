# GitHub Pages Deployment Guide

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

## 🚀 Automatic Deployment (Recommended)

### Setup (One-time)

1. **Enable GitHub Pages in your repository**:
   - Go to your repository settings
   - Scroll to "Pages" section
   - Source: Select "GitHub Actions"

2. **Push your code**:
   ```bash
   git add .
   git commit -m "Add GitHub Actions deployment"
   git push origin main
   ```

3. **That's it!** 🎉
   - The GitHub Action will automatically build and deploy
   - Your site will be available at: `https://<username>.github.io/roadtrip-nation/`

### How It Works

- **Trigger**: Automatic deployment on every push to `main` or `master` branch
- **Build**: Uses Node.js 18, installs dependencies, and runs `npm run build`
- **Deploy**: Uploads the `dist` folder to GitHub Pages
- **URL**: Your site will be at `https://<username>.github.io/roadtrip-nation/`

## 📝 Manual Deployment

If you prefer manual deployment, you can use:

```bash
npm run deploy
```

This will:
1. Build the project
2. Remind you to push to trigger automatic deployment

## 🔧 Configuration

### Repository Name

If your repository is named something other than "roadtrip-nation", update `vite.config.js`:

```javascript
export default defineConfig({
  // ... other config
  base: '/your-repo-name/', // Change this to match your repo name
})
```

### Branch Configuration

The GitHub Action is configured to deploy from:
- `main` branch (primary)
- `master` branch (fallback)

If you use a different branch, update `.github/workflows/deploy.yml`:

```yaml
on:
  push:
    branches: [ your-branch-name ]
```

## 📁 File Structure

```
.github/
  workflows/
    deploy.yml          # GitHub Actions workflow
docs/
  DEPLOYMENT_GUIDE.md   # This file
vite.config.js          # Base URL configuration
package.json            # Deploy script
```

## 🔍 Monitoring Deployment

1. **Check Actions tab** in your GitHub repository
2. **View deployment status** in real-time
3. **See build logs** if there are any issues

## 🛠️ Troubleshooting

### Common Issues

1. **404 on GitHub Pages**:
   - Check that `base` in `vite.config.js` matches your repository name
   - Ensure GitHub Pages is enabled in repository settings

2. **Build fails**:
   - Check the Actions tab for error logs
   - Ensure all dependencies are in `package.json`
   - Test build locally with `npm run build`

3. **Firebase functions not working**:
   - This is expected - GitHub Pages only serves static files
   - Your cloud functions will continue to work from Firebase
   - Only the frontend will be served from GitHub Pages

### Environment Variables

GitHub Pages only serves static files, so:
- ✅ **Firebase config**: Safe to include (client-side keys)
- ❌ **Server secrets**: Already secured in cloud functions
- ✅ **Build-time variables**: Work normally

## 🌐 Custom Domain (Optional)

To use a custom domain:

1. **Add CNAME file** to `public/` folder:
   ```
   your-domain.com
   ```

2. **Configure DNS** at your domain provider:
   - Add CNAME record pointing to `<username>.github.io`

3. **Enable in GitHub settings**:
   - Repository Settings → Pages → Custom domain

## 🔄 Workflow Commands

### Force Deploy
```bash
git commit --allow-empty -m "Force deploy"
git push origin main
```

### Manual Trigger
Go to Actions tab → "Deploy to GitHub Pages" → "Run workflow"

## 📊 Security & Performance

- ✅ **API Keys**: Properly secured (cloud functions only)
- ✅ **HTTPS**: Automatically enabled by GitHub Pages
- ✅ **CDN**: GitHub's global CDN for fast loading
- ✅ **Caching**: Automatic browser caching for assets

## 🎯 Quick Commands

```bash
# Test build locally
npm run build
npm run preview

# Deploy (builds + reminds to push)
npm run deploy

# Force deployment
git push origin main

# Check deployment status
# Visit: https://github.com/<username>/roadtrip-nation/actions
```

Your Roadtrip Nation application is now ready for seamless GitHub Pages deployment! 🚀 