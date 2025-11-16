# MyGymPlanner - Phase 1 MVP Testing Guide

**Date:** November 16, 2025
**Status:** Ready for Testing

---

## Prerequisites

### 1. Start the Application

**Terminal 1 - Backend Server:**
```bash
cd /home/user/MyGymplanner/server
npm run dev
```
Expected output: `Server running on port 3001`

**Terminal 2 - Frontend:**
```bash
cd /home/user/MyGymplanner/client
npm run dev
```
Expected output: `Local: http://localhost:5173/`

**OR run both concurrently from root:**
```bash
cd /home/user/MyGymplanner
npm run dev
```

### 2. Access the Application

- **Desktop:** Open browser to `http://localhost:5173`
- **Mobile Testing:**
  - Find your machine's local IP: `ifconfig` or `ipconfig`
  - Access from mobile device: `http://[YOUR_IP]:5173`
  - Ensure mobile device is on same network

---

## Testing Checklist

### Test 1: User Registration & Authentication
**Location:** `http://localhost:5173/login`

**Steps:**
1. Open application (should redirect to /login)
2. Click "Create Account"
3. Enter test credentials:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
4. Click "Register"

**Expected Results:**
- ✅ Form validates email format
- ✅ Password input is hidden
- ✅ Successful registration redirects to /onboarding
- ✅ Token stored in localStorage
- ✅ User data returned and stored

**Mobile-Specific Checks:**
- ✅ Input fields are large enough (min 48px height)
- ✅ Mobile keyboard appears with correct type (email, text, password)
- ✅ Touch targets are easy to tap
- ✅ Form is responsive and readable on small screens

---

### Test 2: Equipment Selection (Onboarding)
**Location:** `http://localhost:5173/onboarding`

**Steps:**
1. After registration, you should land on onboarding page
2. Select equipment you have access to:
   - Check: Barbell
   - Check: Dumbbells
   - Check: Pull-up Bar
   - Check: Bench
3. Click "Complete Setup"

**Expected Results:**
- ✅ Equipment checkboxes are large and touch-friendly
- ✅ Multiple selections work correctly
- ✅ "Complete Setup" button is prominent
- ✅ Successful save redirects to /dashboard
- ✅ Equipment saved to user profile

**Mobile-Specific Checks:**
- ✅ Checkboxes have large touch areas (min 44px)
- ✅ Grid layout adapts to screen size
- ✅ Scrolling works smoothly
- ✅ Equipment list is readable

---

### Test 3: Dashboard Overview
**Location:** `http://localhost:5173/dashboard`

**Steps:**
1. View dashboard landing page
2. Observe quick stats cards
3. Check recent workouts section
4. Verify CTAs are visible

**Expected Results:**
- ✅ Welcome message displays user name
- ✅ Stats show: Active Plans, This Week, Total Workouts
- ✅ "Generate New Plan" CTA is prominent
- ✅ "View Today's Workout" CTA is visible
- ✅ If no workouts yet, shows empty state message

**Mobile-Specific Checks:**
- ✅ Cards stack vertically on mobile
- ✅ Stats are readable and well-spaced
- ✅ Touch targets for CTAs are large (min 48px)
- ✅ Content fits screen without horizontal scroll

---

### Test 4: Generate Training Plan
**Location:** `http://localhost:5173/generate-plan`

**Steps:**
1. Navigate to "New Plan" from header or dashboard
2. Fill out plan configuration:
   - Days per week: 4
   - Session length: 60 minutes
   - Primary goal: Muscle Building
   - Strength to Cardio: 80/20
   - Experience level: Intermediate
3. Click "Generate Plan"
4. Wait for plan to generate
5. Review generated plan preview
6. Click "Save Plan"

**Expected Results:**
- ✅ Form fields are pre-filled with sensible defaults
- ✅ All dropdowns work correctly
- ✅ Loading spinner appears during generation
- ✅ Generated plan shows:
  - Weekly schedule with day names
  - Exercise names and counts
  - Upper/Lower or Full Body split
  - Rest days clearly marked
- ✅ "Save Plan" button appears after generation
- ✅ Successful save redirects to /dashboard
- ✅ Active plan now appears on dashboard

**Mobile-Specific Checks:**
- ✅ Select dropdowns open properly on mobile
- ✅ Form inputs have large touch targets
- ✅ Plan preview is scrollable and readable
- ✅ Buttons are thumb-friendly
- ✅ No horizontal scrolling required

**Backend Verification:**
- Check `server/data/plans.json` - new plan should be saved
- Verify plan includes exercises from selected equipment only
- Confirm muscle group balance in generated plan

---

### Test 5: Today's Workout View
**Location:** `http://localhost:5173/today`

**Steps:**
1. Navigate to "Today" from header
2. View today's scheduled workout
3. Check exercise details
4. Click "Start Workout"

**Expected Results:**
- ✅ Correct day's workout is displayed based on current date
- ✅ Exercise cards show:
  - Exercise name
  - Muscle groups targeted
  - Sets × Reps format
  - Rest time
  - Equipment needed
- ✅ If rest day, shows motivational tips
- ✅ "Start Workout" button is large and prominent
- ✅ Clicking starts workout → redirects to /log-workout

**Mobile-Specific Checks:**
- ✅ Exercise cards are easy to read
- ✅ Scrollable list works smoothly
- ✅ "Start Workout" button fills width on mobile
- ✅ Icons and emojis render correctly

---

### Test 6: Workout Logger (CRITICAL - <5 Second Set Logging)
**Location:** `http://localhost:5173/log-workout`

**Steps:**
1. Start from "Today's Workout" or navigate directly
2. For each exercise, log sets:
   - **Set 1:** Enter weight (e.g., 135), enter reps (e.g., 8)
   - Click ✓ to complete set
   - **Rest Timer:** Should automatically start
   - **Set 2:** Enter weight (e.g., 135), enter reps (e.g., 8)
   - Click ✓ to complete set
3. Rate overall RPE: 7/10
4. Add notes: "Felt strong today"
5. Click "Complete Workout"

**Expected Results:**
- ✅ Weight/reps inputs pre-filled from previous set
- ✅ Numeric keyboard appears on mobile (inputMode="decimal")
- ✅ Large ✓ complete button (52px circle)
- ✅ Rest timer overlay appears after completing a set
- ✅ Timer counts down from prescribed rest time (e.g., 90s)
- ✅ Timer can be skipped with "Skip Rest" button
- ✅ **Vibration feedback when timer ends (mobile only)**
- ✅ Progress indicator shows sets completed (e.g., "2/3 complete")
- ✅ All exercises can be logged
- ✅ "Complete Workout" saves to backend
- ✅ Redirect to /progress after completion

**Mobile-Specific Checks (CRITICAL):**
- ✅ **Input fields are large (min 48px height)**
- ✅ **Complete button is thumb-sized (52px circle)**
- ✅ **Numeric keyboard with decimal support**
- ✅ **Rest timer is full-screen overlay on mobile**
- ✅ **Vibration works (test on physical device)**
- ✅ **One-handed operation possible**
- ✅ **No accidental taps**
- ✅ **Fast input: Can log a set in <5 seconds**

**Performance Test:**
- Time how long it takes to log one set:
  1. Tap weight input (0.5s)
  2. Enter weight (1.5s)
  3. Tap reps input (0.5s)
  4. Enter reps (1s)
  5. Tap ✓ complete (0.5s)
  - **Total: ~4 seconds ✅**

**Backend Verification:**
- Check `server/data/workouts.json` - new workout should be saved
- Verify workout includes all sets with weight/reps
- Confirm date, duration, RPE, and notes are saved

---

### Test 7: Progress Dashboard
**Location:** `http://localhost:5173/progress`

**Steps:**
1. Navigate to "Progress" from header
2. View stats cards (Total Workouts, Streak, This Week)
3. Scroll through "This Week" stats
4. Scroll through "This Month" stats
5. View recent workouts timeline
6. Check achievements section

**Expected Results:**
- ✅ Stats cards display correct numbers:
  - Total workouts count
  - Current streak (consecutive days)
  - This week workout count
- ✅ Week stats show:
  - Total workouts
  - Total volume (lbs)
  - Avg duration (min)
  - Avg RPE
- ✅ Month stats show same metrics
- ✅ Recent workouts timeline displays:
  - Date formatted nicely
  - Exercise count
  - Duration
  - Notes (if any)
  - RPE rating
- ✅ Achievements unlock based on progress:
  - 🎯 First Workout (1+ workouts)
  - 💪 10 Workouts (10+ workouts)
  - ⭐ 30 Workouts (30+ workouts)
  - 🔥 3 Day Streak (3+ day streak)
  - 🚀 7 Day Streak (7+ day streak)
  - 💎 50K lbs Lifted (50,000+ lbs volume)

**Mobile-Specific Checks:**
- ✅ Stats cards stack vertically on mobile
- ✅ Timeline is scrollable and readable
- ✅ Achievement badges fit grid properly
- ✅ No horizontal scrolling
- ✅ Numbers are large and easy to read

**Streak Calculation Test:**
- Log workouts on consecutive days
- Verify streak increments correctly
- Skip a day, verify streak resets

---

### Test 8: Navigation & Header
**Applies to all pages**

**Steps:**
1. Navigate between all pages using header links
2. Click logo to return to dashboard
3. View user name in header
4. Click "Logout"

**Expected Results:**
- ✅ All navigation links work
- ✅ Active page is visually indicated
- ✅ Logo returns to /dashboard
- ✅ User name displays correctly
- ✅ Logout clears localStorage and redirects to /login
- ✅ After logout, protected routes redirect to /login

**Mobile-Specific Checks:**
- ✅ Header wraps properly on small screens
- ✅ Navigation links are touch-friendly
- ✅ Logout button is easy to tap
- ✅ Header remains sticky on scroll

---

## Mobile Testing Scenarios

### Scenario 1: Quick Workout Logging (Primary Use Case)
**Goal:** Log a full workout in minimal time

**Steps:**
1. Open app on phone: `http://[YOUR_IP]:5173`
2. Login with saved credentials
3. Tap "Today" in navigation
4. Tap "Start Workout"
5. For each exercise:
   - Tap weight, enter value
   - Tap reps, enter value
   - Tap ✓
   - Wait for rest timer or skip
6. Add RPE and notes
7. Tap "Complete Workout"

**Success Criteria:**
- ✅ Entire workout logged in <2 minutes per exercise
- ✅ No missed taps or UI frustration
- ✅ Numeric keyboard works correctly
- ✅ Rest timer provides clear countdown
- ✅ Vibration feedback confirms timer end

---

### Scenario 2: Plan Generation on Mobile
**Goal:** Create a new training plan entirely on phone

**Steps:**
1. Navigate to "New Plan"
2. Select all options using mobile dropdowns
3. Generate plan
4. Review plan preview (scroll through week)
5. Save plan

**Success Criteria:**
- ✅ All dropdowns open and close properly
- ✅ Plan preview is readable and scrollable
- ✅ Buttons are easy to tap
- ✅ No horizontal scrolling required

---

### Scenario 3: Progress Tracking on Mobile
**Goal:** Review workout history and stats on phone

**Steps:**
1. Navigate to "Progress"
2. View stats cards
3. Scroll through timeline
4. Check achievements

**Success Criteria:**
- ✅ All stats visible without zooming
- ✅ Timeline scrolls smoothly
- ✅ Achievement badges render correctly
- ✅ Numbers are legible

---

## Browser Compatibility Testing

### Desktop Browsers
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

### Mobile Browsers
- ✅ Chrome Mobile (Android)
- ✅ Safari (iOS)
- ✅ Samsung Internet (Android)

### Screen Sizes to Test
- ✅ Mobile: 375px - 428px width (iPhone SE to iPhone Pro Max)
- ✅ Tablet: 768px - 1024px width (iPad)
- ✅ Desktop: 1280px+ width

---

## API Testing (Optional)

You can test the backend API directly using curl or Postman:

### Register User
```bash
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get Exercises (with auth token)
```bash
curl http://localhost:3001/api/exercises?userId=<USER_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

### Generate Plan
```bash
curl -X POST http://localhost:3001/api/plans/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "userId": "<USER_ID>",
    "daysPerWeek": 4,
    "sessionLength": 60,
    "goal": "muscle-building",
    "strengthCardioSplit": "80/20",
    "experienceLevel": "intermediate",
    "equipment": ["barbell", "dumbbells", "bench"]
  }'
```

---

## Known Issues & Limitations

### Current Limitations
1. **No database:** Using JSON files for storage (will migrate to PostgreSQL in Phase 2)
2. **No charts:** Progress page uses stats cards instead of visual charts (recharts integration pending)
3. **No exercise search:** Exercise library shows all exercises (search coming in Phase 2)
4. **No plan editing:** Once generated, plans cannot be edited (coming in Phase 2)

### Mobile Considerations
1. **Vibration API:** Only works on physical devices, not simulators
2. **Network access:** Mobile device must be on same WiFi as dev server
3. **HTTPS required for some features:** PWA features require HTTPS in production

---

## Test Data Files

After testing, you can inspect these JSON files to verify data persistence:

- `/home/user/MyGymplanner/server/data/users.json` - User accounts
- `/home/user/MyGymplanner/server/data/exercises-database.json` - Built-in exercises
- `/home/user/MyGymplanner/server/data/custom-exercises.json` - User-uploaded exercises
- `/home/user/MyGymplanner/server/data/plans.json` - Generated training plans
- `/home/user/MyGymplanner/server/data/workouts.json` - Logged workouts

---

## Performance Benchmarks

### Target Performance Metrics
- ✅ Set logging: <5 seconds per set
- ✅ Plan generation: <3 seconds
- ✅ Page load: <2 seconds
- ✅ API response: <500ms

### Mobile Performance
- ✅ Touch response: <100ms
- ✅ Animation smoothness: 60fps
- ✅ Rest timer accuracy: ±1 second

---

## Regression Testing

After making changes, re-test these critical paths:

1. **Auth Flow:** Register → Login → Logout
2. **Core Flow:** Onboarding → Generate Plan → Log Workout → View Progress
3. **Mobile Flow:** All above on mobile device
4. **API Flow:** All CRUD operations work correctly

---

## Bug Reporting Template

If you find issues, document them as follows:

```
**Bug Title:** Brief description
**Severity:** Critical / High / Medium / Low
**Device:** Desktop / Mobile (specify model)
**Browser:** Chrome / Safari / etc.
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3
**Expected Result:** What should happen
**Actual Result:** What actually happened
**Screenshots:** Attach if applicable
```

---

## Next Steps After Testing

1. Fix any critical bugs found
2. Optimize mobile performance if needed
3. Add visual charts to Progress page (recharts)
4. Implement exercise search functionality
5. Migrate to PostgreSQL database
6. Deploy to production environment
7. Set up HTTPS for PWA features

---

**Testing Status:** Ready for comprehensive testing
**Last Updated:** November 16, 2025
