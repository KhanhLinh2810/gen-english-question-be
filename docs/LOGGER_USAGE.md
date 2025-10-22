# Logger Class Documentation

## Overview

The Logger class provides a comprehensive logging solution for the insurance platform backend with structured logging, context support, and specialized logging methods for different types of events.

## Features

- **Structured Logging**: Support for context objects with type safety
- **Multiple Log Levels**: ERROR, WARN, INFO, DEBUG, VERBOSE
- **Scoped Logging**: Create logger instances with specific scopes
- **Sensitive Data Sanitization**: Automatically redacts sensitive information
- **Specialized Methods**: Dedicated methods for API, database, payment, and security logging
- **File Rotation**: Automatic log file rotation with compression
- **Performance Monitoring**: Built-in performance logging capabilities

## Basic Usage

### Import and Create Logger

```typescript
import Logger, { LogLevel, LogContext } from '../utility/logger.util';

// Use default logger
const logger = Logger;

// Create scoped logger
const paymentLogger = new Logger({ scope: 'PaymentService' });

// Create logger with custom config
const debugLogger = new Logger({
  scope: 'DebugService',
  logLevel: LogLevel.DEBUG,
  enableConsole: true,
  enableFile: false
});
```

### Basic Logging Methods

```typescript
// Basic logging
logger.info('User logged in successfully');
logger.warn('Database connection slow');
logger.error('Payment processing failed');
logger.debug('Processing request data');

// With context
const context: LogContext = {
  userId: 123,
  requestId: 'req-456',
  method: 'POST',
  path: '/api/payments'
};

logger.info('Payment processed', context);
```

## Specialized Logging Methods

### API Logging

```typescript
// Log API requests
logger.request('POST', '/api/payments', {
  userId: 123,
  ip: '192.168.1.1'
});

// Log API responses
logger.response('POST', '/api/payments', 200, 150, {
  userId: 123,
  requestId: 'req-456'
});
```

### Database Logging

```typescript
// Log database queries
logger.query('SELECT * FROM customers WHERE id = ?', 45, {
  userId: 123,
  table: 'customers'
});
```

### Payment Logging

```typescript
// Log payment operations
logger.payment('created', 5000, 'JPY', {
  contractId: 789,
  customerId: 123,
  paymentMethod: 'credit_card'
});

logger.payment('cancelled', 5000, 'JPY', {
  contractId: 789,
  reason: 'customer_request'
});
```

### Webhook Logging

```typescript
// Log webhook events
logger.webhook('payment.authorized', 'gc-payment', {
  paymentId: 'pay_123',
  amount: 5000,
  customerId: 'customer_456'
});
```

### User Action Logging

```typescript
// Log user actions
logger.userAction('contract_cancelled', 123, {
  contractId: 789,
  reason: 'customer_request',
  ip: '192.168.1.1'
});
```

### Security Logging

```typescript
// Log security events
logger.security('failed_login', 'medium', {
  userId: 123,
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
});

logger.security('suspicious_activity', 'high', {
  userId: 123,
  activity: 'multiple_failed_payments',
  ip: '192.168.1.1'
});
```

### Performance Logging

```typescript
// Log performance metrics
logger.performance('database_query', 250, {
  table: 'customers',
  operation: 'SELECT'
});

logger.performance('payment_processing', 1200, {
  paymentMethod: 'credit_card',
  amount: 5000
});
```

### Business Event Logging

```typescript
// Log business events
logger.business('contract_created', 'CustomerContract', 789, {
  customerId: 123,
  planId: 456,
  amount: 5000
});

logger.business('payment_completed', 'PaymentTransaction', 101, {
  contractId: 789,
  amount: 5000,
  paymentMethod: 'credit_card'
});
```

## Method Entry/Exit Logging

```typescript
class PaymentService {
  private logger = new Logger({ scope: 'PaymentService' });

  async processPayment(contract: CustomerContract) {
    this.logger.enter('processPayment', { contractId: contract.id });
    
    try {
      // Payment processing logic
      const result = await this.createPayment(contract);
      
      this.logger.exit('processPayment', { success: true, paymentId: result.id });
      return result;
    } catch (error) {
      this.logger.exit('processPayment', { success: false, error: error.message });
      throw error;
    }
  }
}
```

## Context Interface

```typescript
interface LogContext {
  [key: string]: any;
  userId?: string | number;
  requestId?: string;
  sessionId?: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  statusCode?: number;
  errorCode?: string;
  stack?: string;
}
```

## Configuration Options

```typescript
interface LoggerConfig {
  scope?: string;           // Logger scope/name
  enableConsole?: boolean;  // Enable console logging
  enableFile?: boolean;     // Enable file logging
  logLevel?: LogLevel;      // Minimum log level
  maxFiles?: string;        // Max log files to keep
  maxSize?: string;         // Max log file size
}
```

## Log Levels

```typescript
enum LogLevel {
  ERROR = 'error',    // Errors that need immediate attention
  WARN = 'warn',      // Warnings that should be investigated
  INFO = 'info',      // General information
  DEBUG = 'debug',    // Debug information for development
  VERBOSE = 'verbose' // Very detailed debug information
}
```

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// ERROR: System failures, exceptions
logger.error('Database connection failed', { error: error.message });

// WARN: Issues that need attention but don't break functionality
logger.warn('Payment gateway response slow', { duration: 5000 });

// INFO: Important business events
logger.info('Customer contract created', { contractId: 123, customerId: 456 });

// DEBUG: Detailed information for troubleshooting
logger.debug('Processing payment request', { requestData: sanitizedData });

// VERBOSE: Very detailed information
logger.verbose('SQL query executed', { sql: query, params: params });
```

### 2. Include Relevant Context

```typescript
// Good: Include relevant context
logger.info('Payment processed', {
  paymentId: payment.id,
  amount: payment.amount,
  customerId: payment.customerId,
  method: payment.method
});

// Bad: Missing context
logger.info('Payment processed');
```

### 3. Sanitize Sensitive Data

```typescript
// The logger automatically sanitizes sensitive fields
logger.info('User login', {
  userId: 123,
  email: 'user@example.com',
  password: 'secret123',  // Will be redacted automatically
  token: 'jwt-token'      // Will be redacted automatically
});
```

### 4. Use Scoped Loggers

```typescript
// Create service-specific loggers
class PaymentService {
  private logger = new Logger({ scope: 'PaymentService' });
  
  async processPayment() {
    this.logger.info('Processing payment');
  }
}

class CustomerService {
  private logger = new Logger({ scope: 'CustomerService' });
  
  async createCustomer() {
    this.logger.info('Creating customer');
  }
}
```

### 5. Log Performance Metrics

```typescript
async function processPayment() {
  const startTime = Date.now();
  
  try {
    // Payment processing logic
    const result = await paymentGateway.process();
    
    const duration = Date.now() - startTime;
    logger.performance('payment_processing', duration, {
      paymentId: result.id,
      amount: result.amount
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.performance('payment_processing', duration, {
      error: error.message
    });
    throw error;
  }
}
```

## Migration from Old Logger

### Old Usage
```typescript
import logger from '../utility/logger.util';

logger.info('Message', 'label', additionalData);
```

### New Usage
```typescript
import logger from '../utility/logger.util';

logger.info('Message', {
  label: 'label',
  ...additionalData
});
```

## Log File Structure

Logs are stored in the `logs/` directory with the following structure:

```
logs/
├── error.2024-01-15.log    # Error level logs
├── combined.2024-01-15.log # All logs (INFO and above)
├── error.2024-01-16.log
├── combined.2024-01-16.log
└── ...
```

## Environment Configuration

The logger respects the `env.app.debugLog` setting to control console output:

```typescript
// In env.ts
export default {
  app: {
    debugLog: process.env.NODE_ENV === 'development'
  }
}
```

## Testing

```typescript
// Create a test logger that only logs to console
const testLogger = new Logger({
  scope: 'TestService',
  enableFile: false,
  enableConsole: true,
  logLevel: LogLevel.DEBUG
});

testLogger.info('Test message', { testId: 123 });
``` 