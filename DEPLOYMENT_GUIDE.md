# Deployment Guide

This guide provides the exact commands to push your latest updates to a Git repository and deploy the application to Firebase Hosting.

**Please run these commands in your terminal one by one.**

---

### Step 1: Add Your Remote Repository

You need to tell Git where to push your code. You only need to do this once.

```bash
# IMPORTANT: Replace the URL with your own repository's URL
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
```

**Note:** If you see an error that says `fatal: remote origin already exists.`, that's okay! It just means you've already set this up. You can safely continue to the next step.

---

### Step 2: Stage, Commit, and Force Push Your Changes

Because your local repository history may be out of sync, we will use a "force push". This will overwrite the history on the remote repository with your current local code.

**Warning:** Use force push with caution. Only proceed if you are certain your local code is the version you want to save.

1.  **Stage all your latest changes:**
    ```bash
    git add .
    ```

2.  **Create a new commit with a message:**
    ```bash
    git commit -m "Deploying latest updates after fixes"
    ```

3.  **Force push the changes to the 'main' branch:**
    ```bash
    git push --force origin main
    ```

After the push is successful, you can proceed to the final step.

---

### Step 3: Deploy to Firebase Hosting

This command will build your application and deploy it.

```bash
npm run deploy
```

Once this command finishes, your application will be live! The terminal will show you the URL.
