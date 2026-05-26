# Complete setup guide (beginner)

Your Supabase project: **hinyfdtvcfrbknlewwxt**  
Dashboard: https://supabase.com/dashboard/project/hinyfdtvcfrbknlewwxt

---

## Part A — Run the website on your computer

### Step 1: Open the project folder in Cursor

Folder path:
```
C:\Users\HP\Downloads\kisan-credit-verde-main\kisan-credit-verde-main
```

### Step 2: Open the terminal in Cursor

Menu: **Terminal → New Terminal**

### Step 3: Install packages (only once)

Type and press Enter:

```powershell
npm install
```

Wait until it finishes (no red errors).

### Step 4: Start the website

```powershell
npm run dev
```

You will see something like:

```
Local: http://localhost:5174/
```

**Remember that number** (5173 or 5174). Open that link in Chrome or Edge.

### Step 5: Stop the website

In the terminal press **Ctrl + C**.

---

## Part B — Database tables (farmers, tokens, purchases)

### Step 1: Open SQL Editor

https://supabase.com/dashboard/project/hinyfdtvcfrbknlewwxt/sql/new

### Step 2: Paste the big SQL script

Use the full script from the chat / your teacher — it creates `farmers`, `carbon_tokens`, `purchases`.

### Step 3: Click **Run**

You should see **Success**.

### Step 4: Check tables exist

https://supabase.com/dashboard/project/hinyfdtvcfrbknlewwxt/editor

You should see 3 tables: **farmers**, **carbon_tokens**, **purchases**.

---

## Part C — Email login (create account + sign in)

### Step 1: Enable email

https://supabase.com/dashboard/project/hinyfdtvcfrbknlewwxt/auth/providers

- Click **Email**
- Make sure it is **Enabled**
- For easy testing: turn **OFF** “Confirm email”
- Click **Save**

### Step 2: Set redirect URLs

https://supabase.com/dashboard/project/hinyfdtvcfrbknlewwxt/auth/url-configuration

| Field | What to type |
|--------|----------------|
| **Site URL** | `http://localhost:5174` (use the port from `npm run dev`) |
| **Redirect URLs** | Add each line below (one per line), then **Save** |

```
http://localhost:5173/auth/callback
http://localhost:5174/auth/callback
http://127.0.0.1:5173/auth/callback
http://127.0.0.1:5174/auth/callback
```

### Step 3: Test on the website

1. Run `npm run dev` and open the Local URL.
2. Click **Sign in** (top right).
3. Click **Create account** → enter email + password (6+ characters) → **Create Account**.
4. You should see a green message: **please sign in**.
5. Click **Sign in** → same email + password → **Sign In**.
6. You should land on **Register farm** (शेताची नोंदणी).

---

## Part D — Google login (optional)

### Step 1: Google Cloud — create OAuth app

1. Go to https://console.cloud.google.com/
2. Create or select a project.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
4. If asked, configure **OAuth consent screen** (External, add your email as test user).
5. Application type: **Web application**.
6. **Authorized redirect URIs** — add **only this**:

   ```
   https://hinyfdtvcfrbknlewwxt.supabase.co/auth/v1/callback
   ```

7. Click **Create** and copy **Client ID** and **Client Secret**.

### Step 2: Supabase — turn on Google

https://supabase.com/dashboard/project/hinyfdtvcfrbknlewwxt/auth/providers

- Click **Google** → **Enable**
- Paste Client ID and Client Secret → **Save**

### Step 3: Test

1. On the login page click **Continue with Google**.
2. Pick your Google account.
3. You should return to the site and see **Register farm**.

If it fails, check Part C Step 2 redirect URLs again.

---

## Part E — Cursor + Supabase MCP (for AI help)

Already done if you have `.cursor/mcp.json` with your token.

1. **Restart Cursor** completely (close and open).
2. **Settings → MCP** → **supabase** should be green/on.
3. Open a **new chat** and ask: “List my Supabase tables.”

**Security:** Never share your `sbp_...` token in chat. If you did, revoke it at https://supabase.com/dashboard/account/tokens and create a new one.

---

## Part F — Register a farm (after login)

1. You must be **signed in**.
2. Go to **Register** in the menu.
3. Fill the form — **Taluka** is a dropdown (Nagpur district only).
4. Click **Capture GPS** (allow location in the browser).
5. Click **Submit**.

---

## Common problems

| Problem | Fix |
|--------|-----|
| Blank page / Supabase error | Check `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| Google login returns to login with error | Add redirect URLs from Part C Step 2 |
| “Invalid login credentials” | Wrong password, or email not confirmed — turn off confirm email in Part C |
| Port 5174 but Supabase only has 5173 | Add `http://localhost:5174/auth/callback` in redirect URLs |
| Farm submit fails | Run Part B SQL script again |
| MCP not working | Restart Cursor, new chat, check Settings → MCP |

---

## Quick checklist

- [ ] `npm install` done  
- [ ] `npm run dev` works in browser  
- [ ] SQL script ran (3 tables exist)  
- [ ] Email provider on, confirm email off (for testing)  
- [ ] Redirect URLs include 5173 and 5174  
- [ ] Create account → Sign in → Register farm works  
- [ ] (Optional) Google provider configured  
