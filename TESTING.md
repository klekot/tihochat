# TihoChat Testing Guide

## Overview
This project includes a comprehensive testing suite with unit tests, integration tests, and test coverage reporting. The testing environment is set up using Jest as the primary testing framework.

## Test Structure

```
tests/
├── setup.js                 # Global test setup and mocks
├── fixtures/
│   └── mockData.js          # Test data and fixtures
├── unit/                    # Unit tests for individual modules
│   ├── database.test.js     # Database service tests
│   ├── auth.test.js         # Authentication middleware tests
│   └── fileUtils.test.js    # File utility tests
└── integration/             # Integration tests
    ├── auth.test.js         # Authentication route tests
    └── socket.test.js       # Socket.IO functionality tests
```

## Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for CI/CD (no watch mode)
npm run test:ci
```

### Coverage Reports
Coverage reports are generated in multiple formats:
- **HTML**: `coverage/lcov-report/index.html` - Interactive HTML report
- **LCOV**: `coverage/lcov.info` - For CI/CD integration
- **JSON**: `coverage/coverage-final.json` - Machine-readable format
- **Text**: Console output during test runs

## Test Categories

### 1. Unit Tests
Test individual modules in isolation with mocked dependencies:

#### Database Service (`tests/unit/database.test.js`)
- Connection management
- Query execution
- User operations (CRUD)
- Invite operations
- Error handling

#### Authentication Middleware (`tests/unit/auth.test.js`)
- Session authentication
- Error handling
- Input validation and sanitization

#### File Utilities (`tests/unit/fileUtils.test.js`)
- File upload handling
- Avatar URL generation
- Session user creation

### 2. Integration Tests
Test complete workflows with real HTTP requests:

#### Authentication Routes (`tests/integration/auth.test.js`)
- Login flow
- Registration flow
- Logout functionality
- Error scenarios

#### Socket.IO Service (`tests/integration/socket.test.js`)
- Room joining
- Message broadcasting
- User connection handling
- Error scenarios

## Test Configuration

### Jest Configuration (`jest.config.js`)
- **Test Environment**: Node.js
- **Coverage Threshold**: 80% for all metrics
- **Test Timeout**: 10 seconds
- **Setup File**: `tests/setup.js`

### Coverage Thresholds
The project enforces minimum coverage thresholds:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Mocking Strategy

### External Dependencies
- **Config**: Mocked with test values
- **MySQL**: Mocked connection and queries
- **File System**: Mocked file operations
- **Express Session**: Mocked session store

### Test Fixtures
Reusable test data in `tests/fixtures/mockData.js`:
- Mock user data
- Mock invite data
- Mock session data

## Writing New Tests

### Unit Test Example
```javascript
describe('Module Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should do something specific', () => {
    // Test implementation
  });
});
```

### Integration Test Example
```javascript
describe('API Endpoint', () => {
  it('should handle request correctly', async () => {
    const response = await request(app)
      .post('/endpoint')
      .send({ data: 'test' })
      .expect(200);
    
    expect(response.body).toEqual(expectedResult);
  });
});
```

## Best Practices

### 1. Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Mocking
- Mock external dependencies
- Use consistent mock data
- Reset mocks between tests

### 3. Coverage
- Aim for high test coverage
- Focus on critical business logic
- Test error scenarios

### 4. Performance
- Keep tests fast and isolated
- Use appropriate timeouts
- Clean up resources

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
```

## Troubleshooting

### Common Issues
1. **Timeout Errors**: Increase timeout in Jest config
2. **Mock Issues**: Ensure mocks are reset between tests
3. **Coverage Issues**: Check file patterns in Jest config

### Debug Mode
```bash
# Run specific test file
npm test -- tests/unit/database.test.js

# Run tests with verbose output
npm test -- --verbose

# Run tests matching pattern
npm test -- --testNamePattern="should login"
```

## Test Data Management

### Database Testing
- Use in-memory databases for testing
- Mock database connections
- Use transactions for cleanup

### File Testing
- Use temporary directories
- Mock file system operations
- Clean up test files

## Coverage Reports

### Viewing Coverage
1. Run `npm run test:coverage`
2. Open `coverage/lcov-report/index.html` in browser
3. Navigate through files to see coverage details

### Coverage Goals
- **Critical Paths**: 100% coverage
- **Business Logic**: 95%+ coverage
- **Utilities**: 90%+ coverage
- **Overall**: 80%+ coverage

This testing setup ensures code quality, prevents regressions, and provides confidence when making changes to the TihoChat application.
