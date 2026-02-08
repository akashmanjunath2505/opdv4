# Complete Infrastructure Cost Breakdown
**Date:** February 6, 2026  
**Focus:** Every infrastructure component needed to run the software

---

## 📊 EXECUTIVE SUMMARY

### Total Monthly Infrastructure Costs

| Scale | Fixed Infrastructure | Per Doctor | Notes |
|-------|---------------------|------------|-------|
| **Any scale** | ₹3,783/month | Varies | Fixed regardless of users |
| **@ 1 doctor** | ₹3,783 | ₹3,783/doctor | Not economical |
| **@ 10 doctors** | ₹3,783 | ₹378/doctor | Starting to scale |
| **@ 50 doctors** | ₹3,783 | ₹76/doctor | Good economics |
| **@ 100 doctors** | ₹3,783 | ₹38/doctor | Excellent economics |
| **@ 500 doctors** | ₹3,783 | ₹8/doctor | Negligible |

---

## 🏗️ PRIMARY INFRASTRUCTURE

### 1. Database - Supabase Pro

**Service:** PostgreSQL database + Auth + Real-time  
**Tier:** Pro Plan  
**Monthly Cost:** **$25 = ₹2,097**

**What You Get:**
- PostgreSQL database (8GB RAM, 4 vCPU)
- Database storage: 100GB included
- Bandwidth: 250GB/month
- Database backups: Daily automated (7-day retention)
- Point-in-time recovery (PITR)
- 99.9% uptime SLA
- Supabase Auth (JWT-based authentication)
- Real-time subscriptions
- Row-level security
- Database logs: 7 days retention

**Current Usage (estimated @ 50 doctors):**
- Database size: ~115 MB (2.3 MB per doctor)
- Monthly data transfer: ~15-20 GB
- API calls: ~50,000/month
- **Status:** Well within limits ✅

**Scaling Capacity:**
- Can handle **500+ doctors** before upgrade needed
- Upgrade needed when: >100GB data OR >50M rows OR >250GB bandwidth
- Next tier: Team ($599/month) - not needed for foreseeable future

**What's Stored:**
| Table | Size per Doctor/Month | Retention |
|-------|----------------------|-----------|
| **Transcripts** | ~2 MB | Forever |
| **SOAP notes** | ~200 KB | Forever |
| **Prescriptions** | ~150 KB | Forever |
| **User profiles** | ~5 KB | Forever |
| **Session data** | ~50 KB | 90 days |
| **Audit logs** | ~100 KB | 7 years (compliance) |

**Per Doctor Cost:**
- @ 10 doctors: ₹210/doctor
- @ 50 doctors: ₹42/doctor
- @ 100 doctors: ₹21/doctor
- @ 500 doctors: ₹4/doctor

---

### 2. Hosting & Compute - Vercel Pro

**Service:** Serverless frontend + API hosting  
**Tier:** Pro Plan  
**Monthly Cost:** **$20 = ₹1,678**

**What You Get:**
- Unlimited serverless function invocations
- 100GB bandwidth/month
- Unlimited deployments
- 1,000 build hours/month
- Edge network (global CDN)
- Custom domains
- SSL certificates (automatic)
- DDoS protection
- Build caching
- Analytics (basic)
- Team collaboration (unlimited members)

**Current Usage (estimated @ 50 doctors):**
- Function invocations: ~200,000/month
- Bandwidth: ~30 GB/month
- Build minutes: ~50 minutes/month
- **Status:** Well within limits ✅

**Scaling Capacity:**
- Can handle **1,000+ doctors** before hitting bandwidth limits
- Function invocations: Unlimited on Pro
- Upgrade needed when: >100GB bandwidth consistently
- Next tier: Enterprise (custom pricing) - not needed

**What Runs on Vercel:**
- Next.js frontend app
- API routes (serverless functions)
- Image optimization
- Edge middleware (authentication checks)
- Static asset serving (CSS, JS, images)

**Per Doctor Cost:**
- @ 10 doctors: ₹168/doctor
- @ 50 doctors: ₹34/doctor
- @ 100 doctors: ₹17/doctor
- @ 500 doctors: ₹3/doctor

---

### 3. File Storage - Vercel Blob

**Service:** Object storage for files  
**Tier:** Pay-as-you-go  
**Monthly Cost:** **~$0.10 = ₹8** (current usage)

**Pricing:**
- Storage: $0.015/GB/month
- Bandwidth (read): $0.18/GB
- Bandwidth (write): Free

**Current Usage:**
- **Profile pictures only:** ~500 MB total
- Monthly bandwidth: ~1 GB reads
- Storage cost: 0.5 GB × $0.015 = $0.0075
- Bandwidth cost: 1 GB × $0.18 = $0.18
- **Total:** ~$0.19/month = ₹16

**What's Stored:**
- Doctor profile pictures (max 2MB each)
- Clinic logos (max 2MB each)
- ❌ **NOT storing:** Audio recordings (deleted after transcription)
- ❌ **NOT storing:** Document uploads (not implemented)

**Scaling:**
- @ 50 doctors: ~100 MB storage = $1.50/month = ₹126
- @ 100 doctors: ~200 MB storage = $3/month = ₹252
- @ 500 doctors: ~1 GB storage = $15/month = ₹1,259

**If You Were Storing Audio** (NOT RECOMMENDED):
- Average audio per doctor: 5,280 min/month = ~660 MB/month
- Storage @ 50 doctors: 33 GB = **$495/month = ₹41,535** 🚨
- **This is why you DON'T store audio!**

**Per Doctor Cost (current):**
- @ 10 doctors: ₹1/doctor
- @ 50 doctors: ₹0.16/doctor
- @ 100 doctors: ₹0.08/doctor

---

## 🔧 SUPPORTING INFRASTRUCTURE

### 4. Payment Processing - Stripe

**Service:** Subscription billing & payments  
**Tier:** Pay-per-transaction  
**Monthly Cost:** **2% per transaction** (deducted from revenue)

**Pricing:**
- Domestic cards: 2% + ₹0 per transaction
- International cards: 3% + ₹0 per transaction
- UPI: 2% (capped at ₹3,000)

**Cost per Doctor:**
- Subscription: ₹2,000/month
- Stripe fee: ₹2,000 × 2% = **₹40/doctor/month**
- Net revenue: ₹1,960/doctor

**What You Get:**
- Payment gateway
- Subscription management
- Automated billing
- Invoice generation
- Failed payment retries
- Customer portal
- Webhook infrastructure
- Fraud detection
- Compliance (PCI DSS)

**Annual Cost @ 50 doctors:**
- ₹40 × 50 × 12 = ₹24,000/year in fees
- On ₹12,00,000 revenue = 2%

**Note:** This is deducted from revenue, not added to costs.

---

### 5. Email Service - Resend

**Service:** Transactional emails  
**Tier:** Free Plan (currently)  
**Monthly Cost:** **₹0** (Free tier: 100 emails/day)

**Current Usage:**
- Welcome emails: ~5-10/month
- Password resets: ~20-30/month
- Contact form notifications: ~10-20/month
- **Total:** ~50 emails/month
- **Status:** Well within free tier ✅

**Free Tier Limits:**
- 100 emails per day
- 3,000 emails per month
- All features included

**When to Upgrade:**
| Scale | Emails/Month | Recommended Tier | Cost |
|-------|--------------|------------------|------|
| **0-50 doctors** | <3,000 | Free | ₹0 |
| **50-200 doctors** | 3,000-10,000 | Pro ($20/mo) | ₹1,678 |
| **200+ doctors** | 10,000-50,000 | Business ($80/mo) | ₹6,712 |

**Paid Plan Benefits:**
- Email analytics
- Dedicated IP
- Higher sending limits
- Priority support

**Current per doctor:** ₹0

---

### 6. Domain & SSL

**Service:** Domain name + HTTPS certificates  
**Tier:** Standard domain + Vercel SSL  
**Monthly Cost:** **~₹100/month** (₹1,200/year amortized)

**Breakdown:**
- Domain registration: ~₹1,000-1,500/year
- SSL certificate: **Free** (Let's Encrypt via Vercel)
- DNS hosting: **Free** (Vercel DNS or Cloudflare)

**Domains Needed:**
- Primary: `aivanahealth.com` (or similar)
- Optional: `app.aivana.com`, `api.aivana.com` (subdomains - free)

**Per Doctor Cost:**
- @ 50 doctors: ₹2/doctor
- Negligible

---

## 🔍 MONITORING & OBSERVABILITY

### 7. Uptime Monitoring - UptimeRobot

**Service:** Website/API uptime monitoring  
**Tier:** Free Plan (currently)  
**Monthly Cost:** **₹0**

**Free Tier:**
- 50 monitors
- 5-minute check intervals
- Email alerts
- Public status pages

**What to Monitor:**
- Frontend availability
- API endpoints
- Database connectivity
- Supabase status
- Vercel deployment status

**Paid Option:** Pro ($7/month = ₹587)
- 1-minute intervals
- SMS alerts
- Advanced reporting

**Current need:** Free tier is sufficient ✅

---

### 8. Error Tracking - Sentry (Optional, Recommended)

**Service:** Real-time error tracking & monitoring  
**Tier:** NOT CURRENTLY IMPLEMENTED  
**Monthly Cost:** **₹0** (can start with free tier)

**Recommended Plan:** Developer ($29/month = ₹2,433)
- 50,000 events/month
- 30-day retention
- Unlimited projects
- Performance monitoring
- Session replay

**Why You Need This:**
- Track JavaScript errors
- Monitor API failures
- Debug production issues
- Performance bottlenecks
- User session replay

**When to Implement:** ASAP (should be Day 1) ⚠️

**Per Doctor @ 50 doctors:** ₹49/doctor

---

### 9. Application Performance Monitoring - Vercel Analytics

**Service:** Web analytics & performance  
**Tier:** Included with Vercel Pro  
**Monthly Cost:** **₹0** (included)

**What You Get:**
- Page views
- Web Vitals (LCP, FID, CLS)
- Real User Monitoring (RUM)
- Geographic distribution
- Device/browser breakdown

**Optional Upgrade:** Vercel Analytics Pro ($20/month)
- Custom events
- Conversion tracking
- Detailed insights
- **Status:** Not needed yet

---

## 🔐 SECURITY INFRASTRUCTURE

### 10. SSL/TLS Certificates

**Service:** HTTPS encryption  
**Provider:** Vercel (Let's Encrypt)  
**Monthly Cost:** **₹0** (automatic & free)

**What You Get:**
- Automatic SSL certificate provisioning
- Auto-renewal
- Support for custom domains
- Edge SSL termination

---

### 11. DDoS Protection

**Service:** Distributed denial-of-service protection  
**Provider:** Vercel (included)  
**Monthly Cost:** **₹0** (included)

**What You Get:**
- Layer 3/4 DDoS protection
- Rate limiting
- Automatic mitigation
- Edge network protection

---

### 12. Authentication Infrastructure

**Service:** User authentication & session management  
**Provider:** Supabase Auth  
**Monthly Cost:** **₹0** (included in Supabase)

**What You Get:**
- JWT-based authentication
- Magic link login
- OAuth providers (Google, Apple, etc.)
- Session management
- Row-level security
- Password reset flows

---

## 🌐 CDN & EDGE INFRASTRUCTURE

### 13. Content Delivery Network (CDN)

**Service:** Global edge network  
**Provider:** Vercel Edge Network  
**Monthly Cost:** **₹0** (included in Vercel Pro)

**Coverage:**
- 100+ edge locations worldwide
- Automatic static asset caching
- Dynamic content acceleration
- Geo-routing

**Bandwidth Included:** 100 GB/month

**If Exceeding Bandwidth:**
- Overage: $40/100GB = ₹3,356/100GB
- Unlikely to hit with current usage

---

## 📦 BACKUP & DISASTER RECOVERY

### 14. Database Backups

**Service:** Automated PostgreSQL backups  
**Provider:** Supabase (included)  
**Monthly Cost:** **₹0** (included in Supabase Pro)

**Backup Schedule:**
- Daily automated backups
- 7-day retention
- Point-in-time recovery (PITR)
- One-click restore

**Optional Offsite Backup:**
- AWS S3 Glacier: ~$4/month for 50GB = ₹336
- Recommended for compliance: YES ⚠️

---

### 15. Application Backups

**Service:** Code & deployment backups  
**Provider:** GitHub + Vercel  
**Monthly Cost:** **₹0** (included)

**What's Backed Up:**
- Git repository (GitHub)
- Deployment history (Vercel keeps last 100)
- Environment variables (Vercel encrypted storage)
- Build artifacts

---

## 🔄 CI/CD INFRASTRUCTURE

### 16. Version Control - GitHub

**Service:** Code hosting & version control  
**Tier:** Free / Team Plan  
**Monthly Cost:** **₹0** (Free for public repos) or **$4/user/month** for private

**For Private Repo (2 developers):**
- Cost: $8/month = ₹671/month
- Included in "Indirect Software Costs" section

**What You Get:**
- Unlimited repositories
- GitHub Actions (2,000 minutes/month free)
- Issue tracking
- Pull requests
- Code review

---

### 17. CI/CD Pipeline - GitHub Actions & Vercel

**Service:** Automated testing & deployment  
**Provider:** GitHub Actions + Vercel  
**Monthly Cost:** **₹0** (using free tier)

**GitHub Actions:**
- 2,000 minutes/month (free tier)
- Current usage: ~0 (not implementing CI tests yet)

**Vercel Deployments:**
- Automatic on git push
- Preview deployments (PRs)
- Production deployments
- Rollback capability
- All included in Vercel Pro

---

## 🎯 OPTIONAL/FUTURE INFRASTRUCTURE

### 18. Redis Cache (Not Implemented)

**Potential Use:** Session caching, rate limiting  
**Provider Options:**
- Upstash (serverless Redis): Free tier / $10+/month
- Redis Labs: $5+/month
- Self-hosted: $10-20/month (VPS)

**When Needed:** At 200+ doctors, for performance optimization  
**Current Status:** Not needed ❌

---

### 19. Message Queue (Not Implemented)

**Potential Use:** Async job processing  
**Provider Options:**
- AWS SQS: Pay per request (~$0)
- Upstash QStash: Free tier / $10+/month
- Self-hosted RabbitMQ: $10-20/month

**When Needed:** If implementing batch processing, email queues  
**Current Status:** Not needed ❌

---

### 20. Search Engine (Not Implemented)

**Potential Use:** Full-text search across transcripts  
**Provider Options:**
- Algolia: $1/month (Community plan) / $29+/month
- Elasticsearch (self-hosted): $20-50/month
- Supabase full-text search: Included (good enough)

**When Needed:** If doctors request advanced search  
**Current Status:** Using PostgreSQL full-text search ✅

---

### 21. Object Storage (Not Needed Currently)

**Potential Use:** Long-term audio/document storage  
**Provider Options:**
- AWS S3: $0.023/GB/month
- Cloudflare R2: $0.015/GB/month (no egress fees)
- Backblaze B2: $0.006/GB/month

**Cost if Storing Audio @ 50 doctors:**
- 50 doctors × 660 MB × 12 months = 396 GB
- AWS S3: $9.11/month = ₹764/month
- **Don't implement unless legally required!**

---

### 22. Video/Screen Recording (Not Implemented)

**Potential Use:** Video consultations, screen recording  
**Provider Options:**
- Mux: $5/1000 minutes viewing
- AWS IVS: $1.40/hour streaming
- Twilio Video: $0.004/minute/participant

**When Needed:** If expanding to telemedicine  
**Current Status:** Not needed ❌

---

## 📊 COMPLETE INFRASTRUCTURE SUMMARY

### Current Monthly Fixed Costs

| Service | Provider | Cost (USD) | Cost (INR) | % of Total |
|---------|----------|-----------|-----------|-----------|
| **Database** | Supabase Pro | $25 | ₹2,097 | 55% |
| **Hosting** | Vercel Pro | $20 | ₹1,678 | 44% |
| **File Storage** | Vercel Blob | $0.10 | ₹8 | <1% |
| **Email** | Resend | $0 | ₹0 | 0% |
| **Domain** | Registrar | $1.20 | ₹100 | <1% |
| **Monitoring** | UptimeRobot | $0 | ₹0 | 0% |
| **SSL** | Vercel | $0 | ₹0 | 0% |
| **CDN** | Vercel | $0 | ₹0 | 0% |
| **Auth** | Supabase | $0 | ₹0 | 0% |
| **Backups** | Supabase | $0 | ₹0 | 0% |
| **CI/CD** | GitHub/Vercel | $0 | ₹0 | 0% |
| | | | | |
| **TOTAL** | | **$46.30** | **₹3,883** | **100%** |

*Exchange rate: $1 = ₹83.90*

---

### Per Doctor Cost Allocation

| # Doctors | Monthly Fixed | Per Doctor | % of ₹2,000 Revenue |
|-----------|---------------|------------|---------------------|
| **1** | ₹3,883 | ₹3,883 | 194% |
| **5** | ₹3,883 | ₹777 | 39% |
| **10** | ₹3,883 | ₹388 | 19% |
| **20** | ₹3,883 | ₹194 | 10% |
| **30** | ₹3,883 | ₹129 | 6% |
| **50** | ₹3,883 | ₹78 | 4% |
| **100** | ₹3,883 | ₹39 | 2% |
| **200** | ₹3,883 | ₹19 | 1% |
| **500** | ₹3,883 | ₹8 | 0.4% |

---

## 🚀 SCALING PROJECTIONS

### When Will You Need Infrastructure Upgrades?

| Milestone | Infrastructure Change | Cost Impact | Trigger |
|-----------|----------------------|-------------|---------|
| **50 doctors** | None | ₹0 | Current setup sufficient |
| **100 doctors** | None | ₹0 | Still within all limits |
| **200 doctors** | Resend Pro (email) | +₹1,678/mo | >3,000 emails/month |
| **500 doctors** | Supabase Team (database) | +₹48,113/mo | >100GB database |
| **1,000 doctors** | Vercel Enterprise (bandwidth) | Custom | >100GB bandwidth/mo |

**Key Insight:** No infrastructure upgrades needed until **200+ doctors** 🎯

---

## 💰 COST SCENARIOS BY SCALE

### Minimal Setup (0-30 doctors)

**Monthly Infrastructure:**
```
Supabase Pro:           ₹2,097
Vercel Pro:             ₹1,678
Vercel Blob:            ₹8
Resend:                 ₹0
Domain:                 ₹100
Other:                  ₹0
──────────────────────────────
TOTAL:                  ₹3,883/month
Per doctor @ 20:        ₹194/doctor
```

---

### Standard Setup (30-100 doctors)

**Monthly Infrastructure:**
```
Supabase Pro:           ₹2,097
Vercel Pro:             ₹1,678
Vercel Blob:            ₹126 (profile pics)
Resend:                 ₹0
Domain:                 ₹100
Sentry (optional):      ₹2,433
Offsite backup:         ₹336
──────────────────────────────
TOTAL:                  ₹6,770/month
Per doctor @ 50:        ₹135/doctor
Per doctor @ 100:       ₹68/doctor
```

---

### Production-Grade Setup (100-200 doctors)

**Monthly Infrastructure:**
```
Supabase Pro:           ₹2,097
Vercel Pro:             ₹1,678
Vercel Blob:            ₹252
Resend Pro:             ₹1,678
Domain:                 ₹100
Sentry Developer:       ₹2,433
Offsite backup:         ₹336
Uptime monitoring:      ₹587
──────────────────────────────
TOTAL:                  ₹9,161/month
Per doctor @ 150:       ₹61/doctor
Per doctor @ 200:       ₹46/doctor
```

---

### Enterprise Setup (500+ doctors)

**Monthly Infrastructure:**
```
Supabase Team:          ₹50,000 (upgrade needed)
Vercel Pro:             ₹1,678
Vercel Blob:            ₹1,259
Resend Business:        ₹6,712
Domain:                 ₹100
Sentry Growth:          ₹8,390
Redis cache (Upstash):  ₹839
Offsite backup:         ₹1,259
Monitoring suite:       ₹4,195
──────────────────────────────
TOTAL:                  ₹74,432/month
Per doctor @ 500:       ₹149/doctor
Per doctor @ 1,000:     ₹74/doctor
```

---

## 🎯 INFRASTRUCTURE OPTIMIZATION TIPS

### 1. Stay on Free Tiers as Long as Possible ✅
- Resend free: Good until 50+ doctors
- UptimeRobot free: Sufficient for monitoring
- GitHub Actions free: 2,000 min/month plenty
- Vercel SSL/CDN: Included, no upgrade needed

### 2. Don't Store Audio Files 🚨
- **Current cost:** ₹8/month (profile pics only)
- **If storing audio:** ₹41,535/month @ 50 doctors
- **Savings:** ₹41,527/month! (99.98% cost reduction)

### 3. Use Included Features
- Supabase Auth (don't pay for Auth0)
- Vercel CDN (don't pay for Cloudflare Pro)
- PostgreSQL full-text search (don't pay for Algolia yet)
- Supabase backups (included)

### 4. Monitor Usage Monthly
- Check Vercel bandwidth (stay under 100GB)
- Check Supabase database size (stay under 100GB)
- Check Resend email count (stay under 3,000)
- Alert at 80% of any limit

### 5. Delay Optional Services
- ⏸️ Sentry: Can wait until product-market fit
- ⏸️ Premium monitoring: Free tier works fine initially
- ⏸️ Redis cache: Only at 200+ doctors
- ⏸️ Search engine: PostgreSQL search is good enough

---

## 📋 INFRASTRUCTURE CHECKLIST

### ✅ Currently Implemented
- [x] Database (Supabase Pro)
- [x] Hosting (Vercel Pro)
- [x] File storage (Vercel Blob)
- [x] Email (Resend free)
- [x] Authentication (Supabase Auth)
- [x] SSL certificates (Vercel)
- [x] CDN (Vercel Edge)
- [x] Daily backups (Supabase)

### ⚠️ Recommended to Add
- [ ] Error tracking (Sentry) - **Priority 1**
- [ ] Offsite backups (S3 Glacier) - **Priority 2**
- [ ] Paid uptime monitoring (UptimeRobot Pro) - **Priority 3**
- [ ] Professional insurance - **Priority 1** (covered in TCO)

### ❌ Not Needed Yet
- [ ] Redis cache
- [ ] Message queue
- [ ] Search engine (using PostgreSQL)
- [ ] Video infrastructure
- [ ] Separate object storage

---

## 💡 KEY TAKEAWAYS

### 1. Infrastructure is VERY Affordable
✅ **₹3,883/month** covers everything for 0-100 doctors  
✅ Scales incredibly well (₹388/doctor → ₹39/doctor)  
✅ No upgrades needed until 200+ doctors

### 2. Main Costs are Database + Hosting
- Supabase: 55% of infrastructure cost
- Vercel: 44% of infrastructure cost
- Everything else: <1%

### 3. Excellent Value for Money
- **Supabase Pro ($25)** replaces:
  - AWS RDS: $30-100/month
  - Auth0: $23-240/month
  - Firebase: $25-50/month
  - Redis: $10-30/month
  - **Savings:** $38-390/month!

- **Vercel Pro ($20)** replaces:
  - AWS EC2: $20-50/month
  - AWS ELB: $16/month
  - Cloudflare Pro: $20/month
  - **Savings:** $36-86/month!

### 4. Fixed Costs Become Negligible at Scale
- @ 10 doctors: ₹388/doctor (19% of revenue)
- @ 50 doctors: ₹78/doctor (4% of revenue)
- @ 100 doctors: ₹39/doctor (2% of revenue)
- @ 500 doctors: ₹8/doctor (0.4% of revenue)

**This is EXCELLENT unit economics!** 🎯

---

**Report Complete**  
*See also: `COST_ANALYSIS_REPORT.md`, `CONSUMPTION_COST_PER_DOCTOR.md`, `TOTAL_COST_OF_OWNERSHIP_ANALYSIS.md`*
