import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import {
  authenticatedAdminRequest,
  closeTestServer,
  createAdminAndToken,
  createTestServer,
  expectError,
  expectSuccess,
  resetDb,
} from '../test-helpers';

describe('Admin Locations Management API', () => {
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

  describe('GET /api-v1/admin/locations', () => {
    it('returns all regions with towns', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(`${baseURL}/api-v1/admin/locations`, token);

      const body = await expectSuccess(response, 200);
      expect(body.data.regions).toBeInstanceOf(Array);

      body.data.regions.forEach((region: any) => {
        expect(region.id).toBeDefined();
        expect(region.name).toBeDefined();
        expect(region.code).toBeDefined();
        expect(region.towns).toBeInstanceOf(Array);
      });
    });

    it('includes town details in regions', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(`${baseURL}/api-v1/admin/locations`, token);

      const body = await expectSuccess(response, 200);

      const regionWithTowns = body.data.regions.find((region: any) => region.towns.length > 0);
      if (regionWithTowns) {
        regionWithTowns.towns.forEach((town: any) => {
          expect(town.id).toBeDefined();
          expect(town.name).toBeDefined();
          expect(town.regionId).toBe(regionWithTowns.id);
        });
      }
    });

    it('rejects unauthenticated requests', async () => {
      const response = await fetch(`${baseURL}/api-v1/admin/locations`);

      await expectError(response, 401);
    });
  });

  describe('POST /api-v1/admin/locations/regions', () => {
    it('creates new region successfully', async () => {
      const { token, admin } = await createAdminAndToken();

      const regionData = {
        name: 'Greater Accra',
        code: 'GAR',
        towns: ['Accra', 'Tema', 'Takoradi'],
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(regionData),
        }
      );

      const body = await expectSuccess(response, 201);
      expect(body.data.region).toBeDefined();
      expect(body.data.region.name).toBe('Greater Accra');
      expect(body.data.region.code).toBe('GAR');
      expect(body.data.region.towns).toBeInstanceOf(Array);
      expect(body.data.region.towns.length).toBe(3);
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates required fields', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test Region',
          }),
        }
      );

      await expectError(response, 400);
    });

    it('validates unique region code', async () => {
      const { token } = await createAdminAndToken();

      await authenticatedAdminRequest(`${baseURL}/api-v1/admin/locations/regions`, token, {
        method: 'POST',
        body: JSON.stringify({
          name: 'First Region',
          code: 'FRG',
        }),
      });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Second Region',
            code: 'FRG', // duplicate
          }),
        }
      );

      await expectError(response, 409);
    });
  });

  describe('POST /api-v1/admin/locations/regions/:regionId/towns', () => {
    it('adds town to region successfully', async () => {
      const { token, admin } = await createAdminAndToken();

      const regionResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Ashanti Region',
            code: 'ASR',
          }),
        }
      );

      const regionBody = await regionResponse.json();
      const regionId = regionBody.data.region.id;

      const townData = {
        name: 'Kumasi',
        coordinates: {
          lat: 6.6666,
          lng: -1.6163,
        },
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions/${regionId}/towns`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(townData),
        }
      );

      const body = await expectSuccess(response, 201);
      expect(body.data.town).toBeDefined();
      expect(body.data.town.name).toBe('Kumasi');
      expect(body.data.town.regionId).toBe(regionId);
      expect(body.data.town.coordinates.lat).toBe(6.6666);
      expect(body.data.town.coordinates.lng).toBe(-1.6163);
      expect(body.data.auditLogId).toBeDefined();
    });

    it('validates region exists', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions/99999/towns`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Non-existent Town',
          }),
        }
      );

      await expectError(response, 404);
    });

    it('validates town coordinates', async () => {
      const { token } = await createAdminAndToken();

      const regionResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test Region',
            code: 'TRG',
          }),
        }
      );

      const regionBody = await regionResponse.json();
      const regionId = regionBody.data.region.id;

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions/${regionId}/towns`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test Town',
            coordinates: {
              lat: 91, // Invalid latitude (> 90)
              lng: -200, // Invalid longitude (< -180)
            },
          }),
        }
      );

      await expectError(response, 400);
    });
  });

  describe('PUT /api-v1/admin/locations/regions/:regionId/towns/:townId', () => {
    it('updates town successfully', async () => {
      const { token, admin } = await createAdminAndToken();

      const regionResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Volta Region',
            code: 'VTR',
          }),
        }
      );

      const regionBody = await regionResponse.json();
      const regionId = regionBody.data.region.id;

      const townResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions/${regionId}/towns`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Ho',
            coordinates: {
              lat: 6.6,
              lng: 0.4667,
            },
          }),
        }
      );

      const townBody = await townResponse.json();
      const townId = townBody.data.town.id;

      const updateResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions/${regionId}/towns/${townId}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: 'Ho Municipal',
            coordinates: {
              lat: 6.6111,
              lng: 0.4667,
            },
            isActive: true,
          }),
        }
      );

      const updateBody = await expectSuccess(updateResponse, 200);
      expect(updateBody.data.town.name).toBe('Ho Municipal');
      expect(updateBody.data.town.coordinates.lat).toBe(6.6111);
      expect(updateBody.data.town.regionId).toBe(regionId);
      expect(updateBody.data.auditLogId).toBeDefined();
    });

    it('returns 404 for non-existent town', async () => {
      const { token } = await createAdminAndToken();

      const regionResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test Region',
            code: 'TRG',
          }),
        }
      );

      const regionBody = await regionResponse.json();
      const regionId = regionBody.data.region.id;

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions/${regionId}/towns/99999`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: 'Non-existent Town',
          }),
        }
      );

      await expectError(response, 404);
    });
  });

  describe('DELETE /api-v1/admin/locations/regions/:regionId/towns/:townId', () => {
    it('deletes town successfully', async () => {
      const { token } = await createAdminAndToken();

      const regionResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Delete Test Region',
            code: 'DTR',
          }),
        }
      );

      const regionBody = await regionResponse.json();
      const regionId = regionBody.data.region.id;

      const townResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions/${regionId}/towns`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Town to Delete',
          }),
        }
      );

      const townBody = await townResponse.json();
      const townId = townBody.data.town.id;

      const deleteResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions/${regionId}/towns/${townId}`,
        token,
        {
          method: 'DELETE',
        }
      );

      const deleteBody = await expectSuccess(deleteResponse, 200);
      expect(deleteBody.success).toBe(true);
      expect(deleteBody.data.success).toBe(true);
      expect(deleteBody.data.message).toBe('Town deleted successfully');

      // Verify town is actually deleted
      const verifyResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions/${regionId}/towns/${townId}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({ name: 'Test' }),
        }
      );

      await expectError(verifyResponse, 404);
    });

    it('returns 404 for non-existent town', async () => {
      const { token } = await createAdminAndToken();

      const regionResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test Region',
            code: 'TR404',
          }),
        }
      );

      const regionBody = await regionResponse.json();
      const regionId = regionBody.data.region.id;
      const fakeTownId = '00000000-0000-0000-0000-000000000000';

      const deleteResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions/${regionId}/towns/${fakeTownId}`,
        token,
        {
          method: 'DELETE',
        }
      );

      await expectError(deleteResponse, 404);
    });

    it('prevents deleting region with towns', async () => {
      const { token } = await createAdminAndToken();

      const regionResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Region With Towns',
            code: 'RWT',
          }),
        }
      );

      const regionBody = await regionResponse.json();
      const regionId = regionBody.data.region.id;

      // Add a town
      await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions/${regionId}/towns`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test Town',
          }),
        }
      );

      // Try to delete region with towns
      const deleteResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions/${regionId}`,
        token,
        {
          method: 'DELETE',
        }
      );

      const deleteBody = await expectError(deleteResponse, 409);
      expect(deleteBody.message).toContain('Cannot delete region');
      expect(deleteBody.message).toContain('town(s) exist');
    });
  });

  describe('GET /api-v1/admin/locations/stats', () => {
    it('returns location statistics', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/stats`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.stats).toBeDefined();
      expect(typeof body.data.stats.totalRegions).toBe('number');
      expect(typeof body.data.stats.totalTowns).toBe('number');
      expect(body.data.stats.regionsByActivity).toBeDefined();
      expect(body.data.stats.mostActiveRegions).toBeInstanceOf(Array);
      expect(body.data.stats.townDistribution).toBeDefined();
    });

    it('includes region activity metrics', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/stats`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.stats.regionsByActivity).toBeDefined();

      expect(body.data.stats.regionsByActivity.active).toBeDefined();
      expect(body.data.stats.regionsByActivity.inactive).toBeDefined();
    });

    it('includes most active regions', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/stats`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.stats.mostActiveRegions).toBeInstanceOf(Array);

      body.data.stats.mostActiveRegions.forEach((region: any) => {
        expect(region.regionId).toBeDefined();
        expect(region.regionName).toBeDefined();
        expect(typeof region.userCount).toBe('number');
        expect(typeof region.adCount).toBe('number');
      });
    });
  });

  describe('Additional Location Endpoints', () => {
    it('PUT /api-v1/admin/locations/regions/:id updates region', async () => {
      const { token, admin } = await createAdminAndToken();

      const createResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Update Test Region',
            code: 'UTR',
          }),
        }
      );

      const createBody = await createResponse.json();
      const regionId = createBody.data.region.id;

      const updateResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions/${regionId}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: 'Updated Test Region',
            code: 'UTR',
            isActive: false,
          }),
        }
      );

      const updateBody = await expectSuccess(updateResponse, 200);
      expect(updateBody.data.region.name).toBe('Updated Test Region');
      expect(updateBody.data.region.isActive).toBe(false);
      expect(updateBody.data.auditLogId).toBeDefined();
    });

    it('DELETE /api-v1/admin/locations/regions/:id deletes region', async () => {
      const { token } = await createAdminAndToken();

      const createResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Region to Delete',
            code: 'RTD',
          }),
        }
      );

      const createBody = await createResponse.json();
      const regionId = createBody.data.region.id;

      const deleteResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions/${regionId}`,
        token,
        {
          method: 'DELETE',
        }
      );

      const deleteBody = await expectSuccess(deleteResponse, 200);
      expect(deleteBody.success).toBe(true);
      expect(deleteBody.data.success).toBe(true);
      expect(deleteBody.data.message).toBe('Region deleted successfully');

      // Verify region is actually deleted
      const verifyResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions/${regionId}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({ name: 'Test' }),
        }
      );

      await expectError(verifyResponse, 404);
    });

    it('returns 404 for non-existent region', async () => {
      const { token } = await createAdminAndToken();
      const fakeRegionId = '00000000-0000-0000-0000-000000000000';

      const deleteResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions/${fakeRegionId}`,
        token,
        {
          method: 'DELETE',
        }
      );

      await expectError(deleteResponse, 404);
    });

    it('POST /api-v1/admin/locations/bulk-import imports locations', async () => {
      const { token } = await createAdminAndToken();

      const importData = {
        regions: [
          {
            name: 'Northern Region',
            code: 'NTR',
            towns: ['Tamale', 'Yendi', 'Walewale'],
          },
          {
            name: 'Upper East Region',
            code: 'UER',
            towns: ['Bolgatanga', 'Navrongo'],
          },
        ],
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/bulk-import`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(importData),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.imported).toBeDefined();
      expect(body.data.imported.regions).toBe(2);
      expect(body.data.imported.towns).toBe(5);
      expect(body.data.failed).toBeDefined();
      expect(body.data.auditLogId).toBeDefined();
    });

    it('GET /api-v1/admin/locations/search searches locations', async () => {
      const { token } = await createAdminAndToken();

      await authenticatedAdminRequest(`${baseURL}/api-v1/admin/locations/regions`, token, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Search Test Region',
          code: 'STR',
          towns: ['Search Town', 'Another Town'],
        }),
      });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/search?q=search&type=region`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.results).toBeInstanceOf(Array);
      expect(body.data.results.length).toBeGreaterThan(0);

      const searchRegion = body.data.results.find((r: any) => r.name.includes('Search'));
      expect(searchRegion).toBeDefined();
    });

    it('POST /api-v1/admin/locations/regions/:id/activate activates region', async () => {
      const { token } = await createAdminAndToken();

      const createResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Inactive Region',
            code: 'INR',
            isActive: false,
          }),
        }
      );

      const createBody = await createResponse.json();
      const regionId = createBody.data.region.id;

      const activateResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions/${regionId}/activate`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            reason: 'Region now operational',
          }),
        }
      );

      const activateBody = await expectSuccess(activateResponse, 200);
      expect(activateBody.data.region.isActive).toBe(true);
      expect(activateBody.data.auditLogId).toBeDefined();
    });

    it('POST /api-v1/admin/locations/regions/:id/deactivate deactivates region', async () => {
      const { token } = await createAdminAndToken();

      const createResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'Active Region',
            code: 'ACR',
            isActive: true,
          }),
        }
      );

      const createBody = await createResponse.json();
      const regionId = createBody.data.region.id;

      const deactivateResponse = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/locations/regions/${regionId}/deactivate`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            reason: 'Temporary maintenance',
          }),
        }
      );

      const deactivateBody = await expectSuccess(deactivateResponse, 200);
      expect(deactivateBody.data.region.isActive).toBe(false);
      expect(deactivateBody.data.auditLogId).toBeDefined();
    });
  });
});



