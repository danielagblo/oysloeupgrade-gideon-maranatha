import { describe, it, expect } from "bun:test";

const userSchema = {
  type: "object",
  required: ["email", "password"],
  properties: {
    email: {
      type: "string",
      format: "email",
    },
    password: {
      type: "string",
      minLength: 8,
    },
    firstName: {
      type: "string",
      minLength: 1,
    },
    lastName: {
      type: "string",
      minLength: 1,
    },
  },
};

const productSchema = {
  type: "object",
  required: ["name", "price"],
  properties: {
    name: {
      type: "string",
      minLength: 1,
    },
    price: {
      type: "number",
      minimum: 0,
    },
    description: {
      type: "string",
    },
    category: {
      type: "string",
    },
  },
};

interface ValidationRule {
  type?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
}

interface ValidationSchema {
  required?: string[];
  properties?: Record<string, ValidationRule>;
}

function validateSchema(
  data: Record<string, unknown>,
  schema: ValidationSchema
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (schema.required) {
    for (const field of schema.required) {
      if (
        data[field] === undefined ||
        data[field] === null ||
        data[field] === ""
      ) {
        errors.push(`${field} is required`);
      }
    }
  }

  if (schema.properties) {
    for (const [field, rules] of Object.entries(schema.properties)) {
      const value = data[field];
      const rule = rules;

      if (value !== undefined) {
        if (rule.type === "string" && typeof value !== "string") {
          errors.push(`${field} must be a string`);
        }
        if (rule.type === "number" && typeof value !== "number") {
          errors.push(`${field} must be a number`);
        }

        if (rule.type === "string") {
          if (rule.minLength && value.length < rule.minLength) {
            errors.push(
              `${field} must be at least ${rule.minLength} characters long`
            );
          }
        }

        if (rule.type === "number") {
          if (rule.minimum !== undefined && value < rule.minimum) {
            errors.push(`${field} must be at least ${rule.minimum}`);
          }
        }

        if (rule.format === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(`${field} must be a valid email address`);
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

describe("Validation Middleware", () => {
  describe("user schema validation", () => {
    it("validates correct user data", () => {
      const validUser = {
        email: "test@example.com",
        password: "SecurePass123!",
        firstName: "John",
        lastName: "Doe",
      };

      const result = validateSchema(validUser, userSchema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("rejects missing required fields", () => {
      const invalidUser = {
        firstName: "John",
        lastName: "Doe",
      };

      const result = validateSchema(invalidUser, userSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("email is required");
      expect(result.errors).toContain("password is required");
    });

    it("validates email format", () => {
      const invalidUser = {
        email: "invalid-email",
        password: "SecurePass123!",
        firstName: "John",
        lastName: "Doe",
      };

      const result = validateSchema(invalidUser, userSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("email must be a valid email address");
    });

    it("validates password minimum length", () => {
      const invalidUser = {
        email: "test@example.com",
        password: "123",
        firstName: "John",
        lastName: "Doe",
      };

      const result = validateSchema(invalidUser, userSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "password must be at least 8 characters long"
      );
    });

    it("validates firstName minimum length", () => {
      const invalidUser = {
        email: "test@example.com",
        password: "SecurePass123!",
        firstName: "",
        lastName: "Doe",
      };

      const result = validateSchema(invalidUser, userSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "firstName must be at least 1 characters long"
      );
    });

    it("validates field types", () => {
      const invalidUser = {
        email: "test@example.com",
        password: "SecurePass123!",
        firstName: 123,
        lastName: "Doe",
      };

      const result = validateSchema(invalidUser, userSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("firstName must be a string");
    });
  });

  describe("product schema validation", () => {
    it("validates correct product data", () => {
      const validProduct = {
        name: "Test Product",
        price: 29.99,
        description: "A test product",
        category: "Electronics",
      };

      const result = validateSchema(validProduct, productSchema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("rejects missing required fields", () => {
      const invalidProduct = {
        description: "A test product",
      };

      const result = validateSchema(invalidProduct, productSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("name is required");
      expect(result.errors).toContain("price is required");
    });

    it("validates price is non-negative", () => {
      const invalidProduct = {
        name: "Test Product",
        price: -10,
        description: "A test product",
      };

      const result = validateSchema(invalidProduct, productSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("price must be at least 0");
    });

    it("validates name is not empty", () => {
      const invalidProduct = {
        name: "",
        price: 29.99,
        description: "A test product",
      };

      const result = validateSchema(invalidProduct, productSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "name must be at least 1 characters long"
      );
    });

    it("validates price is a number", () => {
      const invalidProduct = {
        name: "Test Product",
        price: "29.99",
        description: "A test product",
      };

      const result = validateSchema(invalidProduct, productSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("price must be a number");
    });
  });

  describe("error formatting", () => {
    it("formats validation errors correctly", () => {
      const invalidData = {
        email: "invalid",
        password: "123",
      };

      const result = validateSchema(invalidData, userSchema);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      result.errors.forEach((error) => {
        expect(typeof error).toBe("string");
        expect(error.length).toBeGreaterThan(0);
      });
    });

    it("provides specific error messages", () => {
      const invalidData = {
        email: "not-an-email",
        password: "short",
      };

      const result = validateSchema(invalidData, userSchema);

      expect(result.errors).toContain("email must be a valid email address");
      expect(result.errors).toContain(
        "password must be at least 8 characters long"
      );
    });

    it("handles multiple validation errors", () => {
      const invalidData = {
        email: "invalid",
        password: "123",
        firstName: 123,
        lastName: "",
      };

      const result = validateSchema(invalidData, userSchema);

      expect(result.errors.length).toBeGreaterThanOrEqual(4);
      expect(result.errors).toContain("email must be a valid email address");
      expect(result.errors).toContain(
        "password must be at least 8 characters long"
      );
      expect(result.errors).toContain("firstName must be a string");
      expect(result.errors).toContain(
        "lastName must be at least 1 characters long"
      );
    });
  });

  describe("edge cases", () => {
    it("handles null values", () => {
      const dataWithNull = {
        email: null,
        password: "SecurePass123!",
      };

      const result = validateSchema(dataWithNull, userSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("email is required");
    });

    it("handles undefined values", () => {
      const dataWithUndefined = {
        email: undefined,
        password: "SecurePass123!",
      };

      const result = validateSchema(dataWithUndefined, userSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("email is required");
    });

    it("handles empty string values", () => {
      const dataWithEmpty = {
        email: "",
        password: "SecurePass123!",
      };

      const result = validateSchema(dataWithEmpty, userSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("email is required");
    });

    it("handles extra fields gracefully", () => {
      const dataWithExtra = {
        email: "test@example.com",
        password: "SecurePass123!",
        firstName: "John",
        lastName: "Doe",
        extraField: "should be ignored",
      };

      const result = validateSchema(dataWithExtra, userSchema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});
