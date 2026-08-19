# STEP 66A — PRODUCTION AUTH URL AUDIT REPORT

**Project:** AI Academic Advisor — An Intelligent Campus Memory  
**Date:** 2026-08-20  
**Production Domain:** `https://advisor.smmah.me`  
**Status:** Audit Complete  

---

## 1. AUDIT SUMMARY & ANSWERS

| Audit Question | Finding | Technical Details |
| :--- | :--- | :--- |
| **1. Does the app hardcode `localhost`?** | **NO** | 0 occurrences of `localhost:3000` or hardcoded local origins in application code. All redirects use relative route paths (`/dashboard`, `/login`). |
| **2. Does it hardcode the old Vercel URL?** | **NO** | 0 occurrences of `vercel.app` domains in application source files. |
| **3. Does it use `redirectTo`?** | **NO** | 0 calls to `redirectTo`. Authentication uses direct password sign-in and admin pre-confirmed signup server actions without OAuth / Magic Link query redirects. |
| **4. What exact Supabase Site URL should be used?** | **`https://advisor.smmah.me`** | Set in Supabase Dashboard $\rightarrow$ Authentication $\rightarrow$ URL Configuration $\rightarrow$ **Site URL**. |
| **5. What exact production Redirect URL should be allowed?** | **`https://advisor.smmah.me/**`** | Set in Supabase Dashboard $\rightarrow$ Authentication $\rightarrow$ URL Configuration $\rightarrow$ **Redirect URLs**. |

---

## 2. CODEBASE AUDIT FINDINGS

### A. Search for Hardcoded URLs & Environment Variables
- `localhost:3000`: **0 matches** found in `src/`
- `vercel.app`: **0 matches** found in `src/`
- `NEXT_PUBLIC_SITE_URL`: **0 matches** found in `src/`
- `NEXT_PUBLIC_VERCEL_URL`: **0 matches** found in `src/`
- `redirectTo`: **0 matches** found in `src/`

### B. Authentication Implementation Analysis (`src/app/login/actions.ts`)
```typescript
// Login flow:
export async function login(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect('/login?error=Invalid_Credentials')
  revalidatePath('/', 'layout')
  redirect('/dashboard') // Native Next.js relative redirect
}

// Signup flow:
export async function signup(formData: FormData) {
  const adminClient = createAdminClient()
  await adminClient.auth.admin.createUser({ email, password, email_confirm: true })
  await supabase.auth.signInWithPassword({ email, password })
  revalidatePath('/', 'layout')
  redirect('/dashboard') // Native Next.js relative redirect
}

// Logout flow:
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login') // Native Next.js relative redirect
}
```

### C. Middleware Session Refresh Analysis (`src/utils/supabase/middleware.ts`)
- Middleware uses `request.nextUrl.clone()` with relative pathname overrides (`url.pathname = '/login'`, `url.pathname = '/dashboard'`).
- The domain origin is dynamically derived from the incoming request `NextRequest`, making it 100% agnostic to custom domains (`https://advisor.smmah.me`).

---

## 3. EXACT SUPABASE AUTH CONFIGURATION INSTRUCTIONS

In your Supabase Dashboard:

1. Navigate to **Authentication** $\rightarrow$ **URL Configuration**.
2. **Site URL:**
   ```
   https://advisor.smmah.me
   ```
3. **Redirect URLs (Allow list):**
   Add the following entries:
   ```
   https://advisor.smmah.me/**
   https://advisor.smmah.me/dashboard
   https://advisor.smmah.me/login
   http://localhost:3000/** (for local development)
   ```
4. Click **Save**.

---

## 4. CONCLUSION

The application architecture is completely free of hardcoded hostnames or legacy Vercel URLs. Setting the Supabase Site URL to `https://advisor.smmah.me` and allowing `https://advisor.smmah.me/**` satisfies all production authentication requirements.
