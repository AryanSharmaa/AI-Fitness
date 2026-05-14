#!/bin/sh
echo "Running database schema push..."
npx prisma db push --accept-data-loss
echo "Starting Next.js server..."
node .next/standalone/server.js
