# Subscriptions Tracker — Implementation Plan

## Overview

A standalone tab in the app to track recurring bills and subscriptions (Netflix, AWS, Spotify, etc.). Completely separate from the task system. Shows total monthly and yearly spend, upcoming renewals, and a category breakdown.

---

## Data Model

### `Subscription` (MongoDB)

```ts
interface ISubscription {
  _id: string
  userId: string              // owner (from JWT)

  name: string                // "Netflix", "AWS", "Gym"
  amount: number              // cost per billing cycle
  currency: string            // "USD" | "INR" | "EUR" — default "USD"
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  nextBillingDate: Date       // when it next renews
  category: string            // "Streaming" | "Dev Tools" | "Health" | "Other" etc.
  color: string               // hex, for card accent + pie chart
  url?: string                // service URL (optional)
  notes?: string              // free text

  isActive: boolean           // soft toggle — paused subs stay visible but excluded from totals
  createdAt: Date
  updatedAt: Date
}
```

### Derived / computed (frontend, no DB aggregation needed)

- **Monthly cost** — normalise `amount` to monthly:
  - weekly → `amount × 4.33`
  - monthly → `amount`
  - quarterly → `amount / 3`
  - yearly → `amount / 12`
- **Yearly cost** — monthly × 12
- **Due this month** — `nextBillingDate` falls within current calendar month

---

## API Endpoints

All routes behind `requireAuth`. Base: `/api/subscriptions`.

| Method | Path | Description |
|---|---|---|
| GET | `/` | All subscriptions for the user |
| POST | `/` | Create subscription |
| PATCH | `/:id` | Update subscription |
| DELETE | `/:id` | Hard delete (no soft-delete needed here) |
| PATCH | `/:id/toggle` | Toggle `isActive` |

Response envelope: `{ success, data, count? }` — same shape as the rest of the API.

### Zod validation schema

```ts
const subscriptionSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  currency: z.enum(['USD', 'INR', 'EUR', 'GBP']).default('USD'),
  billingCycle: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  nextBillingDate: z.string().datetime(),
  category: z.string().max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  url: z.string().url().optional(),
  notes: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});
```

---

## Frontend Architecture

### New files

```
client/src/
  pages/SubscriptionsPage.tsx       # main page
  components/SubscriptionCard.tsx   # single card
  components/SubscriptionForm.tsx   # create / edit form (modal)
  hooks/useSubscriptions.ts         # data fetching + mutations
  services/subscriptionApi.ts       # Axios calls to /api/subscriptions
  types/subscription.ts             # TS interfaces
```

### Sidebar entry

Add between "Tags" and "Archive" in `Sidebar.tsx`:

```tsx
{ path: '/subscriptions', label: 'Subscriptions', icon: <CreditCardIcon /> }
```

### Route in `App.tsx`

```tsx
<Route path="/subscriptions" element={<SubscriptionsPage />} />
```

---

## `SubscriptionsPage` Layout

```
┌─────────────────────────────────────────────────┐
│  Subscriptions          [+ Add Subscription]     │
│  3 active · $142.50 / mo · $1,710 / yr          │
├────────────────┬────────────────┬────────────────┤
│ Monthly spend  │ Yearly spend   │ Due this month │
│   $142.50      │   $1,710       │   3 renewals   │
├─────────────────────────────────────────────────┤
│  [All] [Active] [Paused]   [Sort ▾]  [Category▾]│
├──────────────────────────────────┬──────────────┤
│  Subscription cards (grid)       │  Pie chart   │
│                                  │  by category │
└──────────────────────────────────┴──────────────┘
```

### `SubscriptionCard`

Each card shows:
- Colour accent (left border or top strip)
- Name + category badge
- Amount + billing cycle (e.g. `$14.99 / mo`)
- Next renewal date + relative time (`in 12 days`)
- "Paused" overlay if `isActive = false`
- Hover actions: Edit · Toggle · Delete

### Summary bar (top 3 stat cards)

| Card | Value |
|---|---|
| Monthly Spend | Sum of active subs normalised to monthly |
| Yearly Spend | Monthly × 12 |
| Due This Month | Count of active subs renewing this calendar month |

---

## `SubscriptionForm` (modal)

Fields:
- Name (text)
- Amount (number) + Currency (select: USD / INR / EUR / GBP)
- Billing cycle (select)
- Next billing date (date picker)
- Category (text with suggestions: Streaming, Dev Tools, Health, Utilities, SaaS, Other)
- Color (color picker — 8 preset swatches)
- URL (optional)
- Notes (optional textarea)
- Active toggle

---

## Currency Handling

Store amounts in the user's chosen currency as-is. No conversion — display the currency symbol next to the amount. Totals only include subscriptions with the same currency. If mixed currencies exist, show separate totals per currency.

For v1, assume single-currency usage and show a warning if mixed currencies are detected.

---

## `useSubscriptions` hook

```ts
const useSubscriptions = () => {
  // state: subscriptions[], loading, error, filter, sortBy, activeCategory
  // mutations: addSubscription, updateSubscription, deleteSubscription, toggleActive
  // computed: monthlyCost, yearlyCost, dueThisMonth, byCategory
}
```

`monthlyCost` and `yearlyCost` computed client-side — no backend aggregation endpoint needed.

---

## Files to Create / Touch

### Server
| File | Action |
|---|---|
| `server/src/models/Subscription.ts` | new Mongoose model |
| `server/src/types/subscription.ts` | Zod schema + ISubscription interface |
| `server/src/controllers/subscriptionController.ts` | CRUD + toggle |
| `server/src/routes/subscriptionRoutes.ts` | new routes |
| `server/src/index.ts` | register `/api/subscriptions` |

### Client
| File | Action |
|---|---|
| `client/src/types/subscription.ts` | TS interfaces |
| `client/src/services/subscriptionApi.ts` | Axios service |
| `client/src/hooks/useSubscriptions.ts` | data hook |
| `client/src/pages/SubscriptionsPage.tsx` | page |
| `client/src/components/SubscriptionCard.tsx` | card |
| `client/src/components/SubscriptionForm.tsx` | form modal |
| `client/src/components/Sidebar.tsx` | add nav entry |
| `client/src/App.tsx` | add route |

---

## Out of Scope (v1)

- Push/email reminders before renewal date
- Multi-currency conversion (exchange rates)
- Recurring task auto-creation from a subscription
- Shared subscriptions (split cost)
- Import from bank CSV
