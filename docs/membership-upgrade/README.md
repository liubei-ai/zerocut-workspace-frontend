# Membership upgrade dialog previews

These screenshots mount the actual `MembershipUpgradeDialog.vue` with sanitized fixtures. They contain no live order or account identifiers. The QR code uses `https://example.invalid/non-payable-preview` and cannot create a payment.

- `confirm.jpg`: desktop confirmation, expanded credit expiry details and consent selected.
- `payment.jpg`: desktop Native payment presentation.
- `completed.jpg`: desktop completion receipt.
- `mobile-dark.jpg`: completion receipt at 390 × 844 in the dark theme.

Verified confirmation and payment at 390 px with no horizontal overflow, desktop layout at 1280 px, and confirmation checkbox/expiry disclosure interaction. Existing upgrade component/store/API tests cover the payment and recovery behavior.
