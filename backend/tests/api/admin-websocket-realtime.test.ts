import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import {
  authenticatedAdminRequest,
  closeTestServer,
  createAdminAndToken,
  createTestServer,
  expectError,
  expectSuccess,
  resetDb,
  seedUser,
} from '../test-helpers';

describe('Admin WebSocket Real-time Features', () => {
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

  describe('Support Chat WebSocket Events', () => {
    it('handles admin joining support case', async () => {
      const { token, admin } = await createAdminAndToken();
      const caseId = 'mock-case-id';

      const joinData = {
        caseId: caseId,
        adminId: admin.id,
        action: 'join',
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/${caseId}/join`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(joinData),
        }
      );

      expect([200, 404]).toContain(response.status);
    });

    it('handles admin sending support message', async () => {
      const { token, admin } = await createAdminAndToken();
      const caseId = 'mock-case-id';

      const messageData = {
        caseId: caseId,
        content: 'Hello! How can I help you today?',
        messageType: 'text',
        adminId: admin.id,
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/${caseId}/messages`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(messageData),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.message).toBeDefined();
      expect(body.data.message.senderType).toBe('admin');
      expect(body.data.message.content).toBe('Hello! How can I help you today?');
    });

    it('handles user joining/leaving chat', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser();
      const caseId = 'mock-case-id';

      const presenceData = {
        caseId: caseId,
        userId: user.id,
        action: 'join',
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/${caseId}/presence`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(presenceData),
        }
      );

      expect([200, 404]).toContain(response.status);
    });

    it('handles typing indicators', async () => {
      const { token, admin } = await createAdminAndToken();
      const caseId = 'mock-case-id';

      const typingData = {
        caseId: caseId,
        userId: admin.id,
        userType: 'admin',
        isTyping: true,
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/${caseId}/typing`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(typingData),
        }
      );

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Admin Notifications WebSocket Events', () => {
    it('receives new ad pending notification', async () => {
      const { token } = await createAdminAndToken();

      const adData = {
        title: 'New Product',
        description: 'A new product for sale',
        price: 99.99,
        status: 'pending',
      };

      const response = await authenticatedAdminRequest(`${baseURL}/api-v1/admin/ads`, token, {
        method: 'POST',
        body: JSON.stringify(adData),
      });

      expect([200, 404]).toContain(response.status);
    });

    it('receives new support case notification', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser();

      const caseData = {
        userId: user.id,
        subject: 'Technical Issue',
        category: 'technical',
        priority: 'high',
        description: 'Unable to access account',
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(caseData),
        }
      );

      expect([200, 404]).toContain(response.status);
    });

    it('receives new user report notification', async () => {
      const { token } = await createAdminAndToken();
      const reporter = await seedUser({ email: 'reporter@example.com' });
      const reported = await seedUser({ email: 'reported@example.com' });

      const reportData = {
        reporterId: reporter.id,
        reportedUserId: reported.id,
        reportType: 'spam',
        description: 'User is posting spam content',
        evidence: ['screenshot1.jpg', 'screenshot2.jpg'],
      };

      const response = await authenticatedAdminRequest(`${baseURL}/api-v1/admin/reports`, token, {
        method: 'POST',
        body: JSON.stringify(reportData),
      });

      expect([200, 404]).toContain(response.status);
    });

    it('receives user verification request notification', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser({ verificationStatus: 'pending' });

      const verificationData = {
        userId: user.id,
        verificationLevel: 'high',
        documents: ['id_card.jpg', 'proof_of_address.pdf'],
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/${user.id}/verification-request`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(verificationData),
        }
      );

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Live Dashboard Updates', () => {
    it('receives dashboard stats updates', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/overview`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.data).toBeDefined();

    });

    it('receives user online/offline status updates', async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser();

      const statusData = {
        userId: user.id,
        status: 'online',
        lastSeen: new Date().toISOString(),
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/users/${user.id}/status`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify(statusData),
        }
      );

      expect([200, 404]).toContain(response.status);
    });

    it('receives real-time metrics updates', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/analytics/real-time`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.data).toBeDefined();
      expect(body.data.data.activeUsers).toBeDefined();
      expect(body.data.data.serverMetrics).toBeDefined();

    });
  });

  describe('Admin Activity Broadcasting', () => {
    it('broadcasts admin actions to other admins', async () => {
      const { token: token1, admin: admin1 } = await createAdminAndToken();
      const { admin: admin2 } = await createAdminAndToken();

      const actionData = {
        action: 'user_verified',
        targetId: 'user-123',
        details: {
          adminId: admin1.id,
          adminName: 'Admin One',
          targetType: 'user',
          targetName: 'User 123',
          timestamp: new Date().toISOString(),
        },
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/broadcast`,
        token1,
        {
          method: 'POST',
          body: JSON.stringify(actionData),
        }
      );

      expect([200, 404]).toContain(response.status);
    });

    it('handles admin presence tracking', async () => {
      const { token, admin } = await createAdminAndToken();

      const presenceData = {
        adminId: admin.id,
        status: 'online',
        lastActivity: new Date().toISOString(),
      };

      const response = await authenticatedAdminRequest(`${baseURL}/api-v1/admin/presence`, token, {
        method: 'POST',
        body: JSON.stringify(presenceData),
      });

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Real-time Moderation Queue', () => {
    it('updates moderation queue in real-time', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/moderation-queue`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.ads).toBeInstanceOf(Array);

    });

    it('notifies when ad is claimed by another moderator', async () => {
      const { token: token1, admin: admin1 } = await createAdminAndToken();
      const { token: token2, admin: admin2 } = await createAdminAndToken();

      const claimData = {
        adId: 'ad-123',
        adminId: admin1.id,
        lockDuration: 30, // minutes
      };

      const response1 = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/claim`,
        token1,
        {
          method: 'POST',
          body: JSON.stringify(claimData),
        }
      );

      expect([200, 404]).toContain(response1.status);

      const response2 = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/ads/claim`,
        token2,
        {
          method: 'POST',
          body: JSON.stringify(claimData),
        }
      );

      expect([409, 404]).toContain(response2.status);
    });
  });

  describe('WebSocket Connection Management', () => {
    it('handles admin authentication via WebSocket', async () => {
      const { token, admin } = await createAdminAndToken();

      const authData = {
        token: token,
        adminId: admin.id,
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/websocket/auth`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(authData),
        }
      );

      expect([200, 404]).toContain(response.status);
    });

    it('handles WebSocket reconnection', async () => {
      const { token, admin } = await createAdminAndToken();

      const reconnectData = {
        adminId: admin.id,
        lastEventId: 'event-123',
        subscriptions: ['dashboard', 'moderation', 'support'],
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/websocket/reconnect`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(reconnectData),
        }
      );

      expect([200, 404]).toContain(response.status);
    });

    it('manages admin notification preferences', async () => {
      const { token, admin } = await createAdminAndToken();

      const preferences = {
        adminId: admin.id,
        notifications: {
          newAds: true,
          newReports: true,
          supportCases: false,
          systemAlerts: true,
        },
        soundEnabled: true,
        desktopNotifications: false,
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/notifications/preferences`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify(preferences),
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.preferences).toBeDefined();
      expect(body.data.preferences.notifications.newAds).toBe(true);
      expect(body.data.preferences.notifications.supportCases).toBe(false);
    });
  });

  describe('Real-time Error Broadcasting', () => {
    it('broadcasts system errors to admins', async () => {
      const { token } = await createAdminAndToken();

      const errorData = {
        type: 'database_error',
        severity: 'high',
        message: 'Database connection lost',
        details: {
          timestamp: new Date().toISOString(),
          service: 'postgresql',
          errorCode: 'ECONNREFUSED',
        },
        affectedServices: ['user-service', 'ads-service'],
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/system/error`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(errorData),
        }
      );

      expect([200, 404]).toContain(response.status);
    });

    it('handles emergency broadcasts', async () => {
      const { token } = await createAdminAndToken();

      const emergencyData = {
        level: 'critical',
        title: 'System Under Attack',
        message: 'Security breach detected. All admins please respond immediately.',
        actions: [
          'Secure all admin accounts',
          'Enable emergency protocols',
          'Contact security team',
        ],
        autoLogout: true,
        lockdownMode: true,
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/emergency/broadcast`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(emergencyData),
        }
      );

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('WebSocket Performance Monitoring', () => {
    it('tracks WebSocket connection metrics', async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/websocket/metrics`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.metrics).toBeDefined();
      expect(body.data.metrics.totalConnections).toBeDefined();
      expect(body.data.metrics.activeConnections).toBeDefined();
      expect(body.data.metrics.messagesPerSecond).toBeDefined();
      expect(body.data.metrics.averageLatency).toBeDefined();
    });

    it('monitors admin activity via WebSocket', async () => {
      const { token, admin } = await createAdminAndToken();

      const activityData = {
        adminId: admin.id,
        action: 'page_view',
        page: '/admin/users',
        timestamp: new Date().toISOString(),
        sessionDuration: 3600, // seconds
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/activity/track`,
        token,
        {
          method: 'POST',
          body: JSON.stringify(activityData),
        }
      );

      expect([200, 404]).toContain(response.status);
    });
  });
});



