#!/bin/sh
echo "Starting Next.js server..."
npx next start -p ${PORT:-10000}
