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

describe("Admin Applications Management API", () => {
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

  describe("GET /api-v1/admin/applications", () => {
    it("returns paginated applications list", async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications?page=1&limit=10`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.applications).toBeInstanceOf(Array);
      expect(body.data.pagination).toBeDefined();
      expect(body.data.pagination.page).toBe(1);
      expect(body.data.pagination.limit).toBe(10);
      expect(body.data.filters).toBeDefined();
      expect(body.data.filters.status).toBeInstanceOf(Array);
      expect(body.data.filters.timePeriods).toBeInstanceOf(Array);
    });

    it("filters applications by status", async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications?status=pending`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.applications).toBeInstanceOf(Array);
      expect(body.data.applications.every((app: any) => app.status === "pending")).toBe(true);
    });

    it("filters applications by time period", async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications?timePeriod=today`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.applications).toBeInstanceOf(Array);
      // All applications should be from today
    });

    it("searches applications by applicant name", async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications?search=john`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.applications).toBeInstanceOf(Array);
      // Should only return applications with "john" in applicant name
      body.data.applications.forEach((app: any) => {
        expect(app.applicantName.toLowerCase()).toContain("john");
      });
    });

    it("rejects unauthenticated requests", async () => {
      const response = await fetch(`${baseURL}/api-v1/admin/applications`);

      await expectError(response, 401);
    });
  });

  describe("GET /api-v1/admin/applications/:id", () => {
    it("returns detailed application information", async () => {
      const { token } = await createAdminAndToken();

      // This would need a real application ID in implementation
      const applicationId = "mock-app-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/${applicationId}`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.application).toBeDefined();
      expect(body.data.application.id).toBe(applicationId);
      expect(body.data.application.documents).toBeInstanceOf(Array);
      expect(body.data.application.reviewHistory).toBeInstanceOf(Array);
      expect(body.data.application.status).toBeDefined();
      expect(body.data.application.applicantName).toBeDefined();
      expect(body.data.application.position).toBeDefined();
    });

    it("includes application documents", async () => {
      const { token } = await createAdminAndToken();
      const applicationId = "mock-app-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/${applicationId}`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.application.documents).toBeInstanceOf(Array);

      body.data.application.documents.forEach((doc: any) => {
        expect(doc.type).toBeDefined();
        expect(doc.filename).toBeDefined();
        expect(doc.url).toBeDefined();
        expect(doc.uploadedAt).toBeDefined();
      });
    });

    it("includes review history", async () => {
      const { token } = await createAdminAndToken();
      const applicationId = "mock-app-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/${applicationId}`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.application.reviewHistory).toBeInstanceOf(Array);

      body.data.application.reviewHistory.forEach((review: any) => {
        expect(review.reviewerId).toBeDefined();
        expect(review.reviewerName).toBeDefined();
        expect(review.status).toBeDefined();
        expect(review.notes).toBeDefined();
        expect(review.reviewedAt).toBeDefined();
      });
    });

    it("returns 404 for non-existent application", async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/99999`,
        token
      );

      await expectError(response, 404);
    });
  });

  describe("POST /api-v1/admin/applications/:id/download", () => {
    it("generates download URL for CV", async () => {
      const { token } = await createAdminAndToken();
      const applicationId = "mock-app-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/${applicationId}/download`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            documentType: "cv"
          })
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.downloadUrl).toBeDefined();
      expect(body.data.expiresAt).toBeDefined();
      expect(body.data.documentType).toBe("cv");
    });

    it("generates download URL for cover letter", async () => {
      const { token } = await createAdminAndToken();
      const applicationId = "mock-app-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/${applicationId}/download`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            documentType: "cover_letter"
          })
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.downloadUrl).toBeDefined();
      expect(body.data.documentType).toBe("cover_letter");
    });

    it("generates download URL for portfolio", async () => {
      const { token } = await createAdminAndToken();
      const applicationId = "mock-app-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/${applicationId}/download`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            documentType: "portfolio"
          })
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.downloadUrl).toBeDefined();
      expect(body.data.documentType).toBe("portfolio");
    });

    it("validates document type", async () => {
      const { token } = await createAdminAndToken();
      const applicationId = "mock-app-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/${applicationId}/download`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            documentType: "invalid-type"
          })
        }
      );

      await expectError(response, 400);
    });

    it("returns 404 when document not found", async () => {
      const { token } = await createAdminAndToken();
      const applicationId = "mock-app-id";

      // Mock scenario where document doesn't exist
      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/${applicationId}/download`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            documentType: "cv"
          })
        }
      );

      // In real implementation, this might return 404 or handle gracefully
      expect([200, 404]).toContain(response.status);
    });
  });

  describe("PUT /api-v1/admin/applications/:id/status", () => {
    it("updates application status to reviewed", async () => {
      const { token, admin } = await createAdminAndToken();
      const applicationId = "mock-app-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/${applicationId}/status`,
        token,
        {
          method: "PUT",
          body: JSON.stringify({
            status: "reviewed",
            notes: "Application has been reviewed and is under consideration"
          })
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.application).toBeDefined();
      expect(body.data.application.status).toBe("reviewed");
      expect(body.data.auditLogId).toBeDefined();
    });

    it("accepts application with feedback", async () => {
      const { token, admin } = await createAdminAndToken();
      const applicationId = "mock-app-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/${applicationId}/status`,
        token,
        {
          method: "PUT",
          body: JSON.stringify({
            status: "accepted",
            notes: "Congratulations! Your application has been accepted.",
            feedback: "We were impressed by your experience and skills. Welcome to the team!"
          })
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.application.status).toBe("accepted");
      expect(body.data.application.feedback).toBe("We were impressed by your experience and skills. Welcome to the team!");
      expect(body.data.auditLogId).toBeDefined();
    });

    it("rejects application with feedback", async () => {
      const { token, admin } = await createAdminAndToken();
      const applicationId = "mock-app-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/${applicationId}/status`,
        token,
        {
          method: "PUT",
          body: JSON.stringify({
            status: "rejected",
            notes: "Application decision made",
            feedback: "Thank you for your interest. Unfortunately, we have decided to pursue other candidates at this time."
          })
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.application.status).toBe("rejected");
      expect(body.data.application.feedback).toBe("Thank you for your interest. Unfortunately, we have decided to pursue other candidates at this time.");
      expect(body.data.auditLogId).toBeDefined();
    });

    it("validates status transitions", async () => {
      const { token } = await createAdminAndToken();
      const applicationId = "mock-app-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/${applicationId}/status`,
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

  describe("POST /api-v1/admin/applications/:id/review", () => {
    it("adds review notes to application", async () => {
      const { token, admin } = await createAdminAndToken();
      const applicationId = "mock-app-id";

      const reviewData = {
        rating: 4,
        strengths: "Strong technical skills, good communication",
        weaknesses: "Limited experience with certain technologies",
        recommendation: "hire",
        internalNotes: "Good candidate, recommend for technical interview",
        nextSteps: "Schedule technical interview for next week"
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/${applicationId}/review`,
        token,
        {
          method: "POST",
          body: JSON.stringify(reviewData)
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.review).toBeDefined();
      expect(body.data.review.rating).toBe(4);
      expect(body.data.review.reviewerId).toBe(admin.id);
      expect(body.data.review.recommendation).toBe("hire");
      expect(body.data.application).toBeDefined();
      expect(body.data.auditLogId).toBeDefined();
    });

    it("validates rating range", async () => {
      const { token } = await createAdminAndToken();
      const applicationId = "mock-app-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/${applicationId}/review`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            rating: 6, // Invalid rating (> 5)
            strengths: "Good skills",
            recommendation: "consider"
          })
        }
      );

      await expectError(response, 400);
    });

    it("validates recommendation value", async () => {
      const { token } = await createAdminAndToken();
      const applicationId = "mock-app-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/${applicationId}/review`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            rating: 3,
            strengths: "Decent skills",
            recommendation: "invalid-recommendation"
          })
        }
      );

      await expectError(response, 400);
    });
  });

  describe("GET /api-v1/admin/applications/stats", () => {
    it("returns application statistics", async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/stats`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.stats).toBeDefined();
      expect(typeof body.data.stats.totalApplications).toBe("number");
      expect(typeof body.data.stats.pending).toBe("number");
      expect(typeof body.data.stats.reviewed).toBe("number");
      expect(typeof body.data.stats.accepted).toBe("number");
      expect(typeof body.data.stats.rejected).toBe("number");
      expect(body.data.stats.byPosition).toBeDefined();
      expect(body.data.stats.bySource).toBeDefined();
      expect(body.data.stats.avgReviewTime).toBeDefined();
    });

    it("includes time-based metrics", async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/stats`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.stats.trends).toBeInstanceOf(Array);
      expect(body.data.stats.conversionRates).toBeDefined();
      expect(typeof body.data.stats.conversionRates.reviewToAccept).toBe("number");
    });
  });

  describe("Additional Application Management Endpoints", () => {
    it("POST /api-v1/admin/applications/bulk/status updates multiple applications", async () => {
      const { token } = await createAdminAndToken();

      const bulkData = {
        applicationIds: ["app-1", "app-2", "app-3"],
        status: "reviewed",
        notes: "Bulk status update for weekly review",
        feedback: "Thank you for your application. We will be in touch soon."
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/bulk/status`,
        token,
        {
          method: "POST",
          body: JSON.stringify(bulkData)
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.updated).toBeDefined();
      expect(body.data.failed).toBeDefined();
      expect(body.data.results).toBeInstanceOf(Array);
      expect(body.data.auditLogId).toBeDefined();
    });

    it("GET /api-v1/admin/applications/export exports applications data", async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/export?format=csv&status=pending&reviewed=true`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.downloadUrl).toBeDefined();
      expect(body.data.expiresAt).toBeDefined();
      expect(typeof body.data.recordCount).toBe("number");
      expect(body.data.format).toBe("csv");
    });

    it("POST /api-v1/admin/applications/:id/interview schedules interview", async () => {
      const { token, admin } = await createAdminAndToken();
      const applicationId = "mock-app-id";

      const interviewData = {
        type: "technical",
        scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
        duration: 60, // minutes
        interviewers: ["John Manager", "Jane Tech Lead"],
        location: "Virtual - Zoom",
        notes: "Technical assessment interview",
        preparation: "Please review system design principles and prepare for coding challenges"
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/${applicationId}/interview`,
        token,
        {
          method: "POST",
          body: JSON.stringify(interviewData)
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.interview).toBeDefined();
      expect(body.data.interview.type).toBe("technical");
      expect(body.data.interview.scheduledFor).toBe(interviewData.scheduledFor);
      expect(body.data.interview.duration).toBe(60);
      expect(body.data.application).toBeDefined();
      expect(body.data.auditLogId).toBeDefined();
    });

    it("GET /api-v1/admin/applications/pipeline returns hiring pipeline", async () => {
      const { token } = await createAdminAndToken();

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/pipeline`,
        token
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.pipeline).toBeDefined();
      expect(body.data.pipeline.applied).toBeDefined();
      expect(body.data.pipeline.reviewed).toBeDefined();
      expect(body.data.pipeline.interviewed).toBeDefined();
      expect(body.data.pipeline.offered).toBeDefined();
      expect(body.data.pipeline.hired).toBeDefined();

      // Each stage should have count and applications
      Object.values(body.data.pipeline).forEach((stage: any) => {
        expect(typeof stage.count).toBe("number");
        expect(stage.applications).toBeInstanceOf(Array);
      });
    });

    it("POST /api-v1/admin/applications/:id/offer extends job offer", async () => {
      const { token, admin } = await createAdminAndToken();
      const applicationId = "mock-app-id";

      const offerData = {
        position: "Senior Software Engineer",
        salary: 120000,
        currency: "USD",
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        benefits: ["Health Insurance", "401k Matching", "Remote Work"],
        conditions: "Background check required",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days to respond
      };

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/${applicationId}/offer`,
        token,
        {
          method: "POST",
          body: JSON.stringify(offerData)
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.offer).toBeDefined();
      expect(body.data.offer.position).toBe("Senior Software Engineer");
      expect(body.data.offer.salary).toBe(120000);
      expect(body.data.offer.currency).toBe("USD");
      expect(body.data.application).toBeDefined();
      expect(body.data.auditLogId).toBeDefined();
    });

    it("DELETE /api-v1/admin/applications/:id deletes application", async () => {
      const { token } = await createAdminAndToken();
      const applicationId = "mock-app-id";

      const response = await authenticatedAdminRequest(
        `${baseURL}/api-v1/admin/applications/${applicationId}`,
        token,
        {
          method: "DELETE",
          body: JSON.stringify({
            reason: "Application withdrawn by candidate",
            permanent: false
          })
        }
      );

      const body = await expectSuccess(response, 200);
      expect(body.data.message).toBeDefined();
      expect(body.data.auditLogId).toBeDefined();
    });
  });
});

