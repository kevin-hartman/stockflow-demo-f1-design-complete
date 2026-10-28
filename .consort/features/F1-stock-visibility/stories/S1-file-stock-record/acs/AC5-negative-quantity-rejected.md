# AC5-negative-quantity-rejected

- **Given** the operator is filing a stock record
- **When** they submit a quantity below zero
- **Then** a clear message naming the quantity field is shown and no record is created or changed, so stock never goes below zero
