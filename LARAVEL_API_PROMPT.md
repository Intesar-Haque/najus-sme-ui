# NAJUS SME — Laravel API Backend: Full Build Prompt

Use this document as a complete specification to build the Laravel 11 REST API backend for the NAJUS SME marketplace platform. Follow every instruction exactly. Do not skip any section.

---

## 1. PROJECT SETUP

```bash
composer create-project laravel/laravel najus-sme-api
cd najus-sme-api

# Required packages
composer require laravel/sanctum
composer require spatie/laravel-query-builder
composer require spatie/laravel-permission

php artisan install:api          # publishes sanctum config
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

**`.env` key settings:**
```env
APP_NAME="NAJUS SME API"
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:4500

DB_CONNECTION=mysql
DB_DATABASE=najus_sme
DB_USERNAME=root
DB_PASSWORD=

# OTP
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6

# Mail (for OTP emails)
MAIL_MAILER=smtp
MAIL_FROM_ADDRESS=noreply@najus.org.bd
MAIL_FROM_NAME="NAJUS SME"
```

**`config/cors.php`** — allow the Angular frontend:
```php
'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:4500')],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'supports_credentials' => true,
```

---

## 2. DATABASE SCHEMA

Run migrations in this order. Create each file with `php artisan make:migration`.

---

### 2.1 `categories`
```php
Schema::create('categories', function (Blueprint $table) {
    $table->id();
    $table->string('slug')->unique();          // handicrafts, textiles, food …
    $table->string('name');                    // English
    $table->string('name_bn');                 // Bengali
    $table->string('icon');                    // ant-design icon name
    $table->string('color', 10);               // #d97706
    $table->string('bg_color', 10);            // #fef3c7
    $table->unsignedInteger('product_count')->default(0);
    $table->timestamps();
});
```

---

### 2.2 `vendors`
```php
Schema::create('vendors', function (Blueprint $table) {
    $table->id();
    $table->string('slug')->unique();
    $table->string('name');
    $table->string('logo')->nullable();        // URL
    $table->string('cover_image')->nullable(); // URL
    $table->text('description')->nullable();
    $table->string('location');                // "Banasree, Dhaka"
    $table->string('district');                // "Dhaka"
    $table->string('member_since', 4);         // year "2020"
    $table->unsignedInteger('product_count')->default(0);
    $table->decimal('rating', 3, 2)->default(0);
    $table->unsignedInteger('review_count')->default(0);
    $table->boolean('verified')->default(false);
    $table->boolean('featured')->default(false);
    $table->string('phone')->nullable();
    $table->string('email')->nullable();
    $table->string('facebook')->nullable();    // handle only, not full URL
    $table->timestamps();
    $table->softDeletes();
});
```

---

### 2.3 `vendor_categories` (pivot)
```php
Schema::create('vendor_categories', function (Blueprint $table) {
    $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
    $table->foreignId('category_id')->constrained()->cascadeOnDelete();
    $table->primary(['vendor_id', 'category_id']);
});
```

---

### 2.4 `members`
```php
Schema::create('members', function (Blueprint $table) {
    $table->id();
    $table->string('code')->unique();          // NAJUS-001
    $table->string('name');
    $table->string('email')->unique();
    $table->foreignId('vendor_id')->nullable()->constrained()->nullOnDelete();
    $table->enum('role', ['vendor', 'admin'])->default('vendor');
    $table->boolean('active')->default(true);
    $table->timestamps();
});
```

---

### 2.5 `otps`
```php
Schema::create('otps', function (Blueprint $table) {
    $table->id();
    $table->foreignId('member_id')->constrained()->cascadeOnDelete();
    $table->string('code', 6);
    $table->timestamp('expires_at');
    $table->boolean('used')->default(false);
    $table->timestamps();
});
```

---

### 2.6 `products`
```php
Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->string('slug')->unique();
    $table->string('name');
    $table->text('description');
    $table->decimal('price', 10, 2);
    $table->decimal('original_price', 10, 2)->nullable();
    $table->string('currency', 3)->default('BDT');
    $table->foreignId('category_id')->constrained();
    $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
    $table->decimal('rating', 3, 2)->default(0);
    $table->unsignedInteger('review_count')->default(0);
    $table->boolean('in_stock')->default(true);
    $table->boolean('featured')->default(false);
    $table->boolean('is_new')->default(false);
    $table->timestamps();
    $table->softDeletes();
});
```

---

### 2.7 `product_images`
```php
Schema::create('product_images', function (Blueprint $table) {
    $table->id();
    $table->foreignId('product_id')->constrained()->cascadeOnDelete();
    $table->string('url');
    $table->unsignedTinyInteger('sort_order')->default(0);
    $table->timestamps();
});
```

---

### 2.8 `product_tags`
```php
Schema::create('product_tags', function (Blueprint $table) {
    $table->id();
    $table->foreignId('product_id')->constrained()->cascadeOnDelete();
    $table->string('tag');
    $table->index('tag');
});
```

---

### 2.9 `events`
```php
Schema::create('events', function (Blueprint $table) {
    $table->id();
    $table->string('slug')->unique();
    $table->string('title');
    $table->text('description');
    $table->string('image')->nullable();
    $table->date('date');
    $table->date('end_date');
    $table->string('location');
    $table->enum('type', ['trade-fair', 'workshop', 'exhibition', 'webinar', 'networking']);
    $table->string('organizer');
    $table->boolean('is_free')->default(true);
    $table->decimal('price', 8, 2)->nullable();
    $table->boolean('featured')->default(false);
    $table->boolean('registration_open')->default(true);
    $table->timestamps();
    $table->softDeletes();
});
```

---

### 2.10 `event_registrations`
```php
Schema::create('event_registrations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('event_id')->constrained()->cascadeOnDelete();
    $table->string('full_name');
    $table->string('email');
    $table->string('phone')->nullable();
    $table->unsignedTinyInteger('attendees')->default(1);
    $table->text('message')->nullable();
    $table->enum('status', ['pending', 'confirmed', 'cancelled'])->default('confirmed');
    $table->timestamps();
});
```

---

### 2.11 `blog_posts`
```php
Schema::create('blog_posts', function (Blueprint $table) {
    $table->id();
    $table->string('slug')->unique();
    $table->string('title');
    $table->text('excerpt');
    $table->longText('content')->nullable();   // full article body
    $table->string('image')->nullable();
    $table->string('author');
    $table->string('author_image')->nullable();
    $table->date('published_at');
    $table->string('category');               // 'Success Stories' | 'Insights' | 'Guides'
    $table->unsignedTinyInteger('read_time')->default(5); // minutes
    $table->boolean('featured')->default(false);
    $table->timestamps();
    $table->softDeletes();
});
```

---

### 2.12 `blog_tags`
```php
Schema::create('blog_tags', function (Blueprint $table) {
    $table->id();
    $table->foreignId('blog_post_id')->constrained()->cascadeOnDelete();
    $table->string('tag');
    $table->index('tag');
});
```

---

## 3. ELOQUENT MODELS

Create with `php artisan make:model`. Add these relationships and casts.

---

### `app/Models/Category.php`
```php
protected $fillable = ['slug','name','name_bn','icon','color','bg_color','product_count'];

public function products(): HasMany { return $this->hasMany(Product::class); }
public function vendors(): BelongsToMany {
    return $this->belongsToMany(Vendor::class, 'vendor_categories');
}
```

---

### `app/Models/Vendor.php`
```php
protected $fillable = [
    'slug','name','logo','cover_image','description',
    'location','district','member_since','product_count',
    'rating','review_count','verified','featured',
    'phone','email','facebook',
];
protected $casts = ['verified'=>'boolean','featured'=>'boolean','rating'=>'float'];

public function categories(): BelongsToMany {
    return $this->belongsToMany(Category::class, 'vendor_categories');
}
public function products(): HasMany  { return $this->hasMany(Product::class); }
public function member(): HasOne     { return $this->hasOne(Member::class); }
```

---

### `app/Models/Member.php`
```php
protected $fillable = ['code','name','email','vendor_id','role','active'];

public function vendor(): BelongsTo { return $this->belongsTo(Vendor::class); }
public function otps(): HasMany     { return $this->hasMany(Otp::class); }

public function currentOtp(): HasOne {
    return $this->hasOne(Otp::class)
                ->where('used', false)
                ->where('expires_at', '>', now())
                ->latestOfMany();
}
```

---

### `app/Models/Otp.php`
```php
protected $fillable = ['member_id','code','expires_at','used'];
protected $casts    = ['expires_at'=>'datetime','used'=>'boolean'];

public function member(): BelongsTo { return $this->belongsTo(Member::class); }
```

---

### `app/Models/Product.php`
```php
protected $fillable = [
    'slug','name','description','price','original_price','currency',
    'category_id','vendor_id','rating','review_count',
    'in_stock','featured','is_new',
];
protected $casts = [
    'price'=>'float','original_price'=>'float',
    'in_stock'=>'boolean','featured'=>'boolean','is_new'=>'boolean',
    'rating'=>'float',
];

public function category(): BelongsTo { return $this->belongsTo(Category::class); }
public function vendor(): BelongsTo   { return $this->belongsTo(Vendor::class); }
public function images(): HasMany     { return $this->hasMany(ProductImage::class)->orderBy('sort_order'); }
public function productTags(): HasMany{ return $this->hasMany(ProductTag::class); }

// Virtual accessor: tags as plain string array
public function getTagsAttribute(): array {
    return $this->productTags->pluck('tag')->toArray();
}
```

---

### `app/Models/Event.php`
```php
protected $fillable = [
    'slug','title','description','image','date','end_date',
    'location','type','organizer','is_free','price',
    'featured','registration_open',
];
protected $casts = [
    'date'=>'date','end_date'=>'date',
    'is_free'=>'boolean','featured'=>'boolean','registration_open'=>'boolean',
    'price'=>'float',
];

public function registrations(): HasMany {
    return $this->hasMany(EventRegistration::class);
}
```

---

### `app/Models/BlogPost.php`
```php
protected $fillable = [
    'slug','title','excerpt','content','image',
    'author','author_image','published_at','category','read_time','featured',
];
protected $casts = ['published_at'=>'date','featured'=>'boolean'];

public function blogTags(): HasMany { return $this->hasMany(BlogTag::class); }

public function getTagsAttribute(): array {
    return $this->blogTags->pluck('tag')->toArray();
}
```

---

## 4. API RESOURCES (JSON shape)

Create with `php artisan make:resource`. These define the exact JSON the Angular frontend expects.

---

### `CategoryResource`
```php
public function toArray($request): array {
    return [
        'id'           => $this->slug,     // Angular uses string id
        'name'         => $this->name,
        'nameBn'       => $this->name_bn,
        'icon'         => $this->icon,
        'color'        => $this->color,
        'bgColor'      => $this->bg_color,
        'productCount' => $this->product_count,
    ];
}
```

---

### `VendorSummaryResource` (embedded in products)
```php
public function toArray($request): array {
    return [
        'id'       => (string) $this->id,
        'name'     => $this->name,
        'logo'     => $this->logo,
        'verified' => $this->verified,
    ];
}
```

---

### `VendorResource`
```php
public function toArray($request): array {
    return [
        'id'           => (string) $this->id,
        'name'         => $this->name,
        'logo'         => $this->logo,
        'coverImage'   => $this->cover_image,
        'description'  => $this->description,
        'categories'   => $this->whenLoaded('categories', fn() =>
                              $this->categories->pluck('name')->toArray()),
        'location'     => $this->location,
        'district'     => $this->district,
        'memberSince'  => $this->member_since,
        'productCount' => $this->product_count,
        'rating'       => $this->rating,
        'reviewCount'  => $this->review_count,
        'verified'     => $this->verified,
        'featured'     => $this->featured,
        'phone'        => $this->phone,
        'email'        => $this->email,
        'facebook'     => $this->facebook,
    ];
}
```

---

### `ProductResource`
```php
public function toArray($request): array {
    return [
        'id'            => (string) $this->id,
        'name'          => $this->name,
        'description'   => $this->description,
        'price'         => $this->price,
        'originalPrice' => $this->original_price,
        'currency'      => $this->currency,
        'images'        => $this->whenLoaded('images', fn() =>
                               $this->images->pluck('url')->toArray(), []),
        'categoryId'    => $this->category?->slug,
        'category'      => $this->category?->name,
        'vendor'        => new VendorSummaryResource($this->whenLoaded('vendor')),
        'rating'        => $this->rating,
        'reviewCount'   => $this->review_count,
        'tags'          => $this->tags,   // virtual accessor
        'inStock'       => $this->in_stock,
        'featured'      => $this->featured,
        'isNew'         => $this->is_new,
    ];
}
```

---

### `EventResource`
```php
public function toArray($request): array {
    return [
        'id'               => (string) $this->id,
        'title'            => $this->title,
        'description'      => $this->description,
        'image'            => $this->image,
        'date'             => $this->date?->toDateString(),
        'endDate'          => $this->end_date?->toDateString(),
        'location'         => $this->location,
        'type'             => $this->type,
        'organizer'        => $this->organizer,
        'isFree'           => $this->is_free,
        'price'            => $this->price,
        'featured'         => $this->featured,
        'registrationOpen' => $this->registration_open,
    ];
}
```

---

### `BlogPostResource`
```php
public function toArray($request): array {
    return [
        'id'          => (string) $this->id,
        'title'       => $this->title,
        'excerpt'     => $this->excerpt,
        'content'     => $this->when($request->routeIs('blog.show'), $this->content),
        'image'       => $this->image,
        'author'      => $this->author,
        'authorImage' => $this->author_image,
        'date'        => $this->published_at?->toDateString(),
        'tags'        => $this->tags,
        'category'    => $this->category,
        'readTime'    => $this->read_time,
        'featured'    => $this->featured,
    ];
}
```

---

### `MemberResource`
```php
public function toArray($request): array {
    return [
        'code'     => $this->code,
        'name'     => $this->name,
        'email'    => $this->email,
        'vendorId' => (string) $this->vendor_id,
        'role'     => $this->role,
    ];
}
```

---

### `SiteStatsResource`
```php
// Return directly from controller — no model needed
return response()->json([
    'members'     => Member::where('active', true)->count(),
    'products'    => Product::where('in_stock', true)->count(),
    'categories'  => Category::count(),
    'events'      => Event::count(),
    'districts'   => Vendor::distinct('district')->count('district'),
    'yearsActive' => (int) date('Y') - 2020,
]);
```

---

## 5. AUTHENTICATION — OTP FLOW

### How it works
1. Client sends `member_code` → server generates a 6-digit OTP, emails it, returns masked email.
2. Client sends `member_code` + `otp` → server validates, issues Sanctum token, returns member.
3. All protected routes use `auth:sanctum` middleware.

### `OtpService` (`app/Services/OtpService.php`)
```php
class OtpService {

    public function generate(Member $member): Otp {
        // Invalidate previous unused OTPs
        $member->otps()->where('used', false)->update(['used' => true]);

        $otp = $member->otps()->create([
            'code'       => str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT),
            'expires_at' => now()->addMinutes(config('app.otp_expiry', 10)),
        ]);

        // Send email
        Mail::to($member->email)->send(new OtpMail($member, $otp->code));

        return $otp;
    }

    public function verify(Member $member, string $code): bool {
        $otp = $member->otps()
                      ->where('code', $code)
                      ->where('used', false)
                      ->where('expires_at', '>', now())
                      ->latest()
                      ->first();

        if (!$otp) return false;

        $otp->update(['used' => true]);
        return true;
    }

    public function maskEmail(string $email): string {
        [$user, $domain] = explode('@', $email);
        return substr($user, 0, 2) . str_repeat('*', max(0, strlen($user) - 2)) . '@' . $domain;
    }
}
```

### `OtpMail` (`app/Mail/OtpMail.php`)
```php
// Create with: php artisan make:mail OtpMail --markdown=emails.otp
// Sends a plain OTP code with expiry notice.
// Subject: "Your NAJUS SME Login Code: {otp}"
```

---

## 6. CONTROLLERS

Create with `php artisan make:controller --api`.

---

### 6.1 `AuthController`

```
POST   /api/auth/request-otp     → requestOtp()
POST   /api/auth/verify-otp      → verifyOtp()
POST   /api/auth/logout          → logout()       [auth:sanctum]
GET    /api/auth/me              → me()           [auth:sanctum]
```

**`requestOtp(Request $request)`**
- Validate: `member_code` required, string
- Find `Member` by code (case-insensitive): `Member::whereRaw('LOWER(code) = ?', [strtolower($request->member_code)])->firstOrFail()`
- If not found: return 404 `{ message: 'Membership code not found. Please check and try again.' }`
- Generate OTP via `OtpService::generate(member)`
- Return 200 `{ maskedEmail: 'ru***@example.com' }`

**`verifyOtp(Request $request)`**
- Validate: `member_code` required, `otp` required|string|size:6
- Find member or 404
- Verify via `OtpService::verify(member, otp)`
- If invalid: return 422 `{ message: 'Invalid or expired OTP. Please try again.' }`
- Delete existing tokens: `member->tokens()->delete()`
- Create Sanctum token: `token = member->createToken('najus-sme-app')->plainTextToken`
- Return 200 `{ member: MemberResource, token: token }`

**`logout()`**
- `auth()->user()->currentAccessToken()->delete()`
- Return 200 `{ message: 'Logged out successfully.' }`

**`me()`**
- Return `new MemberResource(auth()->user())`

---

### 6.2 `CategoryController`

```
GET   /api/categories     → index()
GET   /api/categories/{slug}  → show()
```

**`index()`**
- Return all categories ordered by name
- Include `product_count`
- `CategoryResource::collection(Category::orderBy('name')->get())`

---

### 6.3 `ProductController`

```
GET   /api/products           → index()
GET   /api/products/{id}      → show()
GET   /api/products/{id}/related → related()
```

**`index(Request $request)`**
- Accepted query params:
  - `q` — free-text search (name, description, tags, vendor name)
  - `category` — category slug (single)
  - `min_price`, `max_price` — decimal
  - `min_rating` — decimal (0, 3, 4, 4.5)
  - `in_stock` — boolean (1/0)
  - `featured` — boolean
  - `sort` — enum: `default|price_asc|price_desc|rating|popular|newest`
  - `page`, `per_page` (default 12, max 50)
- Eager load: `with(['category', 'vendor', 'images', 'productTags'])`
- Search: use `LIKE` or full-text on name, description; join `product_tags` for tag search
- Sort logic:
  - `default`: featured DESC, id DESC
  - `price_asc`: price ASC
  - `price_desc`: price DESC
  - `rating`: rating DESC
  - `popular`: review_count DESC
  - `newest`: created_at DESC
- Return paginated: `ProductResource::collection($products->paginate($perPage))`
- Include meta: `max_price` in response (for price slider initialisation)

**`show($id)`**
- Load by id or 404
- Eager load: `with(['category', 'vendor', 'images', 'productTags'])`
- Return `new ProductResource($product)`

**`related($id)`**
- Load product or 404
- Return max 4 products from same category, excluding current id
- Eager load same as show
- Return `ProductResource::collection($related)`

---

### 6.4 `VendorController`

```
GET   /api/vendors            → index()
GET   /api/vendors/{id}       → show()
GET   /api/vendors/{id}/products → products()
```

**`index(Request $request)`**
- Accepted query params:
  - `q` — search name, description, location, category names
  - `category` — category name string (e.g., "Handicrafts")
  - `district` — district name string
  - `verified` — boolean
  - `sort` — enum: `default|rating|products|newest|name`
  - `page`, `per_page` (default 20, max 50)
- Eager load: `with(['categories'])`
- Category filter: join vendor_categories + categories, filter by name
- Sort:
  - `default`: featured DESC, id DESC
  - `rating`: rating DESC
  - `products`: product_count DESC
  - `newest`: CAST(member_since AS UNSIGNED) DESC
  - `name`: name ASC
- Also return in response meta:
  - `all_categories`: distinct category names across all vendors
  - `all_districts`: distinct districts from all vendors

**`show($id)`**
- Load by id or 404 (accept numeric id)
- Eager load: `with(['categories'])`
- Return `new VendorResource($vendor)`

**`products($id)`**
- Load vendor or 404
- Return all vendor's products with full eager load
- Return `ProductResource::collection($vendor->products()->with([...])->get())`

---

### 6.5 `EventController`

```
GET   /api/events             → index()
GET   /api/events/{id}        → show()
GET   /api/events/{id}/related → related()
POST  /api/events/{id}/register → register()
```

**`index(Request $request)`**
- Accepted query params:
  - `q` — search title, description, location, organizer
  - `type` — comma-separated or array of event types (trade-fair, workshop, etc.)
  - `free` — boolean (is_free=true)
  - `open` — boolean (registration_open=true)
  - `sort` — enum: `date_asc|date_desc|featured`
  - `page`, `per_page` (default 20)
- Response meta: `total`, `free_count`, `open_count`
- Sort:
  - `date_asc`: date ASC
  - `date_desc`: date DESC
  - `featured`: featured DESC, date ASC

**`show($id)`**
- Load by id or 404
- Return `new EventResource($event)`

**`related($id)`**
- Load event or 404
- Return max 3 events: same type OR featured, excluding current id
- Order by featured DESC, date ASC

**`register(Request $request, $id)`**
- Load event or 404
- Validate `registration_open = true` else 422 `{ message: 'Registration is currently closed.' }`
- Validate body:
  ```php
  'full_name'  => 'required|string|max:100',
  'email'      => 'required|email',
  'phone'      => 'nullable|string|max:20',
  'attendees'  => 'required|integer|min:1|max:5',
  'message'    => 'nullable|string|max:500',
  ```
- Create `EventRegistration` record
- Send confirmation email to registrant (use `Mail::to($request->email)->send(...)`)
- Return 201 `{ message: 'Registration confirmed!', registration_id: $reg->id }`

---

### 6.6 `BlogController`

```
GET   /api/blog           → index()
GET   /api/blog/{id}      → show()
```

**`index(Request $request)`**
- Accepted query params:
  - `q` — search title, excerpt, author, category, tags
  - `category` — exact category string
  - `tags` — comma-separated or array of tags (OR logic)
  - `sort` — enum: `newest|oldest|read_time`
  - `page`, `per_page` (default 12)
- Eager load: `with(['blogTags'])`
- Tag filter: join `blog_tags`, filter by tag value
- Response meta: `all_categories`, `all_tags`
- Sort:
  - `newest`: published_at DESC
  - `oldest`: published_at ASC
  - `read_time`: read_time ASC (quick reads first)
- Include `featured` post separately in the response for the listing:
  ```json
  {
    "featured": { ...BlogPostResource },
    "data": [ ...paginated results ],
    "meta": { "current_page": 1, "total": 6, "all_categories": [...], "all_tags": [...] }
  }
  ```

**`show($id)`**
- Load by id with `with(['blogTags'])`
- Return `new BlogPostResource($post)` — includes `content` field (full article body)

---

### 6.7 `StatsController`

```
GET   /api/stats   → index()
```

```php
return response()->json([
    'members'     => Member::where('active', true)->count(),
    'products'    => Product::count(),
    'categories'  => Category::count(),
    'events'      => Event::count(),
    'districts'   => Vendor::distinct('district')->count('district'),
    'yearsActive' => (int) date('Y') - 2020,
]);
```

---

### 6.8 `DashboardController` — Protected

All routes require `auth:sanctum` middleware.

```
GET   /api/dashboard/overview     → overview()
GET   /api/dashboard/products     → products()
GET   /api/dashboard/orders       → orders()
GET   /api/dashboard/analytics    → analytics()
GET   /api/dashboard/events       → events()
PUT   /api/dashboard/settings     → updateSettings()
```

**`overview()`**
```php
$member = auth()->user()->load('vendor.products');
$vendor = $member->vendor;
return response()->json([
    'member'        => new MemberResource($member),
    'vendor'        => $vendor ? new VendorResource($vendor) : null,
    'product_count' => $vendor?->products->count() ?? 0,
    // monthly_revenue, total_orders from orders table (see below)
]);
```

**`products()`**
- Return all products belonging to the authenticated member's vendor
- Full ProductResource with images and tags

**`orders()`**
- Return paginated orders for the vendor
- Table `orders` (create a separate migration):
  ```php
  // orders table columns:
  // id, vendor_id (FK), product_name (string), customer_name, amount (decimal),
  // order_date (date), status (enum: pending, processing, delivered, cancelled)
  ```
- Return with status colors computed server-side if desired, or let frontend handle

**`analytics()`**
- Monthly revenue for last 6 months (aggregate from orders table)
- Top 5 products by review_count from vendor's products
- Return:
  ```json
  {
    "monthly_revenue": [
      { "month": "Aug", "revenue": 22400 },
      ...
    ],
    "top_products": [
      { "name": "...", "reviews": 124, "rating": 4.8, "pct": 100 },
      ...
    ]
  }
  ```

**`events()`**
- Return all events with `registration_open = true`, ordered by date
- Optional: return only events the member/vendor has registered for (add vendor_id to event_registrations)

**`updateSettings(Request $request)`**
- Validate and update member name, vendor phone, email, facebook
- Return updated `MemberResource`

---

## 7. ROUTES (`routes/api.php`)

```php
// Public routes
Route::get('/stats',                   [StatsController::class,    'index']);
Route::get('/categories',              [CategoryController::class, 'index']);
Route::get('/products',                [ProductController::class,  'index']);
Route::get('/products/{id}',           [ProductController::class,  'show']);
Route::get('/products/{id}/related',   [ProductController::class,  'related']);
Route::get('/vendors',                 [VendorController::class,   'index']);
Route::get('/vendors/{id}',            [VendorController::class,   'show']);
Route::get('/vendors/{id}/products',   [VendorController::class,   'products']);
Route::get('/events',                  [EventController::class,    'index']);
Route::get('/events/{id}',             [EventController::class,    'show']);
Route::get('/events/{id}/related',     [EventController::class,    'related']);
Route::post('/events/{id}/register',   [EventController::class,    'register']);
Route::get('/blog',                    [BlogController::class,     'index']);
Route::get('/blog/{id}',               [BlogController::class,     'show']);

// Auth routes (no middleware)
Route::prefix('auth')->group(function () {
    Route::post('/request-otp',  [AuthController::class, 'requestOtp']);
    Route::post('/verify-otp',   [AuthController::class, 'verifyOtp']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout',              [AuthController::class,     'logout']);
    Route::get('/auth/me',                   [AuthController::class,     'me']);
    Route::get('/dashboard/overview',        [DashboardController::class,'overview']);
    Route::get('/dashboard/products',        [DashboardController::class,'products']);
    Route::get('/dashboard/orders',          [DashboardController::class,'orders']);
    Route::get('/dashboard/analytics',       [DashboardController::class,'analytics']);
    Route::get('/dashboard/events',          [DashboardController::class,'events']);
    Route::put('/dashboard/settings',        [DashboardController::class,'updateSettings']);
});
```

---

## 8. DATABASE SEEDER

Create `php artisan make:seeder DatabaseSeeder` and seed with the exact dummy data from the Angular frontend so API responses match during development.

**Seed this data exactly:**

### Categories (8 rows)
| slug | name | name_bn | icon | color | bg_color | product_count |
|---|---|---|---|---|---|---|
| handicrafts | Handicrafts | হস্তশিল্প | tool | #d97706 | #fef3c7 | 312 |
| textiles | Textiles & Fashion | বস্ত্র ও ফ্যাশন | experiment | #7c3aed | #ede9fe | 487 |
| food | Food & Spices | খাবার ও মশলা | coffee | #b45309 | #fef9c3 | 261 |
| electronics | Electronics | ইলেকট্রনিক্স | mobile | #0284c7 | #e0f2fe | 94 |
| health | Health & Beauty | স্বাস্থ্য ও সৌন্দর্য | heart | #db2777 | #fce7f3 | 178 |
| home | Home & Living | গৃহ ও সজ্জা | home | #059669 | #d1fae5 | 203 |
| agriculture | Agriculture & Organic | কৃষি ও জৈব | environment | #16a34a | #dcfce7 | 167 |
| services | Professional Services | পেশাদার সেবা | solution | #475569 | #f1f5f9 | 96 |

### Vendors (6 rows) + their categories and 1 Member each
Seed all 6 vendors (Rupali Handicrafts, Sylhet Tea Garden, Dhaka Muslin House, Green Earth Organics, Nakshi Collective, Bengal Pottery Studio) with their full data. Create 1 Member per vendor using codes NAJUS-001 through NAJUS-005 (no member for v6).

### Products (20 rows)
Seed all 20 products (p1–p20) with their images and tags. Map category slugs correctly.

### Events (4 rows)
Seed all 4 events (NAJUS SME Trade Fair, Women Entrepreneurs Workshop, Photography Masterclass, Rajshahi Agro Exhibition).

### Blog Posts (6 rows)
Seed all 6 blog posts (b1–b6) with their tags.

---

## 9. WIRING INTO THE ANGULAR FRONTEND

When the API is ready, replace each `DataService` method in `src/app/core/services/data.service.ts` with an `HttpClient` call to `environment.api`:

```typescript
// environment.ts
export const environment = {
  api: 'http://127.0.0.1:8000/api',
};

// Example replacement in DataService:
// BEFORE (dummy):
getFeaturedProducts(limit = 8): Product[] {
  return this.products.slice(0, limit);
}

// AFTER (real API):
getFeaturedProducts(limit = 8): Observable<Product[]> {
  return this.http.get<{ data: Product[] }>(
    `${environment.api}/products?featured=1&per_page=${limit}`
  ).pipe(map(r => r.data));
}
```

**Auth integration:** Replace `AuthService` OTP methods with `HttpClient` calls:
```typescript
requestOtp(memberCode: string): Observable<{ maskedEmail: string }> {
  return this.http.post<{ maskedEmail: string }>(
    `${environment.api}/auth/request-otp`,
    { member_code: memberCode }
  );
}

verifyOtp(memberCode: string, otp: string): Observable<Member> {
  return this.http.post<{ member: Member; token: string }>(
    `${environment.api}/auth/verify-otp`,
    { member_code: memberCode, otp }
  ).pipe(
    tap(res => {
      this.setSession(res.member);
      localStorage.setItem('najus_token', res.token);
    }),
    map(res => res.member)
  );
}
```

Add `Authorization: Bearer {token}` header via an `HttpInterceptor` that reads `najus_token` from localStorage.

---

## 10. ADDITIONAL NOTES

- **Pagination**: All list endpoints return Laravel's standard paginated response. The Angular frontend uses NZ-ZORRO pagination with `nzTotal` and `nzPageIndex` — pass `total` from `meta.total` and `current_page` from `meta.current_page`.
- **Image uploads**: For vendor/product image management (dashboard), add a `POST /api/dashboard/upload` endpoint using Laravel's `Storage::disk('public')`. Return the public URL.
- **Rate limiting**: Apply `throttle:10,1` to OTP request endpoint to prevent brute force.
- **Sanctum token expiry**: Set `sanctum.expiration` in config to `10080` (7 days) or use short-lived tokens and refresh via `/auth/me`.
- **Search full-text**: For production, consider adding MySQL FULLTEXT indexes on `products(name, description)` and `blog_posts(title, excerpt)` instead of LIKE queries.
- **Bengali content**: All `name_bn` fields and Bengali text in the database use UTF-8. Ensure `DB_CHARSET=utf8mb4` and `DB_COLLATION=utf8mb4_unicode_ci` in `.env`.
