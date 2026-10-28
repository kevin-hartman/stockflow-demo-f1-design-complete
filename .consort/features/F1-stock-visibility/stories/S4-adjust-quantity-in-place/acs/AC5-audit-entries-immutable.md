# AC5-audit-entries-immutable

- **Given** an adjustment history entry exists for a stock record
- **When** any attempt is made to edit or delete that entry
- **Then** the attempt is refused, and the entry's timestamp, actor, and quantities stay exactly as recorded
