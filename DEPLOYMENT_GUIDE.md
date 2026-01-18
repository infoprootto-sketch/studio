# Deployment Guide

This guide provides the steps to push your latest updates to a Git repository and deploy the application to Firebase Hosting.

## Step 1: Push Your Code to GitHub (or another Git provider)

First, you need to save your work to a remote repository. This is crucial for version control and collaboration.

1.  **Initialize Git (if you haven't already):**
    If this is a new project without a repository, run this command in your terminal:
    ```bash
    git init
    ```

2.  **Add a remote repository:**
    You need to tell Git where to push your code. You can get this URL from your Git provider (like GitHub). If you have already done this, you can skip this step.
    ```bash
    # Replace the URL with your own repository's URL
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
    ```

3.  **Stage, Commit, and Push your changes:**
    These commands will save your current code and upload it to your remote repository.

    ```bash
    # Stage all changes
    git add .

    # Create a commit with a message describing the changes
    git commit -m "feat: Implement final fixes for guest portal and team member creation"

    # Push the changes to the 'main' branch of your remote repository
    git push -u origin main
    ```

## Step 2: Deploy to Firebase Hosting

Your project is already configured for easy deployment to Firebase.

1.  **Run the deploy command:**
    This command will build your Next.js application and deploy it to Firebase Hosting.

    ```bash
    npm run deploy
    ```

    This command executes the script defined in your `package.json` file: `firebase deploy --only hosting --project staycentralv2-67504826-2d582`.

2.  **Done!**
    After the command finishes, your application will be live on Firebase Hosting. The terminal will provide you with the URL to your live site.
