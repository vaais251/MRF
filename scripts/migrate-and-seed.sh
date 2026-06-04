#!/bin/sh
set -e
echo "Running migrations..."
prisma migrate deploy
echo "Seeding database..."
node scripts/seed.js
echo "Done!"
