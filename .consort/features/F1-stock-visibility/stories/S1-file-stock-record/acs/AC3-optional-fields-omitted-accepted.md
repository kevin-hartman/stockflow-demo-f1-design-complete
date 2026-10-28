# AC3-optional-fields-omitted-accepted

- **Given** the operator is filing a stock record
- **When** they submit it with par level, batch, and serial left blank
- **Then** the record is accepted and stored with those fields absent (not tracked), not rejected and not stored as empty strings or zero
