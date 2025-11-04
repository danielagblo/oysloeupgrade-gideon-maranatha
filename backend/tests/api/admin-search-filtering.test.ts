import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import {
  authenticatedAdminRequest,
  closeTestServer,
  createAdminAndToken,
  createTestServer,
  expectError,
  expectSuccess,
  resetDb,
  seedProduct,
  seedUser,
} from '../test-helpers';

describe('Admin Global Search & Advanced Filtering', () => {
  let server: unknown;
  let baseURL: string;

  beforeAll(async () => {
    const testServer = await createTestServer();
    server = testServer.server;
    baseURL = testServer.baseURL;
  });

  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await closeTestServer(server);
  });

  describe('GET /api-v1/admin/search', () => {
    it('performs global search across all entities', async () => {
      const { token } = await createAdminAndToken();

      // Create test data
      await seedUser({ name: 'John Smith', email: 'john@example.com' });
      await seedProduct({ name: 'iPhone 15 Pro', description: 'Latest iPhone model' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/search?q=john&limit=10`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.results).toBeDefined();
      expect(body.data.total).toBeDefined();
      expect(body.data.query).toBe('john');

      // Should find user with "john" in name/email
      expect(body.data.results.users).toBeInstanceOf(Array);
      expect(body.data.results.users.length).toBeGreaterThan(0);
    });

    it('searches specific entity types', async () => {
      const { token } = await createAdminAndToken();

      // Create test data
      await seedUser({ name: 'Jane Doe', email: 'jane@example.com' });
      await seedProduct({ name: 'Samsung Galaxy', description: 'Android phone' });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/search?q=samsung&types=ads`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.results.ads).toBeInstanceOf(Array);
      expect(body.data.results.ads.length).toBeGreaterThan(0);
      expect(body.data.results.ads[0].name).toContain('Samsung');

      // Should not include users in results when filtering by ads only
      expect(body.data.results.users).toBeUndefined();
    });

    it('handles multiple entity types in search', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/search?q=test&types=users,ads,support`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.results).toBeDefined();
      expect(body.data.results.users).toBeInstanceOf(Array);
      expect(body.data.results.ads).toBeInstanceOf(Array);
      expect(body.data.results.supportCases).toBeInstanceOf(Array);
    });

    it('validates search query', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/search?q=&limit=10`,
        token
      );

      await expectError(response, 400);
    });

    it('respects result limits', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/search?q=user&limit=5`,
        token
      );

      const body = await expectSuccess(response, 200);

      // Check that each result type respects the limit
      Object.values(body.data.results).forEach((results: any) => {
        if (Array.isArray(results)) {
          expect(results.length).toBeLessThanOrEqual(5);
        }
      });
    });
  });

  describe('Advanced Filtering System', () => {
    it('applies advanced filters to user queries', async () => {
      const { token } = await createAdminAndToken();

      const filterData = {
        filters: [
          {
            field: 'verificationStatus',
            operator: 'eq',
            value: 'verified',
          },
          {
            field: 'createdAt',
            operator: 'gte',
            value: '2024-01-01T00:00:00Z',
          },
        ],
        sort: [
          {
            field: 'createdAt',
            order: 'desc',
          },
        ],
        page: 1,
        limit: 20,
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/filter`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(filterData),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.data).toBeInstanceOf(Array);
      expect(body.data.total).toBeDefined();
      expect(body.data.appliedFilters).toBe(2);
    });

    it('supports complex filter combinations', async () => {
      const { token } = await createAdminAndToken();

      const complexFilters = {
        filters: [
          {
            field: 'status',
            operator: 'in',
            value: ['active', 'pending'],
          },
          {
            field: 'price',
            operator: 'between',
            value: [50, 500],
          },
          {
            field: 'name',
            operator: 'contains',
            value: 'phone',
          },
        ],
        page: 1,
        limit: 10,
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/filter`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(complexFilters),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.data).toBeInstanceOf(Array);
      expect(body.data.total).toBeDefined();
      expect(body.data.appliedFilters).toBe(3);
    });

    it('validates filter operators', async () => {
      const { token } = await createAdminAndToken();

      const invalidFilter = {
        filters: [
          {
            field: 'status',
            operator: 'invalid_operator',
            value: 'active',
          },
        ],
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/filter`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(invalidFilter),
        }
      );

      await expectError(response, 400);
    });

    it('handles date range filtering', async () => {
      const { token } = await createAdminAndToken();

      const dateFilter = {
        filters: [
          {
            field: 'createdAt',
            operator: 'gte',
            value: '2024-01-01T00:00:00Z',
          },
          {
            field: 'createdAt',
            operator: 'lte',
            value: '2024-12-31T23:59:59Z',
          },
        ],
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/filter`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(dateFilter),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.data).toBeInstanceOf(Array);
    });
  });

  describe('Saved Search & Filter Management', () => {
    it('saves search query for reuse', async () => {
      const { token, admin } = await createAdminAndToken();

      const saveData = {
        name: 'High Value Users',
        description: 'Users with high verification level and recent activity',
        query: {
          filters: [
            {
              field: 'verificationLevel',
              operator: 'eq',
              value: 'high',
            },
            {
              field: 'lastLoginAt',
              operator: 'gte',
              value: '2024-01-01T00:00:00Z',
            },
          ],
        },
        entityType: 'users',
        isPublic: false,
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/searches/saved`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(saveData),
        }
      );

      const body = await expectSuccess(response, 201);
      expect(body.data.savedSearch).toBeDefined();
      expect(body.data.savedSearch.name).toBe('High Value Users');
      expect(body.data.savedSearch.createdBy).toBe(admin.id);
      expect(body.data.auditLogId).toBeDefined();
    });

    it('retrieves saved searches', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/searches/saved`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.searches).toBeInstanceOf(Array);

      body.data.searches.forEach((search: any) => {
        expect(search.id).toBeDefined();
        expect(search.name).toBeDefined();
        expect(search.query).toBeDefined();
        expect(search.entityType).toBeDefined();
      });
    });

    it('executes saved search', async () => {
      const { token } = await createAdminAndToken();

      // First save a search
      const saveResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/searches/saved`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Active Ads',
            query: {
              filters: [
                {
                  field: 'status',
                  operator: 'eq',
                  value: 'active',
                },
              ],
            },
            entityType: 'ads',
          }),
        }
      );

      const saveBody = await saveResponse.json();
      const searchId = saveBody.data.savedSearch.id;

      // Execute the saved search
      const executeResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/searches/saved/${searchId}/execute`,
        token
      );

      const executeBody = await expectSuccess(executeResponse, 200);
      expect(executeBody.data.results).toBeDefined();
      expect(executeBody.data.total).toBeDefined();
    });

    it('updates saved search', async () => {
      const { token } = await createAdminAndToken();

      // Create a saved search first
      const createResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/searches/saved`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Old Search',
            query: { filters: [] },
            entityType: 'users',
          }),
        }
      );

      const createBody = await createResponse.json();
      const searchId = createBody.data.savedSearch.id;

      // Update the saved search
      const updateResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/searches/saved/${searchId}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: 'Updated Search',
            description: 'Modified search query',
            query: {
              filters: [
                {
                  field: 'status',
                  operator: 'eq',
                  value: 'active',
                },
              ],
            },
          }),
        }
      );

      const updateBody = await expectSuccess(updateResponse, 200);
      expect(updateBody.data.savedSearch.name).toBe('Updated Search');
      expect(updateBody.data.savedSearch.description).toBe('Modified search query');
    });
  });

  describe('Search Analytics & Performance', () => {
    it('tracks search query performance', async () => {
      const { token } = await createAdminAndToken();

      const searchData = {
        query: 'performance test',
        types: ['users', 'ads'],
        executionTime: 150, // milliseconds
        resultCount: 25,
        filters: [],
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/search/analytics`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(searchData),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.analytics).toBeDefined();
      expect(body.data.analytics.averageExecutionTime).toBeDefined();
      expect(body.data.analytics.popularQueries).toBeInstanceOf(Array);
    });

    it('provides search suggestions', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/search/suggestions?q=app&limit=5`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.suggestions).toBeInstanceOf(Array);
      expect(body.data.suggestions.length).toBeLessThanOrEqual(5);

      body.data.suggestions.forEach((suggestion: any) => {
        expect(suggestion.text).toBeDefined();
        expect(suggestion.type).toBeDefined();
        expect(suggestion.relevance).toBeDefined();
      });
    });

    it('analyzes search patterns', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/search/analytics/patterns?period=month`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.patterns).toBeDefined();
      expect(body.data.patterns.popularTerms).toBeInstanceOf(Array);
      expect(body.data.patterns.searchFrequency).toBeDefined();
      expect(body.data.patterns.noResultQueries).toBeInstanceOf(Array);
    });
  });

  describe('Bulk Filtering Operations', () => {
    it('applies bulk filters to multiple entities', async () => {
      const { token } = await createAdminAndToken();

      const bulkFilterData = {
        entityType: 'users',
        operation: 'update',
        filters: [
          {
            field: 'verificationStatus',
            operator: 'eq',
            value: 'unverified',
          },
          {
            field: 'createdAt',
            operator: 'lt',
            value: '2024-06-01T00:00:00Z',
          },
        ],
        updateData: {
          verificationStatus: 'verified',
          verifiedAt: new Date().toISOString(),
          verifiedBy: 'bulk-process',
        },
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/bulk/filter-update`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(bulkFilterData),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.affected).toBeDefined();
      expect(body.data.successful).toBeDefined();
      expect(body.data.failed).toBeDefined();
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates bulk operation permissions', async () => {
      const { token } = await createAdminAndToken({ role: 'staff' }); // Limited permissions

      const bulkData = {
        entityType: 'system_settings',
        operation: 'delete',
        filters: [{ field: 'category', operator: 'eq', value: 'test' }],
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/bulk/filter-update`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(bulkData),
        }
      );

      await expectError(response, 403);
    });
  });

  describe('Search Result Export', () => {
    it('exports filtered search results', async () => {
      const { token } = await createAdminAndToken();

      const exportData = {
        query: 'test export',
        filters: [
          {
            field: 'status',
            operator: 'eq',
            value: 'active',
          },
        ],
        entityType: 'users',
        format: 'csv',
        fields: ['id', 'name', 'email', 'status'],
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/search/export`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(exportData),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.downloadUrl).toBeDefined();
      expect(body.data.expiresAt).toBeDefined();
      expect(body.data.recordCount).toBeDefined();
      expect(body.data.format).toBe('csv');
    });

    it('validates export format', async () => {
      const { token } = await createAdminAndToken();

      const exportData = {
        query: 'test',
        entityType: 'users',
        format: 'invalid-format',
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/search/export`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(exportData),
        }
      );

      await expectError(response, 400);
    });
  });

  describe('Search History & Audit', () => {
    it('logs search queries for audit', async () => {
      const { token, admin } = await createAdminAndToken();

      // Perform a search (this should be logged)
      await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/search?q=audit+test&types=users`,
        token
      );

      // Retrieve search history
      const historyResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/search/history?page=1&limit=10`,
        token
      );

      const historyBody = await expectSuccess(historyResponse, 200);
      expect(historyBody.data.history).toBeInstanceOf(Array);

      // Should include the recent search
      const recentSearch = historyBody.data.history.find(
        (entry: any) => entry.query === 'audit test' && entry.adminId === admin.id
      );
      expect(recentSearch).toBeDefined();
    });

    it('tracks search performance metrics', async () => {
      const { token } = await createAdminAndToken();

      const metricsResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/search/metrics?period=week`,
        token
      );

      const metricsBody = await expectSuccess(metricsResponse, 200);
      expect(metricsBody.data.metrics).toBeDefined();
      expect(metricsBody.data.metrics.totalSearches).toBeDefined();
      expect(metricsBody.data.metrics.averageResponseTime).toBeDefined();
      expect(metricsBody.data.metrics.popularEntityTypes).toBeInstanceOf(Array);
      expect(metricsBody.data.metrics.failedSearches).toBeDefined();
    });
  });
});

