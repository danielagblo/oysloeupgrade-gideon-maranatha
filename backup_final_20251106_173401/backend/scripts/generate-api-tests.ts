import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";

interface OpenAPISpec {
  security?: any[];
  paths: {
    [path: string]: {
      [method: string]: {
        tags?: string[];
        summary?: string;
        security?: any[];
        parameters?: any[];
        responses: {
          [status: string]: any;
        };
      };
    };
  };
}

interface EndpointInfo {
  path: string;
  method: string;
  tags: string[];
  summary: string;
  requiresAuth: boolean;
  expectedStatuses: string[];
}

async function generateAPITests() {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const specDir = path.join(__dirname, "..", "spec");
    const yamlPath = path.join(specDir, "openapi.yaml");
    const jsonPath = path.join(specDir, "openapi.json");
    let spec: OpenAPISpec;
    if (fs.existsSync(yamlPath)) {
      spec = yaml.load(fs.readFileSync(yamlPath, "utf8")) as OpenAPISpec;
    } else if (fs.existsSync(jsonPath)) {
      spec = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as OpenAPISpec;
    } else {
      throw new Error(`OpenAPI spec not found in ${specDir}`);
    }

    const endpoints: EndpointInfo[] = [];

    for (const [path, pathObj] of Object.entries(spec.paths)) {
      for (const [method, methodObj] of Object.entries(pathObj)) {
        if (method.startsWith("x-")) continue;

        const opSecurity = Array.isArray(methodObj.security)
          ? methodObj.security
          : [];
        const globalSecurity = Array.isArray(spec.security)
          ? spec.security
          : [];
        const effectiveSecurity = opSecurity.length
          ? opSecurity
          : globalSecurity;
        const endpoint: EndpointInfo = {
          path: path,
          method: method.toUpperCase(),
          tags: methodObj.tags || [],
          summary: methodObj.summary || "",
          requiresAuth: effectiveSecurity.some(
            (s) => Object.keys(s).length > 0
          ),
          expectedStatuses: Object.keys(methodObj.responses),
        };

        endpoints.push(endpoint);
      }
    }

    const groupedEndpoints = groupEndpointsByTag(endpoints);

    console.log(" API Test Generation Summary");
    console.log("================================\n");

    console.log(` **Total Endpoints**: ${endpoints.length}`);
    console.log(
      ` **Require Auth**: ${endpoints.filter((e) => e.requiresAuth).length}`
    );
    console.log(
      ` **Public**: ${endpoints.filter((e) => !e.requiresAuth).length}\n`
    );

    console.log(" **Endpoint Groups**:");
    for (const [tag, tagEndpoints] of Object.entries(groupedEndpoints)) {
      console.log(`  ${tag}: ${tagEndpoints.length} endpoints`);
    }

    console.log("\n **Recommended Test Files to Create**:");
    for (const tag of Object.keys(groupedEndpoints)) {
      const filename = `tests/api/${tag
        .toLowerCase()
        .replace(/\s+/g, "-")}.simple.test.ts`;
      const exists = fs.existsSync(path.join(__dirname, "..", filename));
      console.log(`  ${exists ? "[exists]" : "[new]"} ${filename}`);
    }

    console.log("\n **Sample Test Structure**:");
    console.log(generateSampleTest(groupedEndpoints["Wallet"] || [], "Wallet"));

    return groupedEndpoints;
  } catch (error) {
    console.error("Error generating API tests:", error);
  }
}

function groupEndpointsByTag(endpoints: EndpointInfo[]): {
  [tag: string]: EndpointInfo[];
} {
  const grouped: { [tag: string]: EndpointInfo[] } = {};

  for (const endpoint of endpoints) {
    const tag = endpoint.tags[0] || "Other";
    if (!grouped[tag]) {
      grouped[tag] = [];
    }
    grouped[tag].push(endpoint);
  }

  return grouped;
}

function generateSampleTest(endpoints: EndpointInfo[], tag: string): string {
  if (endpoints.length === 0) return "";

  const authEndpoints = endpoints.filter((e) => e.requiresAuth);
  const publicEndpoints = endpoints.filter((e) => !e.requiresAuth);



import request from "supertest";
import { createApp } from "@/app";

describe("${tag} API Endpoints", () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });\n\n`;

  if (publicEndpoints.length > 0) {
    testCode += `  describe("Public Endpoints", () => {\n`;
    for (const endpoint of publicEndpoints.slice(0, 2)) {
      testCode += `    it("${endpoint.method} ${endpoint.path} - ${
        endpoint.summary || "should work without auth"
      }", async () => {
      const response = await request(app)
        .${endpoint.method.toLowerCase()}("${endpoint.path}")
        .expect((res) => {
          expect([${endpoint.expectedStatuses.join(
            ", "
          )}]).toContain(res.status);
        });
    });\n\n`;
    }
    testCode += `  });\n\n`;
  }

  if (authEndpoints.length > 0) {
    testCode += `  describe("Protected Endpoints", () => {\n`;
    for (const endpoint of authEndpoints.slice(0, 2)) {
      testCode += `    it("${endpoint.method} ${
        endpoint.path
      } - should require authentication", async () => {
      const response = await request(app)
        .${endpoint.method.toLowerCase()}("${endpoint.path}")
        .expect(401);

      expect(response.body).toHaveProperty("success", false);
    });\n\n`;
    }
    testCode += `  });\n`;
  }

  testCode += `});`;

  return testCode;
}

if ((import.meta as any).main) {
  generateAPITests();
}

export { generateAPITests };
