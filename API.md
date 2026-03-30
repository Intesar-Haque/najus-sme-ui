# NAJUS SME — Backend API Contract

Base URL (development): `http://127.0.0.1:8000/api`
Authentication: Laravel Sanctum Bearer token
All authenticated requests must include: `Authorization: Bearer <token>`

---

## Shared Types

### Member object
Returned by auth endpoints and `GET /auth/me`.

```json
{
  "code": "NAJUS-001",
  "name": "Fatema Begum",
  "email": "fatema@example.com",
  "vendorId": "42",
  "role": "vendor",
  "registrationStatus": "approved"
}
```

| Field | Type | Description |
|---|---|---|
| `code` | `string` | Membership code |
| `name` | `string` | Full name |
| `email` | `string` | Registered email |
| `vendorId` | `string` | Linked vendor/store ID |
| `role` | `"vendor" \| "admin"` | Member role |
| `registrationStatus` | `null \| "pending" \| "approved" \| "rejected"` | See table below |

#### registrationStatus values

| Value | Meaning |
|---|---|
| `null` | No registration submitted yet → frontend redirects to `/join` |
| `"pending"` | Submitted, awaiting admin review → dashboard locked |
| `"approved"` | Approved (or seeded vendor) → full dashboard access |
| `"rejected"` | Rejected → session invalidated, user told to contact support |

---

## Auth Endpoints

### POST `/auth/request-otp`

Validates identifier and sends a one-time password to the member's registered email.

**Request**
```json
{ "identifier": "NAJUS-001" }
```
`identifier` accepts either a **membership code** (e.g. `NAJUS-001`) or a **registered email address**.

**Response `200`**
```json
{ "maskedEmail": "fa***@example.com" }
```

**Error responses**
| Status | When |
|---|---|
| `404` | No member found for the given identifier |
| `422` | Validation failed |

---

### POST `/auth/verify-otp`

Verifies the OTP and creates a Sanctum token session.

**Request**
```json
{
  "identifier": "NAJUS-001",
  "otp": "123456"
}
```

**Response `200`**
```json
{
  "member": { /* Member object */ },
  "token": "1|abcdefghijklmnop..."
}
```

**Error responses**
| Status | When |
|---|---|
| `404` | Member not found |
| `422` | OTP invalid or expired |

---

### GET `/auth/me` 🔒

Returns fresh member data for the currently authenticated user.
Called by the Angular auth guard on every dashboard entry to verify access.

**Response `200`**
```json
{
  "data": { /* Member object */ }
}
```

**Error responses**
| Status | When |
|---|---|
| `401` | Token invalid or expired — frontend clears session |

---

### POST `/auth/logout` 🔒

Revokes the current Sanctum token.

**Response `200`**
```json
{ "message": "Logged out." }
```

---

## Vendor Registration

### POST `/register`

Public endpoint. Submits a new vendor registration. Accepts `multipart/form-data`.

**Form fields**

| Field | Required | Notes |
|---|---|---|
| `company_name` | yes | |
| `registered_address` | yes | |
| `registered_phone` | yes | |
| `company_type` | yes | `limited \| partnership \| proprietorship \| others` |
| `company_nature` | yes | `manufacturer \| manufacturer_cum_export` |
| `trade_licence_number` | yes | |
| `organization_scale` | yes | `micro \| medium` |
| `website` | no | |
| `tin` | no | |
| `bin` | no | |
| `contact_name` | yes | |
| `contact_email` | yes | |
| `attachment_nid_passport` | yes | PDF/JPG/JPEG/PNG, max 5 MB |
| `attachment_trade_licence` | yes | PDF/JPG/JPEG/PNG, max 5 MB |
| `attachment_registration_licence` | yes | PDF/JPG/JPEG/PNG, max 5 MB |
| `attachment_tin` | yes | PDF/JPG/JPEG/PNG, max 5 MB |
| `attachment_bin` | yes | PDF/JPG/JPEG/PNG, max 5 MB |

**Response `201`**
```json
{ "message": "Registration submitted successfully.", "id": "15" }
```

After successful submission the member's `registrationStatus` must become `"pending"`.

---

## Public Endpoints

### GET `/stats`
```json
{
  "members": 120,
  "products": 850,
  "categories": 24,
  "events": 18,
  "districts": 32,
  "yearsActive": 5
}
```

### GET `/categories`
```json
{ "data": [ { "id": "1", "name": "Textiles", "nameBn": "বস্ত্র", "icon": "skin", "color": "#...", "bgColor": "#...", "productCount": 120 } ] }
```

### GET `/products`

Query params: `q`, `categories[]`, `min_price`, `max_price`, `min_rating`, `in_stock=1`, `sort` (`price_asc|price_desc|rating|popular|newest`), `featured=1`, `page`, `per_page`

```json
{
  "data": [ /* Product[] */ ],
  "meta": { "total": 200, "current_page": 1, "last_page": 17, "per_page": 12, "max_price": 5000 }
}
```

### GET `/products/:id`
```json
{ "data": { /* Product */ } }
```

### GET `/products/:id/related`
```json
{ "data": [ /* Product[] */ ] }
```

### GET `/vendors`

Query params: `q`, `categories[]`, `districts[]`, `verified=1`, `featured=1`, `sort`, `page`, `per_page`

```json
{
  "data": [ /* Vendor[] */ ],
  "meta": { "total": 80, "current_page": 1, "last_page": 4, "per_page": 20, "all_categories": ["Textiles", "..."], "all_districts": ["Dhaka", "..."] }
}
```

### GET `/vendors/:id`
```json
{ "data": { /* Vendor */ } }
```

### GET `/vendors/:id/products`
```json
{ "data": [ /* Product[] */ ] }
```

### GET `/events`

Query params: `q`, `type[]`, `free=1`, `open=1`, `sort` (`date_asc|date_desc`), `featured=1`, `page`, `per_page`

```json
{
  "data": [ /* SmeEvent[] */ ],
  "meta": { "total": 18, "current_page": 1, "last_page": 1, "per_page": 50, "free_count": 10, "open_count": 12 }
}
```

### GET `/events/:id`
```json
{ "data": { /* SmeEvent */ } }
```

### GET `/events/:id/related`
```json
{ "data": [ /* SmeEvent[] */ ] }
```

### POST `/events/:id/register`
```json
// request
{ "name": "...", "email": "...", "phone": "..." }

// response 201
{ "message": "Registered successfully.", "registration_id": 55 }
```

### GET `/blog`

Query params: `q`, `category`, `tags[]`, `sort` (`newest|read_time`), `featured=1`, `page`, `per_page`

```json
{
  "data": [ /* BlogPost[] */ ],
  "featured": { /* BlogPost | null */ },
  "meta": { "total": 40, "current_page": 1, "last_page": 2, "per_page": 50, "all_categories": ["..."], "all_tags": ["..."] }
}
```

### GET `/blog/:id`
```json
{ "data": { /* BlogPost */ } }
```

---

## Dashboard Endpoints (all 🔒)

### GET `/dashboard/overview`
```json
{
  "member": { /* Member object — must include registrationStatus */ },
  "vendor": { /* Vendor | null */ },
  "product_count": 12,
  "total_orders": 87,
  "monthly_revenue": 45000
}
```

### GET `/dashboard/products`
```json
{ "data": [ /* Product[] */ ] }
```

### GET `/dashboard/products/:id`
```json
{ "data": { /* Product */ } }
```

### POST `/dashboard/products`
Body: JSON product fields. Returns `{ "data": { /* Product */ } }`

### PUT `/dashboard/products/:id`
Body: JSON product fields. Returns `{ "data": { /* Product */ } }`

### DELETE `/dashboard/products/:id`
Response `204` No Content.

### GET `/dashboard/orders`
```json
{
  "data": [
    {
      "id": 1,
      "product_name": "Nakshi Kantha",
      "customer_name": "Rahim",
      "amount": 1500,
      "order_date": "2025-03-15",
      "status": "delivered"
    }
  ]
}
```
`status` values: `pending | processing | delivered | cancelled`

### GET `/dashboard/analytics`
```json
{
  "monthly_revenue": [ { "month": "Jan", "revenue": 12000 } ],
  "top_products": [ { "name": "...", "reviews": 24, "rating": 4.5, "pct": 80 } ],
  "summary": {
    "orders_this_month": 14,
    "orders_last_month": 11,
    "avg_order_value": 1200,
    "avg_order_value_last": 1050,
    "pending_orders": 3,
    "cancellation_rate": 5.2,
    "cancellation_rate_last": 4.8
  }
}
```

### GET `/dashboard/events`
```json
{ "data": [ /* SmeEvent[] */ ] }
```

### PUT `/dashboard/settings`
```json
// request
{ "name": "...", "phone": "...", "address": "..." }

// response
{ "member": { /* Member object */ } }
```

---

## Orders (public/member)

### GET `/orders`

Query params: `membership_id`, `source`, `status`, `per_page`, `page`

```json
{
  "data": [ /* Order[] */ ],
  "meta": { "currentPage": 1, "lastPage": 3, "total": 45, "perPage": 20 }
}
```

### POST `/orders`
```json
// request
{
  "customer_name": "...",
  "customer_email": "...",
  "notes": "...",
  "source": "marketplace",
  "items": [
    { "product_name": "...", "quantity": 2, "unit_price": 500 }
  ]
}

// response 201
{ "message": "Order placed.", "id": "77", "total": 1000, "status": "pending" }
```

---

## Error Format

All error responses follow:
```json
{ "message": "Human-readable error description." }
```

Validation errors (422):
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "field": ["Error detail."]
  }
}
```
