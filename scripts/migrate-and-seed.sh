#!/bin/sh
echo "Running migrations..."
npx prisma migrate deploy
echo "Seeding database..."
npx prisma db seed
echo "Done!"
