#!/bin/sh
echo "Syncing database schema..."
npx prisma db push --accept-data-loss || true
echo "Starting Next.js server..."
npx next start -p ${PORT:-10000}
