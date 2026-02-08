# Consumption Cost Per Doctor Analysis
**Date:** February 6, 2026  
**Focus:** Per-doctor operational consumption costs with time-per-case variables

---

## 📊 QUICK ANSWER: CONSUMPTION COST FOR ONE DOCTOR

### Base Scenario (Average Doctor)
**Monthly Consumption Cost:** **₹155-533** depending on scale

| Component | Cost |
|-----------|------|
| **Variable (Gemini API)** | ₹155/month |
| **Fixed (Infrastructure, allocated @ 10 doctors)** | ₹378/month |
| **Total @ 10 doctors** | **₹533/month** |
| **Total @ 50 doctors** | **₹231/month** |
| **Total @ 100+ doctors** | **₹193/month** |

**Cost per consultation:** **₹0.24** (at average usage)

---

## 🎯 PURE CONSUMPTION COSTS (Variable Only)

These costs scale **directly** with doctor usage:

### Breakdown by AI Service
| Service | API Calls/Month | Cost/Month |
|---------|----------------|------------|
| **Audio Transcription** | 10,560 segments | ₹79.71 |
| **SOAP Note Generation** | 660 calls | ₹26.01 |
| **Prescription Generation** | 660 calls | ₹20.14 |
| **Voice Editing** | 1,320 calls | ₹19.30 |
| **Clinical Chat** | 660 messages | ₹10.07 |
| **TOTAL VARIABLE** | | **₹155.23/month** |

---

## ⏱️ COST BY TIME PER CASE (Consultation Duration)

### How Consultation Time Affects Cost

**Key Formula:**
- **Cost per minute of consultation:** ₹0.24 ÷ 8 min = **₹0.03/minute**
- **Consultation time drives:** Audio transcription (60% of API cost)

### Scenarios by Consultation Duration

#### Light User: 5-minute consultations
- **Consultations/day:** 30
- **Consultations/month:** 660
- **Total audio minutes:** 3,300 min/month
- **Audio transcription cost:** ₹50
- **Other AI costs:** ₹75
- **TOTAL VARIABLE:** **₹125/month**
- **Cost per consultation:** **₹0.19**

---

#### Average User: 8-minute consultations (baseline)
- **Consultations/day:** 30
- **Consultations/month:** 660
- **Total audio minutes:** 5,280 min/month
- **Audio transcription cost:** ₹80
- **Other AI costs:** ₹75
- **TOTAL VARIABLE:** **₹155/month**
- **Cost per consultation:** **₹0.24**

---

#### Heavy User: 12-minute consultations
- **Consultations/day:** 30
- **Consultations/month:** 660
- **Total audio minutes:** 7,920 min/month
- **Audio transcription cost:** ₹120
- **Other AI costs:** ₹75
- **TOTAL VARIABLE:** **₹195/month**
- **Cost per consultation:** **₹0.30**

---

#### Super Heavy User: 15-minute consultations
- **Consultations/day:** 30
- **Consultations/month:** 660
- **Total audio minutes:** 9,900 min/month
- **Audio transcription cost:** ₹150
- **Other AI costs:** ₹75
- **TOTAL VARIABLE:** **₹225/month**
- **Cost per consultation:** **₹0.34**

---

## 📊 COST BY CONSULTATION VOLUME

### How Number of Cases Affects Cost

| Doctor Type | Cases/Day | Cases/Month | Audio Minutes | Variable Cost | Cost/Case |
|-------------|-----------|-------------|---------------|---------------|-----------|
| **Part-time** | 15 | 330 | 2,640 | ₹78 | ₹0.24 |
| **Standard** | 30 | 660 | 5,280 | ₹155 | ₹0.24 |
| **Busy** | 40 | 880 | 7,040 | ₹207 | ₹0.24 |
| **Very Busy** | 50 | 1,100 | 8,800 | ₹259 | ₹0.24 |
| **Extreme** | 60 | 1,320 | 10,560 | ₹310 | ₹0.24 |

**Key Insight:** Cost per case remains consistent at **₹0.24** regardless of volume!

---

## 💰 COMPLETE MONTHLY COST FOR ONE DOCTOR

### Including Infrastructure (Fixed Costs Allocated)

These are the **total costs to keep the software running** for one doctor:

| Scale | Variable (API) | Fixed (Allocated) | **Total/Doctor** | % Increase |
|-------|----------------|-------------------|------------------|------------|
| **Solo (1 doctor)** | ₹155 | ₹3,783 | **₹3,938** | Baseline |
| **Small (5 doctors)** | ₹155 | ₹757 | **₹912** | -77% |
| **Growing (10 doctors)** | ₹155 | ₹378 | **₹533** | -86% |
| **Established (30 doctors)** | ₹155 | ₹126 | **₹281** | -93% |
| **Scale (50 doctors)** | ₹155 | ₹76 | **₹231** | -94% |
| **Large (100 doctors)** | ₹155 | ₹38 | **₹193** | -95% |
| **Enterprise (500 doctors)** | ₹155 | ₹8 | **₹163** | -96% |

**Fixed costs include:**
- Supabase Pro: $25/month (₹2,097)
- Vercel Pro: $20/month (₹1,678)
- Vercel Blob Storage: ~$0.10/month (₹8)

---

## 🔢 CALCULATION EXAMPLES

### Example 1: Standard Doctor (30 cases/day, 8 min each)

**Monthly consumption:**
```
Consultations: 30/day × 22 days = 660/month
Audio minutes: 660 × 8 = 5,280 minutes

API Costs:
- Transcription (16 segments × 660): ₹79.71
- SOAP notes (660 calls): ₹26.01
- Prescriptions (660 calls): ₹20.14
- Voice edits (1,320 calls): ₹19.30
- Chat (optional): ₹10.07
────────────────────────────────────
TOTAL: ₹155.23/month

Cost per consultation: ₹155.23 ÷ 660 = ₹0.24
Cost per minute: ₹155.23 ÷ 5,280 = ₹0.029
```

---

### Example 2: Busy Specialist (50 cases/day, 12 min each)

**Monthly consumption:**
```
Consultations: 50/day × 22 days = 1,100/month
Audio minutes: 1,100 × 12 = 13,200 minutes

API Costs:
- Transcription (24 segments × 1,100): ₹199.00
- SOAP notes (1,100 calls): ₹43.35
- Prescriptions (1,100 calls): ₹33.57
- Voice edits (2,200 calls): ₹32.17
- Chat: ₹16.79
────────────────────────────────────
TOTAL: ₹324.88/month

Cost per consultation: ₹324.88 ÷ 1,100 = ₹0.30
Cost per minute: ₹324.88 ÷ 13,200 = ₹0.025
```

---

### Example 3: Light User (15 cases/day, 5 min each)

**Monthly consumption:**
```
Consultations: 15/day × 22 days = 330/month
Audio minutes: 330 × 5 = 1,650 minutes

API Costs:
- Transcription (10 segments × 330): ₹24.93
- SOAP notes (330 calls): ₹13.01
- Prescriptions (330 calls): ₹10.07
- Voice edits (660 calls): ₹9.65
- Chat: ₹5.03
────────────────────────────────────
TOTAL: ₹62.69/month

Cost per consultation: ₹62.69 ÷ 330 = ₹0.19
Cost per minute: ₹62.69 ÷ 1,650 = ₹0.038
```

---

## 📉 OPTIMIZED CONSUMPTION COSTS

### After Implementing Cost Optimizations

With the recommended optimizations from your cost analysis:

1. **60-second audio segments** (vs 30s): Save ₹40/month
2. **Combined SOAP+Prescription calls**: Save ₹20/month
3. **Prompt caching**: Save ₹15/month

**Optimized variable cost:** ₹155 - ₹75 = **₹80/month**

### Optimized Cost by Usage

| Doctor Type | Cases/Month | Optimized Cost | Cost/Case |
|-------------|-------------|----------------|-----------|
| **Light (15/day)** | 330 | ₹40 | ₹0.12 |
| **Average (30/day)** | 660 | ₹80 | ₹0.12 |
| **Heavy (50/day)** | 1,100 | ₹133 | ₹0.12 |

---

## 💡 KEY INSIGHTS

### 1. Consumption Cost is Very Predictable
✅ **₹0.24 per consultation** regardless of doctor volume  
✅ Scales linearly with usage  
✅ No surprise costs

### 2. Time Per Case Has Moderate Impact
- **5-min consultations:** ₹0.19/case
- **8-min consultations:** ₹0.24/case (baseline)
- **12-min consultations:** ₹0.30/case
- **15-min consultations:** ₹0.34/case

**Impact:** +25% cost for +50% consultation time (reasonable scaling)

### 3. Fixed Costs Dominate at Low Scale
- **At 1 doctor:** 96% of cost is fixed infrastructure
- **At 10 doctors:** 71% fixed, 29% variable
- **At 50 doctors:** 33% fixed, 67% variable
- **At 100+ doctors:** 20% fixed, 80% variable

### 4. Excellent Gross Margins
**At ₹2,000/month pricing:**
- Variable cost: ₹155 (8% of revenue)
- **Gross margin on consumption: 92%** 🎯

---

## 🎯 WHAT THIS MEANS

### For ONE Doctor at Current Scale

**If you have 10 doctors total:**
```
Variable (API) cost: ₹155/month
Allocated fixed cost: ₹378/month
────────────────────────────────────
TOTAL cost to serve: ₹533/month
Revenue (Premium): ₹2,000/month
────────────────────────────────────
Gross profit: ₹1,467/month
Margin: 73%
```

**If you have 50 doctors total:**
```
Variable (API) cost: ₹155/month
Allocated fixed cost: ₹76/month
────────────────────────────────────
TOTAL cost to serve: ₹231/month
Revenue (Premium): ₹2,000/month
────────────────────────────────────
Gross profit: ₹1,769/month
Margin: 88%
```

**If you have 100+ doctors total:**
```
Variable (API) cost: ₹155/month
Allocated fixed cost: ₹38/month
────────────────────────────────────
TOTAL cost to serve: ₹193/month
Revenue (Premium): ₹2,000/month
────────────────────────────────────
Gross profit: ₹1,807/month
Margin: 90%
```

---

## 📋 CONSUMPTION COST CALCULATOR

### Simple Formula

**Variable cost = (Consultations/month × ₹0.24)**

**Fixed allocation = ₹3,783 ÷ Total doctors**

**Total cost = Variable + Fixed allocation**

### Custom Calculation

Fill in your numbers:

```
Doctor's consultations per day: ____ 
Working days per month: ____ (typically 22)
Average minutes per consultation: ____ (typically 8)
Total doctors on platform: ____ 

Calculations:
Monthly consultations = [Consults/day] × [Days/month]
Variable cost = [Monthly consultations] × ₹0.24
Fixed allocation = ₹3,783 ÷ [Total doctors]
────────────────────────────────────
TOTAL COST TO SERVE = Variable + Fixed allocation
```

---

## 🔍 ADDITIONAL COSTS (Not Included Above)

The pure consumption costs above **DO NOT** include:

### Development & Support (Human Costs)
- Customer support: ₹300-7,500/doctor (depends on scale)
- Development/maintenance: ₹450-7,500/doctor (depends on scale)
- See `TOTAL_COST_OF_OWNERSHIP_ANALYSIS.md` for full breakdown

### Business Overhead
- Insurance (E&O, cyber): ₹250-2,500/doctor (allocated)
- Legal & compliance: ₹100-1,000/doctor (allocated)
- Accounting: ₹100-1,000/doctor (allocated)
- Customer acquisition: ₹400/doctor (amortized)

### True All-In Cost
- **Technology consumption:** ₹193-533/doctor
- **+ Human/business costs:** ₹2,000-17,000/doctor (scale-dependent)
- **= Total cost of ownership:** ₹2,193-17,533/doctor

**See full TCO report for complete picture.**

---

## ✅ SUMMARY: Consumption Cost Per Doctor

| Metric | Value |
|--------|-------|
| **Pure variable (API) cost** | ₹155/month |
| **Cost per consultation** | ₹0.24 |
| **Cost per minute of audio** | ₹0.029 |
| **With infrastructure @ 10 docs** | ₹533/month |
| **With infrastructure @ 50+ docs** | ₹193-231/month |
| **Gross margin on consumption** | 90%+ |

**Bottom line:** Software is **incredibly efficient** at ₹0.24 per consultation. The main cost is infrastructure allocation at small scale, which becomes negligible at 50+ doctors.

---

**Report Complete**  
*For full cost analysis including team/support costs, see `TOTAL_COST_OF_OWNERSHIP_ANALYSIS.md`*
