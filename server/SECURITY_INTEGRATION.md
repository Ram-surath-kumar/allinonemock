
# Security Framework Integration Guide for Developers

**Attention Engineering Team:**
A new Data Security & Audit Framework has been deployed to the `server/` core. You are required to adopt these patterns in your respective modules immediately to ensure ISO 27001 compliance.

## 1. Authentication & RBAC
**Do not** create open routes. Every route must be protected.

### Usage in Routes
```javascript
import { authenticateUser, authorizeRole } from '../middleware/auth.js';

// 1. Apply Authentication globally to your router
router.use(authenticateUser);

// 2. Protect specific endpoints with Roles
// Roles: 'admin', 'registrar', 'finance', 'faculty', 'student'
router.post('/create-exam', authorizeRole(['admin', 'faculty']), async (req, res) => { ... });
```

## 2. Secure Database Operations (MANDATORY)
**STOP** using `supabaseAdmin` directly for CRUD operations.
**START** using `secureDb` service. It handles:
- ✅ Automatic Encryption of Sensitive Fields (Aadhaar, Bank Info, etc.)
- ✅ Mandatory Audit Logging (Old vs New value diffing)
- ✅ Compliance Checks

### How to Refactor Your Code

#### Fetching Data (READ)
```javascript
import { secureDb } from '../services/db.js';

// BEFORE
// const { data } = await supabaseAdmin.from('exams').select('*').eq('id', id);

// AFTER
// Passing a callback to build the query allows the wrapper to execute it securely
const data = await secureDb.get('exams', (query) => query.eq('id', id));
```

#### Creating Data (CREATE)
```javascript
// BEFORE
// await supabaseAdmin.from('exams').insert(examData);

// AFTER
// Context is CRITICAL for audit logs (Who did this?)
const context = {
    user: req.user,             // from authenticateUser
    userProfile: req.userProfile, 
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    reason: 'Exam Creation'
};

const newExam = await secureDb.create('exams', examData, context);
```

#### Updating Data (UPDATE)
```javascript
// BEFORE
// await supabaseAdmin.from('exams').update(updates).eq('id', id);

// AFTER
const updatedExam = await secureDb.update('exams', id, updates, context);
```

#### Deleting Data (DELETE)
```javascript
// BEFORE
// await supabaseAdmin.from('exams').delete().eq('id', id);

// AFTER
await secureDb.delete('exams', id, context);
```

## 3. Sensitive Data Handling
The following fields are **automatically encrypted** by `secureDb`. Do not manipulate them manually or attempt to decrypt them without the helper service.
- `aadhaar_number`
- `bank_account_number`
- `phone` / `mobile`
- `salary_amount`

## 4. Failure Conditions
*   If `secureDb` cannot write to the **Audit Log**, the entire operation will fail (throw error).
*   **Do not catch and suppress this error** in a way that allows the operation to appear successful.
*   Use the standard `handleError(error, res)` helper.

---
*Refer to `server/config/securityConfig.js` for the latest list of sensitive fields and roles.*
