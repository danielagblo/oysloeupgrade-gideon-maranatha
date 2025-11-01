#!/usr/bin/env bash
set -euo pipefail

# 1) ban misplaced "!" after decorators
if grep -R -nE ' @[A-Za-z_][A-Za-z0-9_]*\([^)]*\)!\s*[A-Za-z_]' src/entities >/dev/null; then
  echo "❌ '!' after decorator. Move it to the property name."
  grep -R -nE ' @[A-Za-z_][A-Za-z0-9_]*\([^)]*\)!\s*[A-Za-z_]' src/entities
  exit 1
fi
echo "✅ No decorator-line '!' misuse"

# 2) ban string-form relations
if grep -R -nE ' @(ManyToOne|OneToMany|OneToOne|ManyToMany)\(".*"' src/entities >/dev/null; then
  echo "❌ String-form relation found. Use (() => Entity)."
  grep -R -nE ' @(ManyToOne|OneToMany|OneToOne|ManyToMany)\(".*"' src/entities
  exit 1
fi
echo "✅ No string-form relations"

# 3) ban type-only imports for relation classes
ENTITY_NAMES='User|Product|Category|Subcategory|Feature|Wallet|WalletLedger|Chatroom|ChatroomMember|Message|Coupon|CouponRedemption|Referral|ReferralRedemption|Review|Favorite|RecentlyViewed|NotificationHistory|UserAnalytics|SearchHistory|OTPCode|FCMDevice|AdminUser|AdminSession|AdminAuditLog|AdModerationHistory|SupportCase|SupportMessage|SupportCaseAssignment|SystemSettings|Alert|JobApplication|ApplicationDocument|ApplicationReview'
if grep -R -n '^import type {' src/entities | grep -E "$ENTITY_NAMES" >/dev/null; then
  echo "❌ 'import type' used for relation classes. Use value imports."
  grep -R -n '^import type {' src/entities | grep -E "$ENTITY_NAMES"
  exit 1
fi
echo "✅ No forbidden type-only imports on relation classes"

# 4) barrel export sanity (index.ts)
while read -r line; do
  NAME=$(echo "$line" | sed -nE 's/^export \{ ([A-Za-z0-9_]+) \} from "\.\/([A-Za-z0-9_]+)\.js";/\1/p')
  FILE=$(echo "$line" | sed -nE 's/^export \{ ([A-Za-z0-9_]+) \} from "\.\/([A-Za-z0-9_]+)\.js";/\2/p')
  if [ -n "$NAME" ] && [ -n "$FILE" ]; then
    if ! grep -qE "export (class|interface|enum|type) ${NAME}\b" "src/entities/${FILE}.ts"; then
      echo "❌ Missing named export for ${NAME} in src/entities/${FILE}.ts"
      exit 1
    fi
  fi
done < <(grep -nE '^export \{ [A-Za-z0-9_]+ \} from "\.\/[A-Za-z0-9_]+\.js";' src/entities/index.ts || true)
echo "✅ Index exports match entity files"

# 5) TS sanity
bun x tsc -p tsconfig.json --noEmit || { echo "❌ Type errors"; exit 1; }
echo "✅ TypeScript check passed"