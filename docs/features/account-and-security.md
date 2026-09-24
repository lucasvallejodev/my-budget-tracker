# Account and security

> Summary: creating your CoinKeeper account, signing in and out, editing your name and email, changing your password, seeing and ending sessions on other devices, and what to do about a forgotten password; plus how sessions and cookies protect your data.

CoinKeeper has its own accounts: there is no third-party sign-in. Your email and password are stored by the API (the password only as an argon2id hash), and a browser stays signed in through a session cookie.

## Step by step

### Create an account

1. Open the app. Without a session you land on **Sign in to CoinKeeper**; follow **Create one** under the form.
2. Enter your name (optional), your email and a password of 12 to 128 characters, then repeat the password.
3. Submit. The app creates your account, your settings (primary currency EUR, which you can change in **Settings › Currencies**) and the [default categories](../reference/default-taxonomy.md), signs you in and opens the dashboard.

An email can be used by one account only; a taken email is reported under the form.

<!-- screenshot: "Create your CoinKeeper account" form with name, email and both password fields (docs/assets/screenshots/account-sign-up.png) -->

### Sign in

1. Enter your email and password on the sign-in page and submit.
2. You return to the page you were trying to open, or to the dashboard.

A wrong email and a wrong password give the same message, so the form does not reveal which emails have accounts. More than ten sign-in attempts in a minute from the same address are refused until the minute has passed.

<!-- screenshot: "Sign in to CoinKeeper" form with the link to create an account (docs/assets/screenshots/account-sign-in.png) -->

### Sign out

Open the account menu (your initials, bottom of the sidebar or top right on a phone) and choose **Sign out**. The session ends on the server and the browser forgets the cookie. The same menu shows your name and email and links to **Settings** and **Deleted items**.

<!-- screenshot: open account menu with initials avatar, name, email, Settings, Deleted items and Sign out (docs/assets/screenshots/account-user-menu.png) -->

### Edit your name or email

1. Go to **Settings › Profile**.
2. Change **Name** (shown in the account menu) or **Email** (the address you sign in with) and save.

<!-- screenshot: Settings › Profile with the name and email form (docs/assets/screenshots/account-profile.png) -->

### Change your password

1. Go to **Settings › Security**.
2. Under **Change password**, enter the current password, then the new one twice (at least 12 characters).
3. Save. Every other device where you were signed in is signed out; this one stays signed in.

A wrong current password is refused and nothing changes.

### See and end sessions

**Settings › Security › Active sessions** lists every browser signed in to your account, with the browser and system, when it was last active and from which IP address. The one you are using is marked **This device**. Click **Sign out** next to any other session to end it immediately.

<!-- screenshot: Settings › Security with the password form and a session list of two devices (docs/assets/screenshots/account-security.png) -->

### Forgotten password

There is no reset email yet. Ask whoever runs your CoinKeeper server (on your own machine, that is you) to run:

```bash
npm run user:reset-password -- you@example.com
```

It asks for the new password (or reads `NEW_PASSWORD` from the environment), sets it and signs the account out everywhere. Then sign in with the new password.

## How it works

- **Sessions.** Signing up or in creates a row in `sessions` and sends a random token in a cookie. The database keeps only a SHA-256 hash of the token. A session lasts 30 days (`SESSION_DAYS`) and is extended automatically while you keep using the app; signing out or ending it from the session list deletes it, and changing the password deletes every other session.
- **The cookie** is `HttpOnly` (page scripts cannot read it), `SameSite=Lax` (other sites cannot make your browser send it with their requests) and, in production, `Secure` with the `__Host-` prefix (`__Host-ck_session`). In local development over plain HTTP it is called `ck_session`.
- **Who checks what.** The web app's page guard (`apps/web/src/proxy.ts`) only looks for the cookie and sends visitors without one to the sign-in page. The API checks the session on every request and answers `401` otherwise; the web app then sends you to sign in, remembering the page you were on (only pages of this site are accepted as the return address).
- **Other protections.** Writes are accepted only from the app's own origin (`ALLOWED_ORIGINS`), no other site can read API responses (no CORS allow-list by default), sign-up, sign-in and password changes are rate limited, and every record is filtered by your user id.
- **Endpoints.** `POST /api/v1/auth/sign-up`, `/auth/sign-in`, `/auth/sign-out`; `GET` and `PATCH /api/v1/me`; `PUT /api/v1/me/password`; `GET /api/v1/me/sessions` and `DELETE /api/v1/me/sessions/:id`. See the [REST API reference](../reference/rest-api.md#health-and-authentication).

The full description of sessions, cookie attributes and the protection layers is in [API service](../architecture/api.md#sign-up-sign-in-and-sessions).
