
This repository contains a description on how to use the Tauri v2 Updater with a Deno proxy server. The guide explains how to set up the project, configure Tauri for auto-updates, and set up the Deno server to manage update assets.

## Steps to Set Up

1. **Create a Tauri Project**  
   Follow the instructions from [Tauri's Quick Start Guide](https://v2.tauri.app/start/create-project/) to create your project.

2. **Setup Tauri Updater**  
   Add the Tauri updater plugin by following this guide:  
   [Tauri Updater Documentation](https://v2.tauri.app/plugin/updater/)

3. **Include the Updater in Your Front-End**  
   Add the updater code to your frontend for checking updates.  
   Refer to [Updater JavaScript API](https://v2.tauri.app/plugin/updater/#checking-for-updates).

4. **Set Up GitHub Build Action**  
   To automate building and releasing your app on GitHub, create a GitHub Actions workflow:

   - Inside your Tauri project, navigate to `.github/workflows/`.
   - Create a new file `build.yml` (see the example of `build.yml` in this repository that publishes a release for a tag commit that starts with `v*.*.*`).

5. **Create a GitHub Personal Access Token (PAT Classic)**  
   Go to [GitHub Token Settings](https://github.com/settings/tokens), generate a new token, and copy it somewhere temporarily as you'll need it for the Deno project.

6. **Sign in to Deno Deploy**  
   Go to [Deno Deploy](https://deno.com/deploy) and sign in with your GitHub account.

7. **Create a New Playground in Deno**  
   On your Deno account overview page, create a "New Playground" (let me know if you find a better way with 'New Project'). 

8. **Add Server Code**  
   Paste the code from `server.ts` (in this repository) into the playground, and update it with your repository details (owner, repo name).

9. **Add GitHub Token to Deno Project**  
   Go to Deno Project -> Settings -> Environment Variables, and add your GitHub PAT token as a new environment variable.

10. **Update Deno Code**  
    Ensure the Deno code uses the correct environment variable name for the GitHub token added in the previous step.

11. **Update Tauri Configuration in `tauri.conf.json`**  
    Update the Tauri configuration to use the Deno project link:

```json
  "plugins": {
    "updater": {
      "active": true,
      "dialog": false,
      "pubkey": "myPuBKEYTaURi",
      "endpoints": ["https://my-deno-project.deno.dev/download/{{target}}/{{arch}}/{{current_version}}"]
    }
  }





