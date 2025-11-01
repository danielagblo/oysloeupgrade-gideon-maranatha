#!/usr/bin/env bash
set -euo pipefail

# Config you might want to tweak
APP_NAME="oysloe-backend-prod"
DOCKER_IMAGE="oysloe-backend-prod:fixed"     # or :final if you prefer
DOCKER_NET="oysloe-net"
UPLOADS_HOST_DIR="/srv/oysloe/uploads"
SECRETS_DIR="/srv/oysloe/secrets"
FIREBASE_JSON_PATH="$SECRETS_DIR/firebase-key.json"
ENV_FILE=".env.production"

usage() {
  cat <<USAGE
Usage:
  $0 --paste-json
  $0 --from-file /absolute/path/to/firebase-key.json
  $0 --from-b64 "<base64_of_full_service_account_json>"

Notes:
- Expect the *full* service account JSON (contains client_email, private_key, project_id, etc.)
- This script will:
    1) Write the JSON to $FIREBASE_JSON_PATH (chmod 600)
    2) Ensure $DOCKER_NET exists
    3) Stop & remove $APP_NAME if running
    4) Run container with:
         -v $UPLOADS_HOST_DIR:/app/uploads
         -v $FIREBASE_JSON_PATH:/secrets/firebase-key.json:ro
         -e GOOGLE_APPLICATION_CREDENTIALS=/secrets/firebase-key.json
USAGE
}

ensure_prereqs() {
  mkdir -p "$UPLOADS_HOST_DIR" "$SECRETS_DIR"
  chmod 700 "$SECRETS_DIR"
  docker network create "$DOCKER_NET" >/dev/null 2>&1 || true
}

write_json_from_stdin() {
  echo "[*] Paste the FULL Firebase service-account JSON below. Press Ctrl-D when done."
  cat > "$FIREBASE_JSON_PATH"
}

write_json_from_file() {
  local src="$1"
  if [[ ! -f "$src" ]]; then
    echo "[-] File not found: $src" >&2
    exit 1
  fi
  cp "$src" "$FIREBASE_JSON_PATH"
}

write_json_from_b64() {
  local b64="$1"
  echo "$b64" | base64 -d > "$FIREBASE_JSON_PATH"
}

validate_json() {
  # Basic checks for shape and private key headers
  if ! jq -e . >/dev/null 2>&1 < "$FIREBASE_JSON_PATH"; then
    echo "[-] JSON is invalid. Aborting." >&2
    exit 1
  fi
  local pk
  pk=$(jq -r '.private_key // empty' < "$FIREBASE_JSON_PATH")
  if [[ -z "$pk" ]]; then
    echo "[-] private_key missing in JSON." >&2
    exit 1
  fi
  if ! echo "$pk" | grep -q "-----BEGIN PRIVATE KEY-----" || \
     ! echo "$pk" | grep -q "-----END PRIVATE KEY-----"; then
    echo "[-] private_key does not contain proper BEGIN/END markers." >&2
    exit 1
  fi
  chmod 600 "$FIREBASE_JSON_PATH"
  echo "[+] Firebase JSON looks OK."
}

redeploy() {
  echo "[*] Stopping old container (if any)…"
  docker stop "$APP_NAME" >/dev/null 2>&1 || true
  docker rm   "$APP_NAME" >/dev/null 2>&1 || true

  echo "[*] Starting new container…"
  docker run -d --name "$APP_NAME" \
    --env-file "$ENV_FILE" \
    --network "$DOCKER_NET" \
    -p 3000:3000 \
    -v "$UPLOADS_HOST_DIR":/app/uploads \
    -v "$FIREBASE_JSON_PATH":/secrets/firebase-key.json:ro \
    -e GOOGLE_APPLICATION_CREDENTIALS=/secrets/firebase-key.json \
    --restart unless-stopped \
    "$DOCKER_IMAGE"

  echo "[*] Tail (first 80 lines) of logs:"
  sleep 3
  docker logs --tail 80 "$APP_NAME" || true

  echo "[*] Healthcheck (if you exposed /health):"
  curl -fsS --max-time 5 http://localhost:3000/health && echo -e "\n[+] Health OK" || echo "[-] Health endpoint not ready (check logs)"
}

main() {
  if [[ $# -lt 1 ]]; then
    usage; exit 1
  fi

  ensure_prereqs

  case "${1:-}" in
    --paste-json)
      write_json_from_stdin
      ;;
    --from-file)
      [[ $# -ge 2 ]] || { usage; exit 1; }
      write_json_from_file "$2"
      ;;
    --from-b64)
      [[ $# -ge 2 ]] || { usage; exit 1; }
      write_json_from_b64 "$2"
      ;;
    *)
      usage; exit 1;
      ;;
  esac

  validate_json
  redeploy
}

main "$@"
