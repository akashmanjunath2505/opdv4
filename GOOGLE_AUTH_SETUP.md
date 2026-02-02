# Google Authentication Setup Guide

This guide will help you enable "Sign in with Google" for your Supabase-powered application.

## Prerequisites
- A Google Cloud Platform (GCP) Account
- Access to your Supabase Dashboard

## Step 1: Create Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown at the top and select **New Project**.
3. Name it "OPD Platform" (or your app name) and click **Create**.

## Step 2: Configure OAuth Consent Screen
1. In the left sidebar, go to **APIs & Services** > **OAuth consent screen**.
2. Select **External** (unless you are G-Suite only) and click **Create**.
3. Fill in:
   - **App Name**: OPD Platform
   - **User Support Email**: Your email
   - **Developer Contact Email**: Your email
4. Click **Save and Continue**.
5. Skipping Scopes is fine for now (just click Save).
6. Skipping Test Users is fine (click Save).
7. Back to Dashboard.

## Step 3: Get Client ID and Secret
1. Go to **APIs & Services** > **Credentials**.
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
3. **Application Type**: Web application.
4. **Name**: "Supabase Auth".
5. **Authorized JavaScript origins**:
   - `https://opdv4.vercel.app` (Your production URL)
   - `https://opd.aivanahealth.com` (Your custom domain)
   - `http://localhost:3000` (For local dev)
   - `https://zdsohbjczbdktczzzujf.supabase.co` (Your Supabase URL - **Important!**)
6. **Authorized redirect URIs**:
   - `https://zdsohbjczbdktczzzujf.supabase.co/auth/v1/callback` (**Critical Step**)
7. Click **Create**.
8. Copy the **Client ID** and **Client Secret**.

## Step 4: Configure Supabase
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/zdsohbjczbdktczzzujf).
2. Navigate to **Authentication** > **Providers**.
3. Click on **Google**.
4. Toggle **Enable Sign in with Google**.
5. Paste your **Client ID** and **Client Secret** from Step 3.
6. Click **Save**.

## Step 5: Test It
1. Go to your app login page.
2. Click "Sign in with Google".
3. You should be redirected to Google, then back to the Dashboard logged in!

---
**Note**: If you see `403: redirect_uri_mismatch`, double-check Step 3.6. Use exactly `https://zdsohbjczbdktczzzujf.supabase.co/auth/v1/callback`.
