#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Prisma is configured for MySQL. Keep the hosted connection in the secret and
# expose it only to the commands that need the conventional Prisma variable.
: "${MYSQL_DATABASE_URL:?MYSQL_DATABASE_URL secret is required}"
export DATABASE_URL="$MYSQL_DATABASE_URL"
export PRISMA_HIDE_UPDATE_MESSAGE=1

npm ci --no-audit --no-fund
npx prisma generate

# The initial schema was created before migrations existed. Generate the
# baseline migration once, then use normal deploy semantics on later merges.
if ! find prisma/migrations -mindepth 1 -maxdepth 1 -type d -print -quit 2>/dev/null | grep -q .; then
  mkdir -p prisma/migrations/0001_init
  npx prisma migrate diff \
    --from-empty \
    --to-schema-datamodel prisma/schema.prisma \
    --script > prisma/migrations/0001_init/migration.sql
fi

npx prisma migrate deploy
npm run db:seed
npm run build