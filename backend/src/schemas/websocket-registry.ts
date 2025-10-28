import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  ErrorSchema,
  SuccessResponse,
  WebSocketConnectionInfo,
  WebSocketEvent,
  WebSocketRequest,
  WebSocketStats,
} from './index.js';

export function registerWebSocketEndpoints(registry: OpenAPIRegistry): void {

  registry.registerPath({
    method: 'get',
    path: '/websocket',
    operationId: 'websocketConnection',
    summary: 'WebSocket connection endpoint',
    description: 'Connect to the WebSocket server for real-time chat functionality',
    tags: ['WebSocket'],
    parameters: [
      {
        name: 'token',
        in: 'query',
        description: 'JWT authentication token',
        required: true,
        schema: { type: 'string' },
      },
    ],
    responses: {
      101: {
        description: 'WebSocket connection established',
        content: {
          'application/json': {
            schema: WebSocketConnectionInfo,
          },
        },
      },
      401: {
        description: 'Unauthorized - invalid or missing token',
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
    path: '/websocket/events',
    operationId: 'websocketEvents',
    summary: 'WebSocket event documentation',
    description: 'Documentation for all available WebSocket events and their schemas',
    tags: ['WebSocket'],
    request: {
      body: {
        content: {
          'application/json': {
            schema: WebSocketRequest,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'WebSocket event documentation',
        content: {
          'application/json': {
            schema: WebSocketEvent,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/websocket/stats',
    operationId: 'websocketStats',
    summary: 'Get WebSocket server statistics',
    description: 'Retrieve real-time statistics about WebSocket connections and performance',
    tags: ['WebSocket'],
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'WebSocket statistics retrieved successfully',
        content: {
          'application/json': {
            schema: SuccessResponse(WebSocketStats),
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
    path: '/websocket/schemas',
    operationId: 'websocketSchemas',
    summary: 'Get WebSocket event schemas',
    description: 'Retrieve all available WebSocket event schemas for client implementation',
    tags: ['WebSocket'],
    responses: {
      200: {
        description: 'WebSocket schemas retrieved successfully',
        content: {
          'application/json': {
            schema: z.object({
              events: z.array(
                z.object({
                  name: z.string(),
                  schema: z.any(),
                  description: z.string(),
                })
              ),
              requests: z.array(
                z.object({
                  name: z.string(),
                  schema: z.any(),
                  description: z.string(),
                })
              ),
            }),
          },
        },
      },
    },
  });
}
