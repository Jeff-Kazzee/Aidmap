# Update After Migration

After applying all migrations to Supabase, update the following file:

## File: src/components/CloseRequestModal.tsx

Find this section around line 33-41:
```typescript
// Temporarily just update status until migration is applied
const updateData: any = {
  status: 'completed'
}

// Once migration is applied, uncomment these:
// fulfillment_status: fulfillmentStatus,
// closed_at: new Date().toISOString(),
// closure_notes: closureNotes.trim() || null
```

Replace with:
```typescript
const updateData: any = {
  fulfillment_status: fulfillmentStatus,
  closed_at: new Date().toISOString(),
  closure_notes: closureNotes.trim() || null
}
```

This will enable the full closure functionality with fulfilled/unfulfilled status tracking.