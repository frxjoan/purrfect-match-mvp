# Backend Manual QA Checklist

Scope: Flask REST API only. Do not use frontend pages for this checklist.

## Setup

Run from the repository root:

```bash
cd ~/purrfect-match-mvp
docker compose up -d --build
docker compose exec backend flask db upgrade
```

Optional automated checks before manual QA:

```bash
docker compose exec backend pytest app/tests
bash scripts/api_smoke_tests.sh
```

Use either:

- Postman collection: `docs/purrfect-match-backend.postman_collection.json`
- Environment: `docs/purrfect-match-backend.postman_environment.json`
- Curl smoke test: `scripts/api_smoke_tests.sh`

## Execution Log

- Date:
- Tester:
- API base URL: `http://localhost:5000/api/v1`
- Backend image/build:
- Database migration status:
- Result: Not executed

## Checklist

### Health

- [ ] `GET /api/v1/health` returns `200`.
- [ ] Response has `success: true`.
- [ ] Response has `data.status: ok`.

### Auth

- [ ] Register customer with a unique email returns `201`.
- [ ] Login customer returns `200` and a JWT token.
- [ ] Register breeder candidate with a unique email returns `201`.
- [ ] Login breeder candidate returns `200` and a JWT token.
- [ ] Duplicate email registration returns `409`.
- [ ] Invalid credentials return `401`.

### Breeder Certification

- [ ] Authenticated user can submit breeder application with certification file.
- [ ] Missing certification file returns `400`.
- [ ] Non-admin cannot approve/reject certification and receives `403`.
- [ ] Admin can approve certification.
- [ ] Approved breeder can create listings.
- [ ] Pending/unverified breeder cannot create listings and receives `403`.

### Listings

- [ ] Verified breeder can create listing with required fields and image.
- [ ] Created listing returns `success: true` and an `id`.
- [ ] `GET /listings` returns visible non-archived listings.
- [ ] Filters work: `breed`, `location`, `min_price`, `max_price`, `gender`, `age_max`.
- [ ] Invalid `gender` returns `400`.
- [ ] Invalid negative `price` returns `400`.
- [ ] Invalid negative `age_months` returns `400`.
- [ ] Archived listing is not returned as a public listing.

### Conversations And Messages

- [ ] Customer can start conversation for an available listing.
- [ ] Breeder cannot start a conversation on their own listing.
- [ ] Customer can send a message in their conversation.
- [ ] Breeder linked to listing can reply.
- [ ] Customer can read messages.
- [ ] Breeder can read messages.
- [ ] User outside the conversation receives `403`.
- [ ] Empty message returns `400`.
- [ ] User cannot mark their own message as read.
- [ ] Recipient can mark message as read.

### Reviews

- [ ] Customer can create one review for breeder.
- [ ] Public `GET /breeders/<id>/reviews` returns reviews.
- [ ] Review rating `1..5` accepted.
- [ ] Rating `0`, `6`, `4.5`, boolean, and string values are rejected.
- [ ] Duplicate review from same user to same breeder returns `409`.
- [ ] Breeder cannot review their own profile.
- [ ] Review author can update review.
- [ ] Non-author cannot update/delete review.
- [ ] Review author can delete review.

### Listing Reports

- [ ] Authenticated user can report a non-archived listing.
- [ ] Anonymous user receives `401`.
- [ ] Listing owner cannot report own listing and receives `403`.
- [ ] Invalid report reason returns `400`.
- [ ] Duplicate report by same user/listing returns `409`.
- [ ] Admin can list pending reports.
- [ ] Admin can view report detail.
- [ ] Admin can accept a report.
- [ ] Admin can reject a report.
- [ ] Non-admin cannot access report moderation endpoints.

### Account Restrictions

- [ ] Admin can suspend user with `expires_at`.
- [ ] Suspended user cannot login while suspension is active.
- [ ] Admin can lift suspension.
- [ ] Lifted user can login again.
- [ ] Admin can ban user.
- [ ] Banned user cannot login.
- [ ] Banned email cannot register again while restriction exists.
- [ ] Banning a breeder archives all active breeder listings.

## Notes / Defects

- [ ] No blocker found.
- [ ] Defects recorded separately with endpoint, request body, response body, and expected result.
