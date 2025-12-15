# 🚨 SECURITY AUDIT REPORT - MyGymplanner

**Date:** 2025-12-15
**Auditor:** Senior Security Researcher (AI)
**Scope:** Full application security audit

---

## EXECUTIVE SUMMARY

**Critical Vulnerabilities Found: 5**
**High Severity: 3**
**Medium Severity: 4**
**Low Severity: 2**

**Overall Risk Level: 🔴 CRITICAL - Immediate action required**

---

## 🔴 CRITICAL VULNERABILITIES

### 1. Weak JWT Secret with Insecure Fallback
**File:** `/server/utils/tokenUtils.js:4`
**Severity:** 🔴 CRITICAL
**CVSS Score:** 9.8

**Vulnerability:**
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
```

**Impact:**
- If `JWT_SECRET` environment variable is not set in production, the application falls back to the hardcoded `'dev-secret'`
- An attacker who knows this secret can forge JWTs for ANY user
- Complete authentication bypass - full account takeover of all users
- The default secret is publicly visible in the source code

**Proof of Concept:**
```javascript
const jwt = require('jsonwebtoken');
const forgedToken = jwt.sign(
  { userId: 'victim-user-id', email: 'victim@example.com', type: 'access' },
  'dev-secret',  // Publicly known secret
  { expiresIn: '1h' }
);
// Attacker now has a valid access token for any user
```

**Recommendation:**
- Remove the fallback entirely
- Make JWT_SECRET a required environment variable
- Application should FAIL to start if JWT_SECRET is not set
- Rotate JWT_SECRET in production immediately if it was ever set to 'dev-secret'

**Fix:**
```javascript
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable must be set');
}
```

---

### 2. Overly Permissive CORS Configuration
**File:** `/server/server.js:26`
**Severity:** 🔴 CRITICAL
**CVSS Score:** 8.1

**Vulnerability:**
```javascript
if (allowedOrigins.includes(origin) || origin.includes('.vercel.app')) {
  callback(null, true);
}
```

**Impact:**
- ANY domain hosted on Vercel can make authenticated requests to your API
- An attacker can deploy a malicious site on Vercel (free tier)
- Malicious site can steal user tokens, session data, or perform actions on behalf of users
- Cross-Site Request Forgery (CSRF) attacks possible

**Attack Scenario:**
1. Attacker deploys `malicious-gym-phishing.vercel.app`
2. User visits attacker's site while logged into MyGymplanner
3. Attacker's JavaScript can make authenticated API calls to steal data or modify user account

**Recommendation:**
- Whitelist ONLY your specific Vercel domains
- Use exact domain matching, not substring matching
- Implement CSRF tokens for state-changing operations

**Fix:**
```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://mygymplanner.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

---

### 3. No Rate Limiting - Brute Force Attack Vulnerability
**File:** `/server/server.js` (missing middleware)
**Severity:** 🔴 CRITICAL
**CVSS Score:** 7.5

**Vulnerability:**
- No rate limiting on ANY endpoint
- Login endpoint can be brute-forced
- Registration endpoint can be spammed
- Password reset (via backup codes) can be brute-forced

**Impact:**
- Attackers can perform unlimited login attempts to crack passwords
- Backup codes (12 characters) can be brute-forced
- Account enumeration via registration/login responses
- Denial of Service through resource exhaustion
- API abuse without consequences

**Attack Scenarios:**
1. **Brute Force Login:** 1,000,000 password attempts per hour
2. **Backup Code Brute Force:** Try all 32^12 combinations
3. **Account Enumeration:** Discover all registered email addresses
4. **DoS:** Spam registration/login to exhaust database/CPU

**Recommendation:**
Install and configure `express-rate-limit`:

**Fix:**
```javascript
const rateLimit = require('express-rate-limit');

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Strict rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true
});

app.use('/api/', apiLimiter);
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);
app.use('/api/users/login-backup-code', authLimiter);
```

---

## 🟠 HIGH SEVERITY VULNERABILITIES

### 4. Missing Security Headers
**File:** `/server/server.js`
**Severity:** 🟠 HIGH
**CVSS Score:** 6.5

**Vulnerability:**
No security headers are configured. Missing:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`

**Impact:**
- Clickjacking attacks possible
- MIME-sniffing attacks possible
- XSS attacks easier to execute
- Man-in-the-middle attacks if HTTPS is downgraded

**Recommendation:**
Install and configure `helmet`:

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

### 5. Sensitive Error Information Disclosure
**File:** `/server/server.js:58-65`
**Severity:** 🟠 HIGH
**CVSS Score:** 5.3

**Vulnerability:**
```javascript
app.use((err, req, res, next) => {
  console.error('Error occurred:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message,  // ⚠️ Exposes error details
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});
```

**Impact:**
- Error messages can reveal:
  - Internal file paths
  - Database structure details
  - Third-party library versions
  - SQL query patterns
- Helps attackers map the application structure

**Example Leak:**
```json
{
  "error": "Something went wrong!",
  "message": "SQLITE_ERROR: no such column: admin_password"
}
```
This reveals database column names and SQL structure.

**Recommendation:**
```javascript
app.use((err, req, res, next) => {
  // Log full error server-side
  console.error('Error occurred:', err.stack);

  // Generic error response to client
  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      message: err.message,
      stack: err.stack
    })
  });
});
```

---

### 6. User Enumeration via Registration Response
**File:** `/server/controllers/userController.js:84`
**Severity:** 🟠 HIGH
**CVSS Score:** 5.3

**Vulnerability:**
```javascript
if (existingUser) {
  return res.status(400).json({ error: 'User already exists' });
}
```

**Impact:**
- Attackers can enumerate all registered email addresses
- Privacy violation - users can be tracked
- Enables targeted phishing attacks
- Violates GDPR/privacy principles

**Attack:**
```bash
# Check if victim@company.com is registered
curl -X POST /api/users/register \
  -d '{"email":"victim@company.com","password":"Test123!"}'

# Response reveals if user exists
{"error": "User already exists"}  # User is registered!
{"user": {...}}  # User doesn't exist (new registration succeeded)
```

**Recommendation:**
Use ambiguous error messages and implement account confirmation:

```javascript
if (existingUser) {
  // Don't reveal if user exists
  return res.status(400).json({
    error: 'If this email is not registered, a confirmation link will be sent.'
  });
}

// Or use email verification
sendVerificationEmail(email);
return res.status(200).json({
  message: 'Please check your email to verify your account.'
});
```

---

## 🟡 MEDIUM SEVERITY VULNERABILITIES

### 7. Tokens Stored in LocalStorage (XSS Risk)
**File:** `/client/src/contexts/AuthContext.jsx`
**Severity:** 🟡 MEDIUM
**CVSS Score:** 4.3

**Vulnerability:**
Access tokens and refresh tokens are stored in `localStorage`:
```javascript
localStorage.setItem('user', JSON.stringify(updatedUser))
```

**Impact:**
- If an XSS vulnerability exists anywhere in the application, attackers can steal tokens
- localStorage is accessible to all JavaScript on the same origin
- Tokens persist across browser sessions

**Recommendation:**
- Use `httpOnly` cookies for refresh tokens (not accessible to JavaScript)
- Keep access tokens in memory only
- Implement automatic token refresh

---

### 8. No Request ID for Audit Logging
**Severity:** 🟡 MEDIUM

**Vulnerability:**
- No request tracking/correlation IDs
- Difficult to trace security incidents
- No audit trail for security events

**Recommendation:**
Add request ID middleware for better security monitoring.

---

### 9. No Account Lockout Mechanism
**File:** `/server/controllers/userController.js` (login function)
**Severity:** 🟡 MEDIUM

**Vulnerability:**
- No account lockout after failed login attempts
- Even with rate limiting, determined attackers can continue trying

**Recommendation:**
Implement account lockout after N failed attempts.

---

### 10. Backup Code Timing Attack Vulnerability
**File:** `/server/utils/backupCodeUtils.js:61-64`
**Severity:** 🟡 MEDIUM
**CVSS Score:** 4.0

**Vulnerability:**
```javascript
async function verifyBackupCode(code, hash) {
  const normalizedCode = code.replace(/-/g, '');
  return bcrypt.compare(normalizedCode, hash);
}
```

**Impact:**
- `bcrypt.compare` is timing-safe, so this is actually OK
- BUT: The iteration through multiple backup codes could reveal information

**Current Protection:**
- bcrypt inherently provides timing attack resistance
- This is NOT a critical issue but worth noting

---

## 🟢 LOW SEVERITY / BEST PRACTICE IMPROVEMENTS

### 11. Long Refresh Token Expiry
**File:** `/server/utils/tokenUtils.js:6`
**Severity:** 🟢 LOW

```javascript
const REFRESH_TOKEN_EXPIRY = '365d'; // 1 year
```

**Recommendation:**
Consider shorter expiry (30-90 days) with re-authentication prompts for sensitive operations.

---

### 12. Missing Input Sanitization
**Severity:** 🟢 LOW

**Observation:**
While parameterized queries prevent SQL injection, there's no HTML sanitization for user-generated content.

**Recommendation:**
Sanitize user input displayed in the UI to prevent stored XSS.

---

## ✅ SECURITY STRENGTHS FOUND

Good security practices already implemented:

1. ✅ **bcrypt for password hashing** - Using 10 rounds (adequate)
2. ✅ **Parameterized SQL queries** - All queries use `.prepare()` with bound parameters
3. ✅ **Password complexity requirements** - Strong validation in place
4. ✅ **JWT token type validation** - Checks token type before accepting
5. ✅ **Backup codes hashed** - Not stored in plaintext
6. ✅ **Session management** - Proper session tracking and revocation
7. ✅ **Authorization checks** - Recently added to user endpoints

---

## PRIORITY FIX RECOMMENDATIONS

### Immediate (Fix Today):
1. 🔴 Fix JWT_SECRET fallback - **CRITICAL**
2. 🔴 Fix CORS wildcard Vercel domains - **CRITICAL**
3. 🔴 Add rate limiting - **CRITICAL**

### This Week:
4. 🟠 Add security headers (helmet)
5. 🟠 Fix error message disclosure
6. 🟠 Fix user enumeration

### This Month:
7. 🟡 Move tokens to httpOnly cookies
8. 🟡 Implement account lockout
9. 🟡 Add request ID tracking
10. 🟡 Add audit logging

---

## SUMMARY

This application has **5 critical and high-severity vulnerabilities** that require immediate attention. The most critical issues are:

1. **Weak JWT secret with public fallback** - Allows complete authentication bypass
2. **Overly permissive CORS** - Allows attacks from any Vercel domain
3. **No rate limiting** - Allows brute force and DoS attacks

These three vulnerabilities can be exploited to **completely compromise the application** and all user accounts.

**Estimated Fix Time:** 4-6 hours for all critical issues

---

**Report End**
