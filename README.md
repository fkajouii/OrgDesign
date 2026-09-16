# OrgDesign

## Setting up "Sign in with Google" (Drive-connected sheets)

This lets teammates pick a private Google Sheet from their own Drive
instead of using a public link. Access is controlled entirely by normal
Google Drive sharing — this app never stores or proxies the data.

1. In [Google Cloud Console](https://console.cloud.google.com/), create (or
   reuse) a project, then enable the **Google Sheets API**, **Google Drive
   API**, and **Google Picker API** under "APIs & Services".
2. Configure the **OAuth consent screen** (External or Internal, depending
   on whether you want to restrict this to a Google Workspace domain).
   Add the `.../auth/spreadsheets` and `.../auth/drive.file` scopes.
3. Under "Credentials", create an **OAuth 2.0 Client ID** of type "Web
   application". Add both your local dev URL
   (`http://localhost:5173`) and your GitHub Pages URL
   (`https://<user>.github.io`) under "Authorized JavaScript origins".
4. Create an **API key** (used by the Picker only) and restrict it to the
   Google Picker API, with an HTTP referrer restriction matching the same
   two origins.
5. Locally: copy `.env.example` to `.env.local` and fill in
   `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_API_KEY`.
6. For the deployed site: add the same two values as repository secrets
   (Settings → Secrets and variables → Actions) named
   `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_API_KEY` — the deploy workflow
   already picks them up at build time.

Neither value is a secret in the traditional sense (they end up in the
client-side bundle either way), but the origin/referrer restrictions above
are what actually keep the OAuth flow locked to your domains.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
