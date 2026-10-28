# AC2-refile-same-pair-updates-in-place

- **Given** a stock record already exists for a (sku, location) pair
- **When** the operator files a record for the same (sku, location) again with a new quantity or tracking code
- **Then** the existing record is updated in place with the new values, exactly one record for that pair exists, no duplicate is created, and no error page is shown
