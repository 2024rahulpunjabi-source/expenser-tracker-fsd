import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
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
            _id: { type: 'string' },
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
            _id: { type: 'string' },
            title: { type: 'string', example: 'Grocery Store' },
            amount: { type: 'number', example: 1250 },
            type: { type: 'string', enum: ['EXPENSE', 'INCOME'], example: 'EXPENSE' },
            category: { type: 'string', example: 'Food & Dining' },
            paymentMethod: {
              type: 'string',
              enum: ['UPI', 'CARD', 'CASH', 'NET_BANKING', 'OTHER'],
              example: 'UPI',
            },
            date: { type: 'string', format: 'date-time' },
            notes: { type: 'string', example: 'Weekly household fruits and vegetables' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        Budget: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            category: { type: 'string', example: 'Food & Dining' },
            limit: { type: 'number', example: 10000 },
            month: { type: 'number', example: 11 },
            year: { type: 'number', example: 2026 },
            alertThreshold: { type: 'number', example: 80 },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
