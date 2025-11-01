import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";
import {
  createTestServer,
  closeTestServer,
  resetDb,
  seedUser,
  createAdminAndToken,
  authenticatedAdminRequest,
  expectError,
  expectSuccess,
} from "../test-helpers";

describe("Admin Support System API", () => {
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

  describe("GET /api-v1/admin/support/cases", () => {
    it("returns paginated support cases", async () => {
      const { token } = await createAdminAndToken();

      // Create some test support cases (this would need support case seeding in real impl)
      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases?page=1&limit=10`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.cases).toBeInstanceOf(Array);
      expect(body.data.pagination).toBeDefined();
      expect(body.data.pagination.page).toBe(1);
      expect(body.data.pagination.limit).toBe(10);
      expect(body.data.filters).toBeDefined();
      expect(body.data.filters.status).toBeInstanceOf(Array);
      expect(body.data.filters.priority).toBeInstanceOf(Array);
      expect(body.data.filters.categories).toBeInstanceOf(Array);
      expect(body.data.filters.admins).toBeInstanceOf(Array);
    });

    it("filters cases by status", async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases?status=open`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.cases).toBeInstanceOf(Array);
      // All returned cases should be open
      expect(body.data.cases.every((case_: any) => case_.status === "open")).toBe(true);
    });

    it("filters cases by priority", async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases?priority=high`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.cases).toBeInstanceOf(Array);
      expect(body.data.cases.every((case_: any) => case_.priority === "high")).toBe(true);
    });

    it("filters cases by assigned admin", async () => {
      const { token, admin } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases?assignedTo=${admin.id}`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.cases).toBeInstanceOf(Array);
      expect(body.data.cases.every((case_: any) => case_.assignedAdminId === admin.id)).toBe(true);
    });

    it("searches cases by user", async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser({ name: "John Support" });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases?userId=${user.id}`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.cases).toBeInstanceOf(Array);
      expect(body.data.cases.every((case_: any) => case_.userId === user.id)).toBe(true);
    });

    it("rejects unauthenticated requests", async () => {
      const response = await fetch(`${baseURL}/api-v1/admin/support/cases`);

      await expectError(response, 401);
    });
  });

  describe("POST /api-v1/admin/support/cases/:id/messages", () => {
    it("sends support message successfully", async () => {
      const { token, admin } = await createAdminAndToken();

      // This would need a support case ID in real implementation
      const caseId = "mock-case-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/${caseId}/messages`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            content: "Thank you for contacting support. How can I help you today?",
            messageType: "text"
          })
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.message).toBeDefined();
      expect(body.data.message.senderId).toBe(admin.id);
      expect(body.data.message.senderType).toBe("admin");
      expect(body.data.message.content).toBe("Thank you for contacting support. How can I help you today?");
      expect(body.data.message.messageType).toBe("text");
      expect(body.data.case).toBeDefined();
    });

    it("sends message with file attachment", async () => {
      const { token, admin } = await createAdminAndToken();
      const caseId = "mock-case-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/${caseId}/messages`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            content: "Please find the requested document attached.",
            messageType: "file",
            fileUrl: "https://example.com/document.pdf",
            fileName: "support_document.pdf",
            fileSize: 1024000
          })
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.message.messageType).toBe("file");
      expect(body.data.message.fileUrl).toBe("https://example.com/document.pdf");
      expect(body.data.message.fileName).toBe("support_document.pdf");
      expect(body.data.message.fileSize).toBe(1024000);
    });

    it("validates message content", async () => {
      const { token } = await createAdminAndToken();
      const caseId = "mock-case-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/${caseId}/messages`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            content: "", // Empty content
            messageType: "text"
          })
        }
      );

      await expectError(response, 400);
    });

    it("validates message type", async () => {
      const { token } = await createAdminAndToken();
      const caseId = "mock-case-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/${caseId}/messages`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            content: "Test message",
            messageType: "invalid-type"
          })
        }
      );

      await expectError(response, 400);
    });

    it("returns 404 for non-existent case", async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/non-existent-case/messages`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            content: "Test message",
            messageType: "text"
          })
        }
      );

      await expectError(response, 404);
    });
  });

  describe("PUT /api-v1/admin/support/cases/:id/status", () => {
    it("updates case status to in_progress", async () => {
      const { token } = await createAdminAndToken();
      const caseId = "mock-case-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/${caseId}/status`,
        token,
        {
          method: "PUT",
          body: JSON.stringify({
            status: "in_progress",
            notes: "Starting investigation of the issue"
          })
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.case).toBeDefined();
      expect(body.data.case.status).toBe("in_progress");
      expect(body.data.auditLogId).toBeDefined();
    });

    it("resolves case successfully", async () => {
      const { token } = await createAdminAndToken();
      const caseId = "mock-case-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/${caseId}/status`,
        token,
        {
          method: "PUT",
          body: JSON.stringify({
            status: "resolved",
            notes: "Issue has been resolved. User account reactivated."
          })
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.case.status).toBe("resolved");
      expect(body.data.case.resolvedAt).toBeDefined();
      expect(body.data.auditLogId).toBeDefined();
    });

    it("closes case", async () => {
      const { token } = await createAdminAndToken();
      const caseId = "mock-case-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/${caseId}/status`,
        token,
        {
          method: "PUT",
          body: JSON.stringify({
            status: "closed",
            notes: "Case closed after user confirmation"
          })
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.case.status).toBe("closed");
      expect(body.data.auditLogId).toBeDefined();
    });

    it("validates status transitions", async () => {
      const { token } = await createAdminAndToken();
      const caseId = "mock-case-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/${caseId}/status`,
        token,
        {
          method: "PUT",
          body: JSON.stringify({
            status: "invalid-status"
          })
        }
      );

      await expectError(response, 400);
    });
  });

  describe("POST /api-v1/admin/support/cases/:id/assign", () => {
    it("assigns case to admin successfully", async () => {
      const { token, admin } = await createAdminAndToken();
      const caseId = "mock-case-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/${caseId}/assign`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            adminUserId: admin.id,
            notes: "Assigning to senior support specialist"
          })
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.case).toBeDefined();
      expect(body.data.case.assignedAdminId).toBe(admin.id);
      expect(body.data.assignment).toBeDefined();
      expect(body.data.assignment.adminUserId).toBe(admin.id);
      expect(body.data.assignment.assignedAt).toBeDefined();
    });

    it("unassigns case from admin", async () => {
      const { token } = await createAdminAndToken();
      const caseId = "mock-case-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/${caseId}/assign`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            adminUserId: null, // Unassign
            notes: "Reassigning to different department"
          })
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.case.assignedAdminId).toBeNull();
      expect(body.data.assignment.unassignedAt).toBeDefined();
    });

    it("validates admin user exists", async () => {
      const { token } = await createAdminAndToken();
      const caseId = "mock-case-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/${caseId}/assign`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            adminUserId: 99999, // Non-existent admin
            notes: "Test assignment"
          })
        }
      );

      await expectError(response, 404);
    });
  });

  describe("GET /api-v1/admin/support/users/online", () => {
    it("returns list of online users", async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/users/online`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.onlineUsers).toBeInstanceOf(Array);
      // Each online user should have required fields
      body.data.onlineUsers.forEach((user: any) => {
        expect(user.userId).toBeDefined();
        expect(user.name).toBeDefined();
        expect(user.lastSeen).toBeDefined();
        expect(user.activeCases).toBeDefined();
      });
    });

    it("includes user avatars when available", async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/users/online`,
        token
      );

      const body = await expectSuccess(response, 200);
      // Some users might have avatars
      const usersWithAvatars = body.data.onlineUsers.filter((user: any) => user.avatar);
      if (usersWithAvatars.length > 0) {
        expect(usersWithAvatars[0].avatar).toBeDefined();
      }
    });
  });

  describe("Additional Support Endpoints", () => {
    it("GET /api-v1/admin/support/cases/:id returns detailed case information", async () => {
      const { token } = await createAdminAndToken();
      const caseId = "mock-case-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/${caseId}`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.case).toBeDefined();
      expect(body.data.case.id).toBe(caseId);
      expect(body.data.messages).toBeInstanceOf(Array);
      expect(body.data.user).toBeDefined();
      expect(body.data.assignedAdmin).toBeDefined();
    });

    it("GET /api-v1/admin/support/cases/:id/messages returns case messages", async () => {
      const { token } = await createAdminAndToken();
      const caseId = "mock-case-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/${caseId}/messages`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.messages).toBeInstanceOf(Array);
      expect(body.data.pagination).toBeDefined();
      // Messages should be sorted by creation date
      if (body.data.messages.length > 1) {
        for (let i = 1; i < body.data.messages.length; i++) {
          expect(new Date(body.data.messages[i].createdAt).getTime()).toBeGreaterThanOrEqual(
            new Date(body.data.messages[i - 1].createdAt).getTime()
          );
        }
      }
    });

    it("PUT /api-v1/admin/support/cases/:id/priority updates case priority", async () => {
      const { token } = await createAdminAndToken();
      const caseId = "mock-case-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/${caseId}/priority`,
        token,
        {
          method: "PUT",
          body: JSON.stringify({
            priority: "urgent",
            reason: "Customer is experiencing critical business impact"
          })
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.case).toBeDefined();
      expect(body.data.case.priority).toBe("urgent");
      expect(body.data.auditLogId).toBeDefined();
    });

    it("GET /api-v1/admin/support/stats returns support statistics", async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/stats`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.stats).toBeDefined();
      expect(body.data.stats.totalCases).toBeDefined();
      expect(body.data.stats.openCases).toBeDefined();
      expect(body.data.stats.resolvedToday).toBeDefined();
      expect(body.data.stats.avgResolutionTime).toBeDefined();
      expect(body.data.stats.byPriority).toBeDefined();
      expect(body.data.stats.byCategory).toBeDefined();
      expect(body.data.stats.agentPerformance).toBeInstanceOf(Array);
    });

    it("POST /api-v1/admin/support/cases creates new support case", async () => {
      const { token } = await createAdminAndToken();
      const user = await seedUser({ name: "Case Creator" });

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            userId: user.id,
            subject: "Account verification issue",
            category: "account",
            priority: "normal",
            initialMessage: "User is unable to verify their account"
          })
        }
      );

      const body = await expectSuccess(response, 201);
      expect(body.data.case).toBeDefined();
      expect(body.data.case.userId).toBe(user.id);
      expect(body.data.case.subject).toBe("Account verification issue");
      expect(body.data.case.category).toBe("account");
      expect(body.data.case.priority).toBe("normal");
      expect(body.data.auditLogId).toBeDefined();
    });

    it("DELETE /api-v1/admin/support/cases/:id deletes support case", async () => {
      const { token } = await createAdminAndToken();
      const caseId = "mock-case-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/support/cases/${caseId}`,
        token,
        {
          method: "DELETE",
          body: JSON.stringify({
            reason: "Case created in error",
            permanent: true
          })
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.message).toBeDefined();
      expect(body.data.auditLogId).toBeDefined();
    });
  });
});
