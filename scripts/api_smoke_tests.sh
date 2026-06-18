#!/usr/bin/env bash
#
# Local Docker API smoke tests for Purrfect Match.
#
# Usage:
#   cd ~/purrfect-match-mvp
#   docker compose up -d --build
#   docker compose exec backend flask db upgrade
#   bash scripts/api_smoke_tests.sh
#
# Optional:
#   API=http://localhost:5000/api/v1 bash scripts/api_smoke_tests.sh
#   KEEP_SMOKE_DATA=1 bash scripts/api_smoke_tests.sh

set -euo pipefail

API="${API:-http://localhost:5000/api/v1}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_PATH="${ROOT_DIR}/test/images/cat.png"
SUFFIX="$(date +%Y%m%d%H%M%S)-$$"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-purrfect_match}"

TMP_DIR="$(mktemp -d)"
LAST_BODY="${TMP_DIR}/last_body.json"
LAST_STATUS="${TMP_DIR}/last_status.txt"

CUSTOMER_EMAIL="customer-${SUFFIX}@smoke.test"
BREEDER_EMAIL="breeder-${SUFFIX}@smoke.test"
UNVERIFIED_EMAIL="unverified-${SUFFIX}@smoke.test"
OTHER_EMAIL="other-${SUFFIX}@smoke.test"
ADMIN_EMAIL="admin-${SUFFIX}@smoke.test"
PASSWORD="password123"

pass() {
  echo "PASS: $*"
}

fail() {
  echo "FAIL: $*" >&2
  if [[ -s "${LAST_BODY}" ]]; then
    echo "Last response body:" >&2
    cat "${LAST_BODY}" >&2
    echo >&2
  fi
  exit 1
}

cleanup() {
  rm -rf "${TMP_DIR}"

  if [[ "${KEEP_SMOKE_DATA:-0}" == "1" ]]; then
    echo "INFO: KEEP_SMOKE_DATA=1, leaving smoke test rows in the database."
    return
  fi

  docker compose exec -T postgres psql \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    -c "DELETE FROM users WHERE email LIKE '%-${SUFFIX}@smoke.test';" \
    >/dev/null 2>&1 || true
}

trap cleanup EXIT

request() {
  local method="$1"
  local url="$2"
  shift 2

  local status
  status="$(curl -sS -o "${LAST_BODY}" -w "%{http_code}" -X "${method}" "${url}" "$@")"
  printf "%s" "${status}" > "${LAST_STATUS}"
}

assert_status() {
  local expected="$1"
  local actual
  actual="$(cat "${LAST_STATUS}")"

  [[ "${actual}" == "${expected}" ]] || fail "Expected HTTP ${expected}, got ${actual}"
}

json_get() {
  local path="$1"
  python3 -c '
import json
import sys

path = sys.argv[1].split(".")
with open(sys.argv[2], encoding="utf-8") as handle:
    value = json.load(handle)

for key in path:
    if key.isdigit():
        value = value[int(key)]
    else:
        value = value[key]

if value is None:
    print("")
else:
    print(value)
' "${path}" "${LAST_BODY}"
}

assert_success_true() {
  local success
  success="$(json_get "success")"
  [[ "${success}" == "True" ]] || fail "Expected JSON success=true"
}

assert_success_false() {
  local success
  success="$(json_get "success")"
  [[ "${success}" == "False" ]] || fail "Expected JSON success=false"
}

register_user() {
  local email="$1"
  local first_name="$2"

  request POST "${API}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${email}\",
      \"password\": \"${PASSWORD}\",
      \"first_name\": \"${first_name}\",
      \"last_name\": \"Smoke\",
      \"location\": \"Paris\"
    }"
  assert_status 201
  assert_success_true
  pass "registered ${email}"
}

login_user() {
  local email="$1"

  request POST "${API}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${email}\",
      \"password\": \"${PASSWORD}\"
    }"
  assert_status 200
  assert_success_true
  json_get "data.token"
}

psql_value() {
  local sql="$1"
  docker compose exec -T postgres psql \
    -X \
    -q \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    -tA \
    -c "${sql}"
}

user_id_for_email() {
  local email="$1"
  psql_value "SELECT id FROM users WHERE email = '${email}' LIMIT 1;"
}

ensure_breeder_profile() {
  local email="$1"
  local status="$2"
  local user_id
  user_id="$(user_id_for_email "${email}")"

  [[ -n "${user_id}" ]] || fail "Could not find user id for ${email}"

  psql_value "UPDATE users SET role = 'breeder' WHERE id = ${user_id};" >/dev/null

  psql_value "
    INSERT INTO breeder_profiles (
      user_id,
      business_name,
      bio,
      location,
      certification_status,
      certification_document_url,
      created_at,
      updated_at
    )
    VALUES (
      ${user_id},
      'Smoke Breeder ${SUFFIX}',
      'Automated local smoke test breeder',
      'Paris',
      '${status}',
      'https://example.test/smoke-certification.png',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      certification_status = EXCLUDED.certification_status,
      updated_at = NOW()
    RETURNING id;
  "
}

assert_image_exists() {
  [[ -f "${IMAGE_PATH}" ]] || fail "Required test image not found: test/images/cat.png"
}

create_listing() {
  local token="$1"
  local expected_status="$2"
  local gender="${3:-female}"
  local price="${4:-1200}"
  local age_months="${5:-4}"

  request POST "${API}/listings" \
    -H "Authorization: Bearer ${token}" \
    -F "title=Smoke kitten ${SUFFIX}" \
    -F "breed=SmokeBreed${SUFFIX}" \
    -F "age_months=${age_months}" \
    -F "gender=${gender}" \
    -F "price=${price}" \
    -F "location=SmokeCity${SUFFIX}" \
    -F "description=Created by local API smoke tests." \
    -F "images=@${IMAGE_PATH}"

  assert_status "${expected_status}"

  if [[ "${expected_status}" == "201" ]]; then
    assert_success_true
    json_get "data.id"
  else
    assert_success_false
  fi
}

assert_get_success() {
  local url="$1"
  request GET "${url}"
  assert_status 200
  assert_success_true
}

echo "INFO: API=${API}"
echo "INFO: smoke suffix=${SUFFIX}"

assert_image_exists

request GET "${API}/health"
assert_status 200
assert_success_true
pass "health check"

register_user "${CUSTOMER_EMAIL}" "Customer"
CUSTOMER_TOKEN="$(login_user "${CUSTOMER_EMAIL}")"
pass "customer login"

register_user "${BREEDER_EMAIL}" "Breeder"
BREEDER_TOKEN="$(login_user "${BREEDER_EMAIL}")"
pass "breeder login"

register_user "${UNVERIFIED_EMAIL}" "Unverified"
UNVERIFIED_TOKEN="$(login_user "${UNVERIFIED_EMAIL}")"
UNVERIFIED_BREEDER_ID="$(ensure_breeder_profile "${UNVERIFIED_EMAIL}" "pending")"
pass "created pending breeder profile ${UNVERIFIED_BREEDER_ID}"

register_user "${OTHER_EMAIL}" "Other"
OTHER_TOKEN="$(login_user "${OTHER_EMAIL}")"
pass "third user login"

register_user "${ADMIN_EMAIL}" "Admin"
ADMIN_TOKEN="$(login_user "${ADMIN_EMAIL}")"
ADMIN_ID="$(user_id_for_email "${ADMIN_EMAIL}")"
psql_value "UPDATE users SET role = 'admin' WHERE id = ${ADMIN_ID};" >/dev/null
pass "admin user setup"

request POST "${API}/breeders/apply" \
  -H "Authorization: Bearer ${BREEDER_TOKEN}" \
  -F "business_name=Smoke Breeder ${SUFFIX}" \
  -F "location=Paris" \
  -F "bio=Automated smoke test breeder." \
  -F "certification_document=@${IMAGE_PATH}"

if [[ "$(cat "${LAST_STATUS}")" == "201" ]]; then
  assert_success_true
  BREEDER_ID="$(json_get "data.breeder_profile.id")"
  psql_value "UPDATE breeder_profiles SET certification_status = 'verified', verified_at = NOW() WHERE id = ${BREEDER_ID};" >/dev/null
  pass "submitted breeder profile through API and marked verified locally"
else
  echo "INFO: breeder application API did not complete, using isolated local PostgreSQL setup for smoke user."
  BREEDER_ID="$(ensure_breeder_profile "${BREEDER_EMAIL}" "verified")"
  pass "created verified breeder profile ${BREEDER_ID} through local PostgreSQL setup"
fi

create_listing "${UNVERIFIED_TOKEN}" 403 >/dev/null
pass "unverified breeder blocked from creating listing"

create_listing "${BREEDER_TOKEN}" 400 "unknown" >/dev/null
pass "invalid listing gender rejected"

create_listing "${BREEDER_TOKEN}" 400 "female" "-1" >/dev/null
pass "invalid listing price rejected"

create_listing "${BREEDER_TOKEN}" 400 "female" "1200" "-1" >/dev/null
pass "invalid listing age rejected"

LISTING_ID="$(create_listing "${BREEDER_TOKEN}" 201)"
[[ -n "${LISTING_ID}" ]] || fail "Could not extract listing_id"
pass "created listing ${LISTING_ID}"

assert_get_success "${API}/listings"
assert_get_success "${API}/listings?breed=SmokeBreed${SUFFIX}"
assert_get_success "${API}/listings?location=SmokeCity${SUFFIX}"
assert_get_success "${API}/listings?min_price=100"
assert_get_success "${API}/listings?max_price=2000"
assert_get_success "${API}/listings?gender=female"
assert_get_success "${API}/listings?age_max=12"
pass "listing list and filters"

request POST "${API}/listings/${LISTING_ID}/reports" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"reason": "not_a_reason"}'
assert_status 400
assert_success_false
pass "invalid listing report reason rejected"

request POST "${API}/listings/${LISTING_ID}/reports" \
  -H "Authorization: Bearer ${BREEDER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"reason": "suspected_scam"}'
assert_status 403
assert_success_false
pass "listing owner cannot report own listing"

request POST "${API}/listings/${LISTING_ID}/reports" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"reason": "misleading_information", "comment": "Smoke report for moderation."}'
assert_status 201
assert_success_true
REPORT_ID="$(json_get "data.report.id")"
pass "customer reported listing ${REPORT_ID}"

request POST "${API}/listings/${LISTING_ID}/reports" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"reason": "duplicate_listing"}'
assert_status 409
assert_success_false
pass "duplicate listing report rejected"

request GET "${API}/admin/reports" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
assert_status 200
assert_success_true

request GET "${API}/admin/reports/${REPORT_ID}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"
assert_status 200
assert_success_true

request PATCH "${API}/admin/reports/${REPORT_ID}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"decision": "accepted", "admin_comment": "Smoke moderation accepted."}'
assert_status 200
assert_success_true
pass "admin moderated listing report"

request POST "${API}/conversations" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"listing_id\": ${LISTING_ID}}"
assert_status 201
assert_success_true
CONVERSATION_ID="$(json_get "data.conversation.id")"
pass "customer started conversation ${CONVERSATION_ID}"

request POST "${API}/conversations/${CONVERSATION_ID}/messages" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"content": "Bonjour, ce chaton est-il toujours disponible ?"}'
assert_status 201
assert_success_true
MESSAGE_ID="$(json_get "data.message.id")"
pass "customer sent message ${MESSAGE_ID}"

request POST "${API}/conversations/${CONVERSATION_ID}/messages" \
  -H "Authorization: Bearer ${BREEDER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"content": "Bonjour, oui il est toujours disponible."}'
assert_status 201
assert_success_true
pass "breeder replied"

request GET "${API}/conversations/${CONVERSATION_ID}/messages" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}"
assert_status 200
assert_success_true

request GET "${API}/conversations/${CONVERSATION_ID}/messages" \
  -H "Authorization: Bearer ${BREEDER_TOKEN}"
assert_status 200
assert_success_true
pass "customer and breeder can read messages"

request GET "${API}/conversations/${CONVERSATION_ID}/messages" \
  -H "Authorization: Bearer ${OTHER_TOKEN}"
assert_status 403
assert_success_false
pass "third user rejected from conversation messages"

request POST "${API}/conversations/${CONVERSATION_ID}/messages" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"content": ""}'
assert_status 400
assert_success_false
pass "empty message rejected"

for rating in 0 6 4.5 '"bad"' true; do
  request POST "${API}/breeders/${BREEDER_ID}/reviews" \
    -H "Authorization: Bearer ${CUSTOMER_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"rating\": ${rating}}"
  assert_status 400
  assert_success_false
done
pass "invalid review ratings rejected"

request POST "${API}/breeders/${BREEDER_ID}/reviews" \
  -H "Authorization: Bearer ${BREEDER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5}'
assert_status 403
assert_success_false
pass "breeder cannot review own breeder profile"

request POST "${API}/breeders/${BREEDER_ID}/reviews" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5, "comment": "Excellent communication."}'
assert_status 201
assert_success_true
REVIEW_ID="$(json_get "data.review.id")"
pass "customer created review ${REVIEW_ID}"

request POST "${API}/breeders/${BREEDER_ID}/reviews" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"rating": 4}'
assert_status 409
assert_success_false
pass "duplicate review rejected"

request GET "${API}/breeders/${BREEDER_ID}/reviews"
assert_status 200
assert_success_true
pass "public breeder reviews list"

request PATCH "${API}/reviews/${REVIEW_ID}" \
  -H "Authorization: Bearer ${OTHER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"rating": 3}'
assert_status 403
assert_success_false
pass "another user cannot update review"

request DELETE "${API}/reviews/${REVIEW_ID}" \
  -H "Authorization: Bearer ${OTHER_TOKEN}"
assert_status 403
assert_success_false
pass "another user cannot delete review"

request PATCH "${API}/reviews/${REVIEW_ID}" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"rating": 4, "comment": "Updated smoke review."}'
assert_status 200
assert_success_true
pass "customer updated review"

request DELETE "${API}/reviews/${REVIEW_ID}" \
  -H "Authorization: Bearer ${CUSTOMER_TOKEN}"
assert_status 200
assert_success_true
pass "customer deleted review"

echo "PASS: API smoke tests completed"
