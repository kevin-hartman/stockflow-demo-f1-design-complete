# AC2-adjust-below-zero-rejected

- **Given** a stock record with quantity Q is shown as a row
- **When** the operator submits an adjustment that would leave the quantity below zero
- **Then** a clear message naming the quantity field is shown, the stored quantity stays Q, and the row goes back to showing Q (R2)
