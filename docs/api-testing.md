# API Testing and Verification

## Automated Results

| Check                                               | Result  | Notes                                                                               |
| --------------------------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| Express application module load                     | PASS    | All current controllers, models, routes, services, and utilities load successfully. |
| JavaScript syntax checks                            | PASS    | `node --check` passed for backend source files.                                     |
| `GET /api/health`                                   | PASS    | Returns HTTP 200 without requiring MongoDB.                                         |
| Unknown route envelope                              | PASS    | Returns HTTP 404 with `ROUTE_NOT_FOUND`.                                            |
| Swagger/OpenAPI JSON                                | PASS    | Available at `/api/openapi.json`.                                                   |
| Swagger UI                                          | PASS    | Available at `/api/docs`.                                                           |
| Database-backed routes while MongoDB is unavailable | PASS    | Return HTTP 503 with `DATABASE_UNAVAILABLE` without waiting for Mongoose buffering. |
| MongoDB connection                                  | PASS    | Current configured URI connects successfully.                                       |
| `GET /api/courses` with MongoDB                     | PASS    | Returns an empty paginated result against the live database.                        |
| `GET /api/categories` with MongoDB                  | PASS    | Returns an empty category list against the live database.                           |
| Registration with database persistence              | NOT RUN | Requires a disposable test account and configured email behavior.                   |
| Login/password verification                         | NOT RUN | Requires a seeded/disposable test account.                                          |
| Course CRUD and approval                            | NOT RUN | Requires authenticated instructor/admin fixtures.                                   |
| Kora verification                                   | BLOCKED | Requires MongoDB and `KORA_SECRET_KEY`; never mocked as successful.                 |
| Cloudinary uploads                                  | BLOCKED | Requires Cloudinary credentials and upload fixture.                                 |
| Brevo email delivery                                | BLOCKED | Optional credentials are not configured; local API continues without crashing.      |

## MongoDB Diagnosis

Current failure:

```text
Error: queryTxt ESERVFAIL cluster0.znp39sl.mongodb.net
```

This is DNS/SRV resolution failure, not a Mongoose schema error. The current `.env` must contain a valid Atlas SRV hostname and the machine must be able to resolve it.

Recovery steps:

1. Confirm the Atlas cluster is running and copy a fresh connection string from Atlas **Connect -> Drivers**.
2. Replace `MONGODB_URI` in the local `.env` with the fresh value. Do not commit `.env`.
3. Confirm DNS resolution:

```bash
nslookup -type=SRV _mongodb._tcp.cluster0.znp39sl.mongodb.net
```

4. If SRV resolution remains unavailable, use Atlas's non-SRV connection string or configure a working DNS resolver/network.
5. Ensure the current IP is allow-listed in Atlas Network Access.
6. Re-run the bounded connection check:

```bash
node -e "require('dotenv').config(); const mongoose=require('mongoose'); mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:8000}).then(()=>{console.log('mongodb-connected');return mongoose.disconnect();}).catch(error=>{console.error(error.name+': '+error.message);process.exitCode=1;});"
```

## External-Service Verification Requirements

- Kora: set `KORA_SECRET_KEY`, initialize a sandbox payment, verify through `/api/payments/verify/:reference`, and confirm enrollment is created only after server-side success.
- Brevo: set `brevo_api_key` and sender variables, then exercise verification/password-reset notifications.
- Cloudinary: set the three Cloudinary variables, then test authenticated `POST /api/media/upload` with a multipart `file` field.

No external service is reported as passing until it has been exercised with real configured credentials.
