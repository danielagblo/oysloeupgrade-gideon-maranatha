import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  ChangePasswordBody,
  ChatHistoryResponse,
  ChatMessage,
  ChatMessageEvent,
  ChatroomMetadata,
  ChatroomsListResponse,
  CreateProductBody,
  CreateUserBody,
  ErrorSchema,
  HealthCheckResponse,
  JoinPrivateChatRequest,
  JoinPrivateChatResponse,

  JoinRoomRequest,
  JoinRoomResponse,
  LoginBody,
  MessageStatus,
  OTPVerificationBody,
  PaginatedResponse,
  PasswordResetConfirmBody,
  PasswordResetRequestBody,
  Product,
  ProductQueryParams,
  ProductWithDetails,
  RoomKey,
  SendMessageRequest,
  SendMessageResponse,
  StopTypingNotificationEvent,
  SuccessResponse,
  TokenResponse,
  TypingNotificationEvent,
  TypingRequest,
  TypingResponse,
  TypingStatus,
  UnreadCountResponse,
  UnreadCountUpdateEvent,
  UpdateProductBody,
  UpdateUserBody,
  User,
  UserWithWallet,
  WebSocketAuth,
  WebSocketConfig,
  WebSocketConnectionInfo,
  WebSocketErrorEvent,
  WebSocketEvent,
  WebSocketRequest,
  WebSocketStats,
} from './index.js';
import { registerWebSocketEndpoints } from './websocket-registry.js';

export const registry = new OpenAPIRegistry();

registry.register('Error', ErrorSchema);

registry.register('User', User);
registry.register('CreateUserBody', CreateUserBody);
registry.register('UpdateUserBody', UpdateUserBody);
registry.register('LoginBody', LoginBody);
registry.register('UserWithWallet', UserWithWallet);

registry.register('Product', Product);
registry.register('CreateProductBody', CreateProductBody);
registry.register('UpdateProductBody', UpdateProductBody);
registry.register('ProductWithDetails', ProductWithDetails);
registry.register('ProductQueryParams', ProductQueryParams);

registry.register('TokenResponse', TokenResponse);
registry.register('HealthCheckResponse', HealthCheckResponse);

registry.register('PaginatedProducts', PaginatedResponse(Product));
registry.register('PaginatedProductsWithDetails', PaginatedResponse(ProductWithDetails));

registry.register('SuccessUser', SuccessResponse(User));
registry.register('SuccessUserWithWallet', SuccessResponse(UserWithWallet));
registry.register('SuccessProduct', SuccessResponse(Product));
registry.register('SuccessProductWithDetails', SuccessResponse(ProductWithDetails));
registry.register('SuccessToken', SuccessResponse(TokenResponse));

registry.register('OTPVerificationBody', OTPVerificationBody);
registry.register('PasswordResetRequestBody', PasswordResetRequestBody);
registry.register('PasswordResetConfirmBody', PasswordResetConfirmBody);
registry.register('ChangePasswordBody', ChangePasswordBody);

registry.register('JoinRoomRequest', JoinRoomRequest);
registry.register('JoinRoomResponse', JoinRoomResponse);
registry.register('SendMessageRequest', SendMessageRequest);
registry.register('SendMessageResponse', SendMessageResponse);
registry.register('TypingRequest', TypingRequest);
registry.register('TypingResponse', TypingResponse);
registry.register('JoinPrivateChatRequest', JoinPrivateChatRequest);
registry.register('JoinPrivateChatResponse', JoinPrivateChatResponse);
registry.register('ChatHistoryResponse', ChatHistoryResponse);
registry.register('ChatMessageEvent', ChatMessageEvent);
registry.register('TypingNotificationEvent', TypingNotificationEvent);
registry.register('StopTypingNotificationEvent', StopTypingNotificationEvent);
registry.register('ChatroomsListResponse', ChatroomsListResponse);
registry.register('UnreadCountResponse', UnreadCountResponse);
registry.register('UnreadCountUpdateEvent', UnreadCountUpdateEvent);
registry.register('WebSocketErrorEvent', WebSocketErrorEvent);
registry.register('ChatMessage', ChatMessage);
registry.register('ChatroomMetadata', ChatroomMetadata);
registry.register('WebSocketConnectionInfo', WebSocketConnectionInfo);
registry.register('WebSocketConfig', WebSocketConfig);
registry.register('WebSocketAuth', WebSocketAuth);
registry.register('RoomKey', RoomKey);
registry.register('MessageStatus', MessageStatus);
registry.register('TypingStatus', TypingStatus);
registry.register('WebSocketStats', WebSocketStats);
registry.register('WebSocketEvent', WebSocketEvent);
registry.register('WebSocketRequest', WebSocketRequest);

registry.registerPath({
  method: 'get',
  path: '/health',
  operationId: 'healthCheck',
  summary: 'Health check endpoint',
  description: 'Check the health status of the API and its dependencies',
  tags: ['System'],
  responses: {
    200: {
      description: 'Service is healthy',
      content: {
        'application/json': {
          schema: HealthCheckResponse,
        },
      },
    },
    503: {
      description: 'Service is unhealthy',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/register',
  operationId: 'registerUser',
  summary: 'Register a new user',
  description: 'Create a new user account with email and password',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateUserBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User created successfully',
      content: {
        'application/json': {
          schema: SuccessResponse(User),
        },
      },
    },
    400: {
      description: 'Invalid input data',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    409: {
      description: 'User already exists',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/login',
  operationId: 'loginUser',
  summary: 'Login user',
  description: 'Authenticate user with email and password',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: SuccessResponse(TokenResponse),
        },
      },
    },
    401: {
      description: 'Invalid credentials',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    400: {
      description: 'Invalid input data',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/users/me',
  operationId: 'getCurrentUser',
  summary: 'Get current user profile',
  description: "Retrieve the authenticated user's profile information",
  tags: ['Users'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'User profile retrieved successfully',
      content: {
        'application/json': {
          schema: SuccessResponse(UserWithWallet),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'put',
  path: '/users/me',
  operationId: 'updateCurrentUser',
  summary: 'Update current user profile',
  description: "Update the authenticated user's profile information",
  tags: ['Users'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: UpdateUserBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'User profile updated successfully',
      content: {
        'application/json': {
          schema: SuccessResponse(User),
        },
      },
    },
    400: {
      description: 'Invalid input data',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/products',
  operationId: 'listProducts',
  summary: 'List products',
  description: 'Retrieve a paginated list of products with optional filtering',
  tags: ['Products'],
  parameters: [
    {
      name: 'page',
      in: 'query',
      description: 'Page number',
      required: false,
      schema: { type: 'integer', minimum: 1, default: 1 },
    },
    {
      name: 'limit',
      in: 'query',
      description: 'Items per page',
      required: false,
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    },
    {
      name: 'search',
      in: 'query',
      description: 'Search term',
      required: false,
      schema: { type: 'string' },
    },
    {
      name: 'categoryId',
      in: 'query',
      description: 'Filter by category ID',
      required: false,
      schema: { type: 'string', format: 'uuid' },
    },
    {
      name: 'minPrice',
      in: 'query',
      description: 'Minimum price filter',
      required: false,
      schema: { type: 'number', minimum: 0 },
    },
    {
      name: 'maxPrice',
      in: 'query',
      description: 'Maximum price filter',
      required: false,
      schema: { type: 'number', minimum: 0 },
    },
    {
      name: 'status',
      in: 'query',
      description: 'Filter by status',
      required: false,
      schema: {
        type: 'string',
        enum: ['draft', 'active', 'paused', 'archived', 'sold'],
      },
    },
  ],
  responses: {
    200: {
      description: 'Products retrieved successfully',
      content: {
        'application/json': {
          schema: PaginatedResponse(Product),
        },
      },
    },
    400: {
      description: 'Invalid query parameters',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/products/{id}',
  operationId: 'getProduct',
  summary: 'Get product by ID',
  description: 'Retrieve a specific product with full details',
  tags: ['Products'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      description: 'Product UUID',
      required: true,
      schema: { type: 'string', format: 'uuid' },
    },
  ],
  responses: {
    200: {
      description: 'Product retrieved successfully',
      content: {
        'application/json': {
          schema: SuccessResponse(ProductWithDetails),
        },
      },
    },
    404: {
      description: 'Product not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/products',
  operationId: 'createProduct',
  summary: 'Create a new product',
  description: 'Create a new product listing',
  tags: ['Products'],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateProductBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Product created successfully',
      content: {
        'application/json': {
          schema: SuccessResponse(Product),
        },
      },
    },
    400: {
      description: 'Invalid input data',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'put',
  path: '/products/{id}',
  operationId: 'updateProduct',
  summary: 'Update product',
  description: 'Update an existing product (only by owner)',
  tags: ['Products'],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: 'id',
      in: 'path',
      description: 'Product UUID',
      required: true,
      schema: { type: 'string', format: 'uuid' },
    },
  ],
  request: {
    body: {
      content: {
        'application/json': {
          schema: UpdateProductBody,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Product updated successfully',
      content: {
        'application/json': {
          schema: SuccessResponse(Product),
        },
      },
    },
    400: {
      description: 'Invalid input data',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    403: {
      description: 'Forbidden - not the product owner',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: 'Product not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/products/{id}',
  operationId: 'deleteProduct',
  summary: 'Delete product',
  description: 'Delete a product (only by owner)',
  tags: ['Products'],
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: 'id',
      in: 'path',
      description: 'Product UUID',
      required: true,
      schema: { type: 'string', format: 'uuid' },
    },
  ],
  responses: {
    204: {
      description: 'Product deleted successfully',
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    403: {
      description: 'Forbidden - not the product owner',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    404: {
      description: 'Product not found',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
    },
  },
});

registerWebSocketEndpoints(registry);
