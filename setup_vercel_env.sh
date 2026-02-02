#!/bin/bash

# Helper to update env
update_env() {
  key=$1
  val=$2
  echo "Updating $key..."
  # Remove existing variable (ignore error if not found)
  npx vercel env rm $key production -y >/dev/null 2>&1 || true
  # Add new variable
  echo -n "$val" | npx vercel env add $key production
}

echo "Starting Vercel environment update..."

update_env "DATABASE_URL" "postgresql://neondb_owner:npg_anhuGPbq3J6o@ep-red-star-ahlzoa78-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
update_env "JWT_SECRET" "opd_platform_super_secret_jwt_key_2024_production_min_32_characters"
update_env "JWT_EXPIRES_IN" "7d"
update_env "GEMINI_API_KEY" "AIzaSyDdgZbqnxfn24JlrtuVY33hlmEUGyZwfEI"
update_env "VITE_API_URL" "https://opd.aivanahealth.com"

echo "✅ Environment variables updated successfully!"
