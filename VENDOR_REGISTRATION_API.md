# Vendor Registration API — Frontend Integration Guide

Base URL: `http://localhost:8000/api`

---

## 1. Submit Vendor Registration (Public)

**`POST /api/register`**

Multipart form-data (because of file uploads). No auth required.

### Request fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `company_name` | string | yes | |
| `registered_address` | string | yes | |
| `website` | string | no | Must be a valid URL |
| `registered_phone` | string | yes | |
| `company_type` | string | yes | `limited` \| `partnership` \| `proprietorship` \| `others` |
| `company_nature` | string | yes | `manufacturer` \| `manufacturer_cum_export` |
| `trade_licence_number` | string | yes | |
| `organization_scale` | string | yes | `micro` \| `medium` |
| `tin` | string | no | |
| `bin` | string | no | |
| `contact_name` | string | yes | Applicant's full name |
| `contact_email` | string | yes | Applicant's email — used to create their Member account on approval |
| `attachment_nid_passport` | file | yes | PDF, JPG, JPEG, PNG — max 5 MB |
| `attachment_trade_licence` | file | yes | PDF, JPG, JPEG, PNG — max 5 MB |
| `attachment_registration_licence` | file | yes | PDF, JPG, JPEG, PNG — max 5 MB |
| `attachment_tin` | file | yes | PDF, JPG, JPEG, PNG — max 5 MB |
| `attachment_bin` | file | yes | PDF, JPG, JPEG, PNG — max 5 MB |

### Success response `201`

```json
{
  "message": "Registration submitted successfully.",
  "id": "1"
}
```

### Error response `422` (validation failed)

```json
{
  "message": "The company name field is required.",
  "errors": {
    "company_name": ["The company name field is required."]
  }
}
```

---

## 2. Admin Login

Admin uses the same OTP flow as vendors. The seeded admin credentials are:

- **Member code**: `NAJUS-ADMIN`
- **Email**: `admin@najus.com`

### Step 1 — Request OTP

**`POST /api/auth/request-otp`**

```json
{ "member_code": "NAJUS-ADMIN" }
```

Response `200`:
```json
{
  "message": "OTP sent.",
  "maskedEmail": "ad***@najus.com"
}
```

### Step 2 — Verify OTP and get token

**`POST /api/auth/verify-otp`**

```json
{
  "member_code": "NAJUS-ADMIN",
  "otp": "123456"
}
```

Response `200`:
```json
{
  "token": "1|abcdefghij...",
  "member": {
    "id": "6",
    "code": "NAJUS-ADMIN",
    "name": "NAJUS Admin",
    "email": "admin@najus.com",
    "role": "admin"
  }
}
```

All subsequent admin requests must include:
```
Authorization: Bearer <token>
```

---

## 3. List Registrations (Admin)

**`GET /api/admin/registrations`**

Headers: `Authorization: Bearer <token>`

### Query params

| Param | Type | Notes |
|---|---|---|
| `status` | string | Filter by `pending` \| `approved` \| `rejected` |
| `per_page` | integer | Default 15 |
| `page` | integer | Default 1 |

### Success response `200`

```json
{
  "data": [
    {
      "id": "1",
      "companyName": "Test Company Ltd",
      "registeredAddress": "123 Dhaka Road",
      "website": "https://testco.com",
      "registeredPhone": "01700000000",
      "companyType": "limited",
      "companyNature": "manufacturer",
      "tradeLicenceNumber": "TL-12345",
      "organizationScale": "micro",
      "tin": null,
      "bin": null,
      "contactName": "Jane Doe",
      "contactEmail": "jane@testco.com",
      "attachmentNidPassport": "http://localhost:8000/storage/registrations/uuid/nid_passport.jpg",
      "attachmentTradeLicence": "http://localhost:8000/storage/registrations/uuid/trade_licence.pdf",
      "attachmentRegistrationLicence": "http://localhost:8000/storage/registrations/uuid/registration_licence.pdf",
      "attachmentTin": "http://localhost:8000/storage/registrations/uuid/tin.pdf",
      "attachmentBin": "http://localhost:8000/storage/registrations/uuid/bin.pdf",
      "status": "pending",
      "rejectionReason": null,
      "reviewedAt": null,
      "reviewedBy": null,
      "createdAt": "2026-02-25T18:26:13.000000Z"
    }
  ],
  "meta": {
    "currentPage": 1,
    "lastPage": 3,
    "total": 42,
    "perPage": 15
  }
}
```

---

## 4. Get Single Registration (Admin)

**`GET /api/admin/registrations/{id}`**

Headers: `Authorization: Bearer <token>`

### Success response `200`

```json
{
  "data": { /* same shape as list item above */ }
}
```

### Error `404`

```json
{ "message": "No query results for model [App\\Models\\VendorRegistration] 99" }
```

---

## 5. Approve Registration (Admin)

**`POST /api/admin/registrations/{id}/approve`**

Headers: `Authorization: Bearer <token>`

No request body needed.

### What happens on the server
1. A `Vendor` record is created from the registration data.
2. A `Member` record is created with an auto-generated `NAJUS-XXX` code (next in sequence).
3. Registration status is set to `approved`.
4. An approval email is sent to `contactEmail` with the new NAJUS member code.

### Success response `200`

```json
{
  "message": "Registration approved.",
  "member_code": "NAJUS-006",
  "vendor_id": "7"
}
```

### Error `422` — already reviewed

```json
{ "message": "Registration is not pending." }
```

---

## 6. Reject Registration (Admin)

**`POST /api/admin/registrations/{id}/reject`**

Headers: `Authorization: Bearer <token>`

### Request body (JSON)

```json
{
  "rejection_reason": "Incomplete documentation — TIN certificate is unreadable."
}
```

### Success response `200`

```json
{ "message": "Registration rejected." }
```

### Error `422` — already reviewed

```json
{ "message": "Registration is not pending." }
```

### Error `422` — missing reason

```json
{
  "message": "The rejection reason field is required.",
  "errors": {
    "rejection_reason": ["The rejection reason field is required."]
  }
}
```

---

## Registration Status Lifecycle

```
[submitted] → pending → approved  (Vendor + Member created, email sent)
                      → rejected  (rejection_reason stored)
```

Once a registration is approved or rejected it cannot be re-reviewed (the API returns 422).

---

## Attachment URLs

All five attachment fields in the response are fully qualified public URLs pointing to `http://localhost:8000/storage/...`. They can be opened directly in a browser `<img>` tag or `<iframe>` for PDF preview.

Files are stored under `storage/app/public/registrations/{uuid}/`.

---

## Notes for Frontend

- The registration form must use `enctype="multipart/form-data"` (or `FormData` in Angular's `HttpClient`).
- All IDs in responses are **strings**, not numbers.
- All JSON keys are **camelCase**.
- Admin routes return `403` if the authenticated member's `role` is not `admin`.
- The standard Laravel 401 `{ "message": "Unauthenticated." }` is returned when the Bearer token is missing or invalid.
