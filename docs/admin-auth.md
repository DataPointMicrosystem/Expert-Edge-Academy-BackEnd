Admin login returns the JWT in the `Authorization` response header used by `/api/admin/*` routes, not in the JSON response body.

# Admin Account Setup And Login

The public student/instructor signup endpoint does not allow the `admin` role. Initial admin creation is a separate one-time bootstrap route guarded by a secret configured only on the backend. It stops working after any admin account exists. Admin login then returns the normal JWT used by `/api/admin/*` routes.

## One-Time Initial Admin Setup

1. Generate a long random bootstrap secret on a trusted machine, for example with `openssl rand -hex 32`.
2. Set it as `ADMIN_BOOTSTRAP_SECRET` in the backend environment. Never put this value in frontend code, a URL, source control, or a client-visible `.env`.
3. From a trusted admin setup tool (or an API client used only by the operator), call:

```http
POST /api/auth/admin-sign-up
Content-Type: application/json
X-Admin-Bootstrap-Secret: <ADMIN_BOOTSTRAP_SECRET>
```

```json
{
  "fullName": "Academy Administrator",
  "email": "admin@example.com",
  "password": "use-a-unique-password-at-least-12-characters"
}
```

The endpoint creates a verified admin with a bcrypt-hashed password and returns the public user object, but intentionally does not issue a JWT. It returns `409 ADMIN_ALREADY_CONFIGURED` if an admin already exists and `503 ADMIN_BOOTSTRAP_UNAVAILABLE` when no bootstrap secret is configured. Remove `ADMIN_BOOTSTRAP_SECRET` from the environment after the initial account is created. Keep the route disabled except during the controlled first-admin setup window.

Success response:

```json
{
  "success": true,
  "message": "Initial admin account created. Sign in to continue.",
  "data": {
    "user": {
      "id": "...",
      "fullName": "Academy Administrator",
      "email": "admin@example.com",
      "role": "admin",
      "isVerified": true
    }
  }
}
```

## Admin Login

```http
POST /api/auth/admin-login
Content-Type: application/json
```

```json
{
  "email": "admin@example.com",
  "password": "the-admin-password"
}
```

Success response:

```http
Authorization: Bearer <JWT>
```

```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "user": {
      "id": "...",
      "fullName": "Academy Administrator",
      "email": "admin@example.com",
      "role": "admin",
      "isVerified": true
    }
  }
}
```

The login response includes `Authorization: Bearer <JWT>` as an HTTP response header. The JSON body contains only the user object. A browser frontend may read the header because the backend exposes it with CORS; store it only in the frontend's existing session strategy and send it as the request `Authorization` header for admin routes, including `POST /api/admin/subscription-plans`. Postman still displays response headers, so this keeps the token out of the JSON body but does not conceal it from the API client or its operator. The endpoint searches only for a user whose role is `admin`, and rejects unverified, suspended, inactive, or incorrect-password accounts with `401 ADMIN_LOGIN_INVALID`.

## Existing Admin Accounts

If an admin already exists in the database, bootstrap is intentionally closed. Sign in with `POST /api/auth/admin-login`. If no admin exists but an account should be promoted, use a controlled database operation by an authorized operator, then use admin login. Do not add a public role-change endpoint.

`ADMIN_BOOTSTRAP_SECRET` is documented in `.env.example`. The bootstrap secret is separate from `JWT_SECRET` and must be high entropy. The application-wide rate limiter applies to both auth routes.
