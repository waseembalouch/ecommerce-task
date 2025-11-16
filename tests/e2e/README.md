# E2E Tests with Playwright

This directory contains end-to-end tests for the e-commerce application using Playwright.

## Setup

```bash
cd tests/e2e
npm install
```

## Running Tests

```bash
# Run tests
node test-app.mjs

# Or with npm if you add a script to package.json
npm test
```

## Test Coverage

The test suite verifies:
- Homepage loading
- Product browsing and pagination
- Product detail pages
- Login functionality
- Admin dashboard access
- Admin products management
- Admin orders management
- Authentication and authorization flows

## Files

- `test-app.mjs` - Main test suite
- `package.json` - Playwright dependencies
- `node_modules/` - Dependencies (ignored by git)
