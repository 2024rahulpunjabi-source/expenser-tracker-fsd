import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Expense Tracker Pro — REST API Documentation',
    version: '1.0.0',
    description:
      'Production REST API with JWT Authentication, Role-Based Access Control, MongoDB Mongoose Models, Real-time WebSockets, and Aggregation Analytics.',
    contact: {
      name: 'Full Stack Development Project',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
  ],
  tags: [
    { name: 'Health', description: 'System health check' },
    { name: 'Auth', description: 'User registration, login, profile, and JWT authentication' },
    { name: 'Expenses', description: 'CRUD operations, filtering, pagination, and analytics for transactions' },
    { name: 'Budgets', description: 'Category monthly budget limits and threshold tracking' },
    { name: 'Categories', description: 'System and user custom category management' },
    { name: 'Admin', description: 'Role-Based Access Control (RBAC) and platform management' },
    { name: 'Chat', description: 'Real-time WebSocket chat and discussion history' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from /api/auth/login',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6732389148d88...' },
          name: { type: 'string', example: 'Rahul Punjabi' },
          email: { type: 'string', example: 'user@example.com' },
          role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
          currency: { type: 'string', example: 'INR' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Expense: {
        type: 'object',
        required: ['title', 'amount', 'category'],
        properties: {
          _id: { type: 'string', example: '6732389148d99...' },
          title: { type: 'string', example: 'Grocery Supermarket' },
          amount: { type: 'number', example: 1250 },
          type: { type: 'string', enum: ['EXPENSE', 'INCOME'], example: 'EXPENSE' },
          category: { type: 'string', example: 'Food & Dining' },
          paymentMethod: {
            type: 'string',
            enum: ['UPI', 'CARD', 'CASH', 'NET_BANKING', 'OTHER'],
            example: 'UPI',
          },
          date: { type: 'string', format: 'date-time' },
          notes: { type: 'string', example: 'Weekly fruits, vegetables, and milk' },
        },
      },
      Budget: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          category: { type: 'string', example: 'Food & Dining' },
          limit: { type: 'number', example: 8000 },
          month: { type: 'number', example: 11 },
          year: { type: 'number', example: 2026 },
          alertThreshold: { type: 'number', example: 80 },
        },
      },
      Category: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'Dining Out' },
          type: { type: 'string', enum: ['EXPENSE', 'INCOME'], example: 'EXPENSE' },
          color: { type: 'string', example: '#f43f5e' },
          icon: { type: 'string', example: 'Utensils' },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API server health status',
        security: [],
        responses: {
          200: { description: 'Server is healthy' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user account',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Rahul Punjabi' },
                  email: { type: 'string', example: 'user@example.com' },
                  password: { type: 'string', example: 'User@123' },
                  role: { type: 'string', enum: ['user', 'admin'], default: 'user' },
                  currency: { type: 'string', default: 'INR' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered successfully and token returned' },
          400: { description: 'Validation error or duplicate email' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in with email and password to receive JWT',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'user@example.com' },
                  password: { type: 'string', example: 'User@123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful with JWT Bearer token' },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/api/auth/profile': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile (JWT protected)',
        responses: {
          200: { description: 'Profile details returned' },
          401: { description: 'Unauthorized — missing or invalid token' },
        },
      },
      put: {
        tags: ['Auth'],
        summary: 'Update current user profile',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  currency: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile updated' },
        },
      },
    },
    '/api/expenses': {
      get: {
        tags: ['Expenses'],
        summary: 'Get all transactions with search, filters, and pagination (CRUD: Read)',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search title or notes' },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['ALL', 'EXPENSE', 'INCOME'] }, description: 'Transaction type' },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Category filter' },
          { name: 'paymentMethod', in: 'query', schema: { type: 'string', enum: ['ALL', 'UPI', 'CARD', 'CASH', 'NET_BANKING'] } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'date' } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
        ],
        responses: {
          200: { description: 'List of transactions with pagination metadata' },
        },
      },
      post: {
        tags: ['Expenses'],
        summary: 'Create a new transaction (CRUD: Create)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'amount', 'category'],
                properties: {
                  title: { type: 'string', example: 'Coffee and snacks' },
                  amount: { type: 'number', example: 180 },
                  type: { type: 'string', enum: ['EXPENSE', 'INCOME'], default: 'EXPENSE' },
                  category: { type: 'string', example: 'Food & Dining' },
                  paymentMethod: { type: 'string', enum: ['UPI', 'CARD', 'CASH', 'NET_BANKING', 'OTHER'], default: 'UPI' },
                  date: { type: 'string', format: 'date-time' },
                  notes: { type: 'string', example: 'Evening break' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Transaction created and broadcast via WebSocket' },
          400: { description: 'Validation failed' },
        },
      },
    },
    '/api/expenses/stats/summary': {
      get: {
        tags: ['Expenses'],
        summary: 'Get aggregated financial analytics (Income, Expense, Net Savings, Trends)',
        responses: {
          200: { description: 'Aggregated analytics payload' },
        },
      },
    },
    '/api/expenses/bulk': {
      post: {
        tags: ['Expenses'],
        summary: 'Bulk import transactions from JSON array',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Expense' },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Items imported successfully' },
        },
      },
    },
    '/api/expenses/{id}': {
      get: {
        tags: ['Expenses'],
        summary: 'Get single transaction by ID (CRUD: Read)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Transaction object' },
          404: { description: 'Transaction not found' },
        },
      },
      put: {
        tags: ['Expenses'],
        summary: 'Update an existing transaction (CRUD: Update)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  amount: { type: 'number' },
                  category: { type: 'string' },
                  paymentMethod: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Transaction updated successfully' },
          404: { description: 'Transaction not found' },
        },
      },
      delete: {
        tags: ['Expenses'],
        summary: 'Delete a transaction (CRUD: Delete)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Transaction deleted successfully' },
          404: { description: 'Transaction not found' },
        },
      },
    },
    '/api/budgets': {
      get: {
        tags: ['Budgets'],
        summary: 'Get category monthly budgets with actual spending and alert threshold status',
        parameters: [
          { name: 'month', in: 'query', schema: { type: 'integer' } },
          { name: 'year', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Budget list with progress percentages' },
        },
      },
      post: {
        tags: ['Budgets'],
        summary: 'Set or update monthly category budget limit',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['category', 'limit'],
                properties: {
                  category: { type: 'string', example: 'Food & Dining' },
                  limit: { type: 'number', example: 8000 },
                  alertThreshold: { type: 'number', example: 80 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Budget limit saved' },
        },
      },
    },
    '/api/budgets/{id}': {
      delete: {
        tags: ['Budgets'],
        summary: 'Delete a budget limit',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Budget deleted' },
        },
      },
    },
    '/api/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List default system categories and user custom categories',
        responses: {
          200: { description: 'List of categories' },
        },
      },
      post: {
        tags: ['Categories'],
        summary: 'Create custom category',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', example: 'Books & Learning' },
                  type: { type: 'string', enum: ['EXPENSE', 'INCOME'], default: 'EXPENSE' },
                  color: { type: 'string', example: '#6366f1' },
                  icon: { type: 'string', example: 'BookOpen' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Category created' },
        },
      },
    },
    '/api/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'Get all user accounts and transaction counts (Admin Only)',
        responses: {
          200: { description: 'User accounts list' },
          403: { description: 'Forbidden — requires admin role' },
        },
      },
    },
    '/api/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Get system-wide platform statistics and total volumes (Admin Only)',
        responses: {
          200: { description: 'Global platform metrics' },
          403: { description: 'Forbidden — requires admin role' },
        },
      },
    },
    '/api/admin/users/{id}/role': {
      put: {
        tags: ['Admin'],
        summary: 'Update user role between user and admin (Admin Only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: { role: { type: 'string', enum: ['user', 'admin'] } },
              },
            },
          },
        },
        responses: { 200: { description: 'User role updated' } },
      },
    },
    '/api/admin/users/{id}/status': {
      put: {
        tags: ['Admin'],
        summary: 'Toggle user active/deactivated status (Admin Only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'User status toggled' } },
      },
    },
    '/api/admin/users/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Delete a user and all their transactions (Admin Only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'User deleted' } },
      },
    },
    '/api/chat/messages': {
      get: {
        tags: ['Chat'],
        summary: 'Get recent WebSocket chat message history',
        responses: { 200: { description: 'Recent message list' } },
      },
      post: {
        tags: ['Chat'],
        summary: 'Post message to chat room and broadcast via Socket.IO',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: { message: { type: 'string', example: 'Hello everyone!' } },
              },
            },
          },
        },
        responses: { 201: { description: 'Message sent and broadcasted' } },
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [], // Defined explicitly in paths above for 100% reliable rendering
});
