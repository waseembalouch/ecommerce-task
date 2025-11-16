# Testing Documentation

## Overview
This document describes the comprehensive testing strategy for the e-commerce application, including unit tests, integration tests, component tests, and end-to-end tests.

## Testing Stack

### Backend Testing (Node.js)
- **Framework**: Jest
- **HTTP Testing**: Supertest
- **Mocking**: Jest mocks
- **Coverage**: Istanbul/NYC via Jest

### Frontend Testing (React)
- **Framework**: Vitest
- **Component Testing**: React Testing Library
- **User Interactions**: @testing-library/user-event
- **DOM Assertions**: @testing-library/jest-dom
- **Coverage**: Vitest coverage (v8)

### End-to-End Testing
- **Framework**: Playwright
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile Testing**: Pixel 5, iPhone 12 emulation

## Test Structure

```
project-root/
├── backend-nodejs/
│   ├── jest.config.js
│   └── tests/
│       ├── setup.ts
│       ├── unit/
│       │   └── services/
│       │       ├── auth.service.test.ts
│       │       └── product.service.test.ts
│       └── integration/
│           ├── auth.test.ts
│           └── product.test.ts
│
├── frontend-react/
│   ├── vitest.config.ts
│   └── src/
│       ├── test/
│       │   ├── setup.ts
│       │   └── utils.tsx
│       └── __tests__/
│           ├── components/
│           │   ├── ProductCard.test.tsx
│           │   └── Pagination.test.tsx
│           └── pages/
│
└── tests/
    └── e2e/
        ├── playwright.config.ts
        ├── package.json
        ├── specs/
        │   └── auth.spec.ts
        └── fixtures/
```

## Running Tests

### Backend Tests

#### Run all tests
```bash
cd backend-nodejs
npm test
```

#### Run tests in watch mode
```bash
npm run test:watch
```

#### Run with coverage
```bash
npm test -- --coverage
```

#### Run specific test file
```bash
npm test -- auth.service.test.ts
```

### Frontend Tests

#### Run all tests
```bash
cd frontend-react
npm test
```

#### Run with UI
```bash
npm run test:ui
```

#### Run with coverage
```bash
npm run test:coverage
```

#### Run specific test
```bash
npm test -- ProductCard
```

### End-to-End Tests

#### Run all E2E tests
```bash
cd tests/e2e
npm test
```

#### Run tests in specific browser
```bash
npm test -- --project=chromium
```

#### Run with UI mode
```bash
npx playwright test --ui
```

#### Run specific test file
```bash
npm test -- auth.spec.ts
```

#### View test report
```bash
npx playwright show-report
```

## Test Coverage Requirements

### Backend
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

### Frontend
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

## Backend Testing Details

### Unit Tests

Unit tests focus on testing individual functions and services in isolation.

**Example: Auth Service Test**
```typescript
describe('Auth Service', () => {
  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Mock dependencies
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      // Execute
      const result = await authService.register(validData);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
    });
  });
});
```

**Key Files:**
- `tests/unit/services/auth.service.test.ts` - Authentication logic tests
- `tests/unit/services/product.service.test.ts` - Product CRUD tests

### Integration Tests

Integration tests verify API endpoints work correctly with all middlewares and dependencies.

**Example: Product API Test**
```typescript
describe('Product API', () => {
  it('should return paginated products', async () => {
    const response = await request(app)
      .get('/api/products?page=1&limit=20')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.meta.page).toBe(1);
  });
});
```

**Key Files:**
- `tests/integration/auth.test.ts` - Authentication endpoints
- `tests/integration/product.test.ts` - Product endpoints

## Frontend Testing Details

### Component Tests

Component tests verify individual React components render correctly and handle user interactions.

**Example: ProductCard Test**
```typescript
describe('ProductCard', () => {
  it('should render product information correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('should call addToCart when button is clicked', async () => {
    const user = userEvent.setup();
    render(<ProductCard product={mockProduct} />);

    const button = screen.getByRole('button', { name: /add to cart/i });
    await user.click(button);

    expect(cartService.addToCart).toHaveBeenCalled();
  });
});
```

**Key Files:**
- `src/__tests__/components/ProductCard.test.tsx` - Product card component
- `src/__tests__/components/Pagination.test.tsx` - Pagination component

### Testing Utilities

**Custom Render Function:**
```typescript
// Wraps component with all necessary providers
const AllTheProviders = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={theme}>
      <BrowserRouter>{children}</BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export const render = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });
```

## End-to-End Testing Details

### Test Scenarios

#### Authentication Flow
- User registration with validation
- User login with credentials
- Logout functionality
- Invalid credentials handling
- Session persistence

#### Product Browsing
- View product list
- Search products
- Filter by category
- Filter by price range
- Pagination navigation

#### Shopping Cart
- Add products to cart
- Update quantities
- Remove items
- View cart summary
- Cart persistence

#### Checkout Process
- Fill shipping information
- Place order
- View order confirmation
- Check order history

### Example E2E Test
```typescript
test('should complete purchase flow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'Password123!');
  await page.click('button:has-text("Login")');

  // Browse products
  await page.goto('/products');
  await page.click('.product-card:first-child button:has-text("Add to Cart")');

  // Checkout
  await page.goto('/cart');
  await page.click('button:has-text("Proceed to Checkout")');

  // Fill shipping info
  await page.fill('[name="address"]', '123 Main St');
  await page.fill('[name="city"]', 'New York');
  await page.click('button:has-text("Place Order")');

  // Verify success
  await expect(page).toHaveURL(/\/orders\//);
});
```

## Mocking Strategy

### Backend Mocks
- **Database (Prisma)**: Mocked in `tests/setup.ts`
- **Redis**: Mocked in `tests/setup.ts`
- **External APIs**: Mocked per test

### Frontend Mocks
- **API calls**: Mocked using Vitest mocks
- **React Query**: Test query client with disabled caching
- **Zustand stores**: Mocked per test
- **Window APIs**: Mocked in `test/setup.ts`

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd backend-nodejs && npm ci
      - run: cd backend-nodejs && npm test -- --coverage
      - uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd frontend-react && npm ci
      - run: cd frontend-react && npm run test:coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd tests/e2e && npm ci
      - run: npx playwright install --with-deps
      - run: cd tests/e2e && npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: tests/e2e/playwright-report/
```

## Best Practices

### General
1. **Write tests first** - Follow TDD when possible
2. **Test behavior, not implementation** - Focus on user-facing functionality
3. **Keep tests isolated** - Each test should be independent
4. **Use descriptive names** - Test names should explain what they verify
5. **Mock external dependencies** - Keep tests fast and reliable

### Backend
1. **Mock database calls** - Use Jest mocks for Prisma
2. **Test error cases** - Verify error handling and validation
3. **Use factories** - Create test data with factory functions
4. **Test middleware** - Verify authentication and authorization

### Frontend
1. **Query by accessibility** - Use role, label, and text queries
2. **Avoid implementation details** - Don't test component internals
3. **Test user interactions** - Use userEvent for realistic interactions
4. **Handle async** - Use waitFor for async updates

### E2E
1. **Test critical paths** - Focus on main user journeys
2. **Use page objects** - Organize selectors and actions
3. **Handle flakiness** - Use proper waits and retries
4. **Test across browsers** - Verify cross-browser compatibility

## Debugging Tests

### Backend
```bash
# Run single test with debugging
node --inspect-brk node_modules/.bin/jest auth.service.test.ts

# Use console.log
console.log('Debug value:', variable);
```

### Frontend
```bash
# Run with browser devtools
npm test -- --inspect

# Use debug from @testing-library/react
import { debug } from '@testing-library/react';
debug(); // Prints DOM tree
```

### E2E
```bash
# Run in headed mode
npx playwright test --headed

# Enable debug mode
npx playwright test --debug

# View trace
npx playwright show-trace trace.zip
```

## Coverage Reports

### Backend
Coverage reports are generated in `backend-nodejs/coverage/`:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/coverage-final.json` - JSON data

### Frontend
Coverage reports are generated in `frontend-react/coverage/`:
- `coverage/index.html` - HTML report
- `coverage/coverage-final.json` - JSON data

### Viewing Coverage
```bash
# Backend
cd backend-nodejs && npm test -- --coverage
open coverage/lcov-report/index.html

# Frontend
cd frontend-react && npm run test:coverage
open coverage/index.html
```

## Test Data Management

### Fixtures
Store test data in fixture files for reuse:

```typescript
// fixtures/products.ts
export const mockProduct = {
  id: 'product-1',
  name: 'Test Product',
  price: 99.99,
  // ...
};
```

### Factories
Use factories for dynamic test data:

```typescript
export const createMockProduct = (overrides = {}) => ({
  id: `product-${Date.now()}`,
  name: 'Test Product',
  price: 99.99,
  ...overrides,
});
```

## Troubleshooting

### Common Issues

**Jest timeout errors**
```bash
# Increase timeout in jest.config.js
testTimeout: 10000
```

**Vitest module not found**
```bash
# Add to vitest.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

**Playwright flaky tests**
```bash
# Add proper waits
await page.waitForSelector('.element');
await page.waitForLoadState('networkidle');
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Last Updated**: 2025-11-16
**Maintained By**: Development Team
