#!/bin/sh
npx prisma db push --accept-data-loss || true
npm start
