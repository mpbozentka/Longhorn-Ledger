# Supabase setup for Longhorn Ledger

Rounds are saved to Supabase so golfers can see their stats on any device. Follow these steps once.

---

## 1. Create a Supabase project

1. Go to **[supabase.com](https://supabase.com)** and sign in (or create an account).
2. Click **New project**.
3. Choose your **organization** (or create one).
4. Set:
   - **Name:** e.g. `longhorn-ledger`
   - **Database password:** choose a strong password and store it somewhere safe.
   - **Region:** pick one close to you.
5. Click **Create new project** and wait until the project is ready.

---

## 2. Create the `rounds` table

1. In the Supabase dashboard, open your project.
2. In the left sidebar, go to **SQL Editor**.
3. Click **New query**.
4. Open the file **`supabase/rounds-table.sql`** in this repo, copy its contents, and paste them into the SQL editor.
5. Click **Run** (or press Cmd/Ctrl + Enter).
6. You should see “Success. No rows returned.” The `rounds` table and index are now created.

---

## 3. Get your API keys

1. In the Supabase dashboard, go to **Project Settings** (gear icon in the sidebar).
2. Open the **API** section.
3. You’ll see:
   - **Project URL** — use this as `NEXT_PUBLIC_SUPABASE_URL`.
   - **Project API keys:**
     - **anon public** — not used for this app.
     - **service_role** — use this as `SUPABASE_SERVICE_ROLE_KEY`.  
       ⚠️ Keep this secret. Only use it in server-side code (e.g. Next.js API routes). Do not expose it in the browser.

---

## 4. Add environment variables

1. In your app root, open **`.env.local`** (create it if it doesn’t exist).
2. Add (replace with your real values):

```env
# Supabase (from Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Restart your dev server so it picks up the new variables.

---

## 5. Install dependencies

If you haven’t already:

```bash
npm install
```

(This installs `@supabase/supabase-js`, which is already listed in `package.json`.)

---

## Done

- **Submit Round** in the app now saves to Supabase.
- The dashboard loads rounds from Supabase for the signed-in user.
- Data is tied to the Clerk user id (`user_id` in the `rounds` table).

If something fails, check the browser Network tab for `/api/rounds` and the terminal where `npm run dev` is running for server errors.
