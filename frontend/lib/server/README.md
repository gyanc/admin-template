# Server-Side Utilities

This directory contains server-only utilities for Next.js server components.

## Files

### `fetch-data.ts`
Server-side data fetching utilities that:
- Automatically include authentication tokens from cookies
- Support Next.js caching strategies (`revalidate`, `tags`)
- Provide type-safe pagination helpers
- Handle errors gracefully

**Usage:**
```tsx
import { fetchPaginatedData } from '@/lib/server/fetch-data';

// In a server component
const users = await fetchPaginatedData<User>('users', {
  page: 1,
  limit: 20,
  search: 'john',
});
```

### `cache-utils.ts`
Cache management utilities for Next.js:
- `invalidateResource()` - Invalidate cache for a specific resource
- `invalidateResources()` - Invalidate multiple resources
- `CACHE_TAGS` - Predefined cache tags
- `getCacheTag()` - Helper to generate cache tags

**Usage:**
```tsx
import { invalidateResource } from '@/lib/server/cache-utils';

// After creating/updating a user
await invalidateResource('users', userId);
```

## Architecture

### Server Components → Backend API (Direct)
Server components call the backend API directly for optimal performance:
- No extra network hop
- Better performance
- Direct control over caching

### Client Components → BFF Routes → Backend API
Client components use BFF routes (`app/api/*`) for:
- Security (no direct backend exposure)
- Consistent error handling
- Cookie-based authentication

## Best Practices

1. **Always use server utilities in server components**
   - Don't use client-side API clients in server components
   - Use `fetchPaginatedData` for list endpoints
   - Use `fetchResourceById` for single resource endpoints

2. **Cache invalidation**
   - Invalidate cache after mutations
   - Use cache tags for granular control
   - Revalidate paths when needed

3. **Error handling**
   - Server utilities throw errors with status codes
   - Use try-catch in server components
   - Provide fallback UI when needed
