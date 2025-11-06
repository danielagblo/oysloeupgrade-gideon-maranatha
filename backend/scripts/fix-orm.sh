#!/usr/bin/env bash
set -euo pipefail

# A) convert `import type { X }` -> `import { X }` for known entities
ENTITY_NAMES='AdminUser|AdminSession|AdminAuditLog|AdModerationHistory|Alert|ApplicationDocument|ApplicationReview|Category|Chatroom|ChatroomMember|Coupon|CouponRedemption|FCMDevice|Feature|Favorite|Message|NotificationHistory|OTPCode|Product|ProductFeature|ProductImage|RecentlyViewed|Referral|ReferralRedemption|Review|SearchHistory|Subcategory|SupportCase|SupportCaseAssignment|SupportMessage|SystemSettings|User|UserAnalytics|Wallet|WalletLedger|JobApplication'
for f in $(grep -R -l '^import type {' src/entities || true); do
  # macOS BSD sed: use -i ''
  sed -i '' -E "s/^import type { (${ENTITY_NAMES})([^}]*)} from \"/import { \1\2} from \"/" "$f" 2>/dev/null || true
done

# B) convert string-form relations -> arrow form
sed -i '' -E 's/ @(ManyToOne|OneToOne)\(\"([A-Za-z0-9_]+)\"\s*(,|)\)/ @src/migrations/1761906325000-AdminTablesAndSchema.ts(() => \2)\3/g' src/entities/*.ts 2>/dev/null || true
sed -i '' -E 's/ @OneToMany\(\"([A-Za-z0-9_]+)\"\s*,/ @OneToMany(() => \1, /g' src/entities/*.ts 2>/dev/null || true
sed -i '' -E 's/ @ManyToMany\(\"([A-Za-z0-9_]+)\"\s*,/ @ManyToMany(() => \1, /g' src/entities/*.ts 2>/dev/null || true

# C) remove illegal "!" after decorators
sed -i '' -E 's/( @[A-Za-z_][A-Za-z0-9_]*\([^)]*\))!\s*([A-Za-z_])/\1 \2/g' src/entities/*.ts 2>/dev/null || true

echo "✅ Applied ORM autofixes. Run scripts/check-orm.sh next."
