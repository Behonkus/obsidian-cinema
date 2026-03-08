# Obsidian Cinema - Desktop App Build Guide

## Automatic Builds (GitHub Actions)

The Windows installer is automatically built when you:
1. **Create a Release** on GitHub
2. **Manually trigger** from the Actions tab

### Setup Steps:

1. **Push code to GitHub** using "Save to GitHub" in Emergent

2. **Update the GitHub username** in `frontend/package.json`:
   ```json
   "publish": {
     "provider": "github",
     "owner": "YOUR_GITHUB_USERNAME",  // Change this!
     "repo": "obsidian-cinema"
   }
   ```

3. **Add Repository Secret** (for auto-updates):
   - Go to: Settings → Secrets → Actions
   - Add `BACKEND_URL` = your deployed app URL (e.g., `https://obsidian-cinema.emergentagent.com`)

4. **Create a Release**:
   - Go to: Releases → "Create new release"
   - Tag: `v1.0.0`
   - Title: `Obsidian Cinema v1.0.0`
   - Click "Publish release"
   - Wait ~5 minutes for the build
   - Download the `.exe` from the release assets!

### Manual Trigger:
- Go to: Actions → "Build Windows App" → "Run workflow"
- Enter version number → Click "Run workflow"
- Download from Artifacts when complete

---

## Manual Build (on Windows PC)

### Prerequisites:
- Node.js 18+ (https://nodejs.org)
- Yarn (`npm install -g yarn`)
- Git

### Build Steps:

```bash
# Clone your repo
git clone https://github.com/YOUR_USERNAME/obsidian-cinema.git
cd obsidian-cinema

# Install dependencies
cd frontend
yarn install

# Set your backend URL
set REACT_APP_BACKEND_URL=https://your-app.emergentagent.com

# Build the installer
yarn electron:build
```

### Output:
```
frontend/dist/Obsidian Cinema Setup 1.0.0.exe
```

---

## Version Updates

To release a new version:

1. Update version in `frontend/package.json`:
   ```json
   "version": "1.1.0"
   ```

2. Commit and push the change

3. Create a new GitHub Release with tag `v1.1.0`

4. Users with the app will automatically see an update notification!

---

## Troubleshooting

### Build fails with "electron-builder" error
- Make sure you're on Windows or using GitHub Actions
- Linux/Mac cannot build Windows `.exe` without Wine

### App can't connect to backend
- Check `REACT_APP_BACKEND_URL` is set correctly
- Make sure your web app is deployed and accessible

### Auto-update not working
- Verify the GitHub repo is public OR you've set up a `GH_TOKEN`
- Check the publish config matches your GitHub username/repo
