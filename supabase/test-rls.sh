#!/usr/bin/env bash
set -euo pipefail

# Northeast Connect — Supabase RLS Verification Script
# Usage:
#   SUPABASE_URL="https://xxx.supabase.co" SUPABASE_ANON_KEY="eyJ..." ./supabase/test-rls.sh
# Optional for check (e):
#   COORD_EMAIL="coord@org.org" COORD_PASSWORD="..." ./supabase/test-rls.sh

SUPABASE_URL="${SUPABASE_URL:-${VITE_SUPABASE_URL:-}}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-${VITE_SUPABASE_ANON_KEY:-}}"

if [[ -z "${SUPABASE_URL}" || -z "${SUPABASE_ANON_KEY}" ]]; then
  echo "ERROR: Set SUPABASE_URL and SUPABASE_ANON_KEY (or VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)." >&2
  exit 1
fi

SUPABASE_URL="${SUPABASE_URL%/}"
PASS_COUNT=0
FAIL_COUNT=0

pass() {
  echo "  [PASS] $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
  echo "  [FAIL] $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

echo "Running RLS checks against ${SUPABASE_URL} ..."

# ---------------------------------------------------------------------------
# (a) Anon CANNOT read base reports table or unmasked contact_phone
# ---------------------------------------------------------------------------
echo "Check (a): Anon cannot SELECT contact_phone from /rest/v1/reports"
STATUS_A=$(curl -sS -o /tmp/rls_a.json -w "%{http_code}" \
  "${SUPABASE_URL}/rest/v1/reports?select=id,contact_phone&limit=1" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")
BODY_A=$(cat /tmp/rls_a.json)
if [[ "${STATUS_A}" == "401" || "${STATUS_A}" == "403" ]] || grep -q "42501" <<< "${BODY_A}"; then
  pass "Base reports SELECT rejected for anon (HTTP ${STATUS_A})"
else
  fail "Expected HTTP 401/403 (42501) on /rest/v1/reports, got HTTP ${STATUS_A}: ${BODY_A}"
fi

# ---------------------------------------------------------------------------
# (b) Anon CANNOT UPDATE or DELETE reports
# ---------------------------------------------------------------------------
echo "Check (b): Anon cannot UPDATE or DELETE a report on /rest/v1/reports"
STATUS_B_UPD=$(curl -sS -o /tmp/rls_b1.json -w "%{http_code}" \
  -X PATCH "${SUPABASE_URL}/rest/v1/reports?id=eq.rep-101" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"verification_status":"VERIFIED"}')
BODY_B1=$(cat /tmp/rls_b1.json)

STATUS_B_DEL=$(curl -sS -o /tmp/rls_b2.json -w "%{http_code}" \
  -X DELETE "${SUPABASE_URL}/rest/v1/reports?id=eq.rep-101" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Prefer: return=representation")
BODY_B2=$(cat /tmp/rls_b2.json)

if { [[ "${STATUS_B_UPD}" == "401" || "${STATUS_B_UPD}" == "403" ]] || [[ "${BODY_B1}" == "[]" ]] || grep -q "42501" <<< "${BODY_B1}"; } && \
   { [[ "${STATUS_B_DEL}" == "401" || "${STATUS_B_DEL}" == "403" ]] || [[ "${BODY_B2}" == "[]" ]] || grep -q "42501" <<< "${BODY_B2}"; }; then
  pass "Anon UPDATE (HTTP ${STATUS_B_UPD}) and DELETE (HTTP ${STATUS_B_DEL}) blocked on /rest/v1/reports"
else
  fail "Anon UPDATE/DELETE was not blocked cleanly (UPD=${STATUS_B_UPD} ${BODY_B1}, DEL=${STATUS_B_DEL} ${BODY_B2})"
fi

# ---------------------------------------------------------------------------
# (c) Anon CAN insert a public report (and workflow defaults are enforced)
# ---------------------------------------------------------------------------
echo "Check (c): Anon can INSERT a new report via submit_public_report RPC"
TEST_TS=$(date +%s)
TEST_ID="rep-rlstest-${TEST_TS}"
TEST_UUID="rls-test-uuid-${TEST_TS}-0001"

STATUS_C=$(curl -sS -o /tmp/rls_c.json -w "%{http_code}" \
  -X POST "${SUPABASE_URL}/rest/v1/rpc/submit_public_report" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"p_id\": \"${TEST_ID}\",
    \"p_client_uuid\": \"${TEST_UUID}\",
    \"p_mode\": \"HAZARD\",
    \"p_district_id\": \"kamrup-metro\",
    \"p_district_name\": \"Kamrup Metro\",
    \"p_corridor_or_block\": \"RLS Verification Corridor\",
    \"p_locality\": \"Automated RLS Test Spot\",
    \"p_coordinates_lat\": 26.1445,
    \"p_coordinates_lng\": 91.7362,
    \"p_category\": \"Flooding\",
    \"p_severity\": \"MODERATE\",
    \"p_description\": \"Automated RLS check submission verifying anon insert and masked view output.\",
    \"p_affected_people_count\": 2,
    \"p_vulnerability_tags\": [],
    \"p_assistance_needs\": [],
    \"p_contact_phone\": \"+91-98640-12345\",
    \"p_reporter_name\": \"RLS Automated Check\",
    \"p_reporting_for_others\": false
  }")
BODY_C=$(cat /tmp/rls_c.json)

if [[ "${STATUS_C}" == "200" || "${STATUS_C}" == "201" ]] && grep -q "${TEST_ID}" <<< "${BODY_C}"; then
  pass "Anon INSERT via submit_public_report succeeded (HTTP ${STATUS_C}, id=${TEST_ID})"
else
  fail "Anon INSERT via submit_public_report failed (HTTP ${STATUS_C}): ${BODY_C}"
fi

# ---------------------------------------------------------------------------
# (d) Public view reports_public masks phone & omits reporter_name/internal_notes
# ---------------------------------------------------------------------------
echo "Check (d): Public feed /rest/v1/reports_public shows masked phone and hides reporter_name"
STATUS_D=$(curl -sS -o /tmp/rls_d.json -w "%{http_code}" \
  "${SUPABASE_URL}/rest/v1/reports_public?id=eq.${TEST_ID}&select=*" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")
BODY_D=$(cat /tmp/rls_d.json)

if [[ "${STATUS_D}" == "200" ]] && \
   grep -q "XXXXX" <<< "${BODY_D}" && \
   ! grep -q "12345" <<< "${BODY_D}" && \
   ! grep -q "reporter_name" <<< "${BODY_D}" && \
   ! grep -q "internal_notes" <<< "${BODY_D}"; then
  pass "reports_public masked phone (+91-98640-XXXXX) and omitted reporter_name & internal_notes"
else
  fail "reports_public check failed (HTTP ${STATUS_D}): ${BODY_D}"
fi

# ---------------------------------------------------------------------------
# (e) Coordinator login can read unmasked reports & verify a report (optional creds)
# ---------------------------------------------------------------------------
echo "Check (e): Authenticated coordinator login can verify inserted report"
if [[ -n "${COORD_EMAIL:-}" && -n "${COORD_PASSWORD:-}" ]]; then
  AUTH_STATUS=$(curl -sS -o /tmp/rls_auth.json -w "%{http_code}" \
    -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${COORD_EMAIL}\",\"password\":\"${COORD_PASSWORD}\"}")
  ACCESS_TOKEN=$(node -e "try{const d=JSON.parse(require('fs').readFileSync('/tmp/rls_auth.json','utf8'));process.stdout.write(d.access_token||'')}catch{}")

  if [[ "${AUTH_STATUS}" != "200" || -z "${ACCESS_TOKEN}" ]]; then
    fail "Coordinator login failed (HTTP ${AUTH_STATUS}): $(cat /tmp/rls_auth.json)"
  else
    STATUS_E_PATCH=$(curl -sS -o /tmp/rls_e.json -w "%{http_code}" \
      -X PATCH "${SUPABASE_URL}/rest/v1/reports?id=eq.${TEST_ID}" \
      -H "apikey: ${SUPABASE_ANON_KEY}" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      -H "Prefer: return=representation" \
      -d '{"verification_status":"VERIFIED"}')
    BODY_E=$(cat /tmp/rls_e.json)

    if [[ "${STATUS_E_PATCH}" == "200" ]] && grep -q '"verification_status":"VERIFIED"' <<< "${BODY_E}"; then
      pass "Coordinator verified report ${TEST_ID} and received full record (HTTP ${STATUS_E_PATCH})"
      # Clean up temporary RLS test record as coordinator
      curl -sS -o /dev/null -X DELETE "${SUPABASE_URL}/rest/v1/reports?id=eq.${TEST_ID}" \
        -H "apikey: ${SUPABASE_ANON_KEY}" \
        -H "Authorization: Bearer ${ACCESS_TOKEN}" || true
    else
      fail "Coordinator PATCH failed (HTTP ${STATUS_E_PATCH}): ${BODY_E}"
    fi
  fi
else
  echo "  [SKIP] Check (e) skipped (set COORD_EMAIL and COORD_PASSWORD to verify authenticated coordinator flow)."
fi

rm -f /tmp/rls_a.json /tmp/rls_b1.json /tmp/rls_b2.json /tmp/rls_c.json /tmp/rls_d.json /tmp/rls_auth.json /tmp/rls_e.json

echo ""
echo "RLS Verification Summary: ${PASS_COUNT} passed, ${FAIL_COUNT} failed."
if [[ "${FAIL_COUNT}" -gt 0 ]]; then
  exit 1
fi
