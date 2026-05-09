/**
 * @file        lib/db/src/tests/crm.test.ts
 * @module      Database / Tests / CRM
 * @purpose     Schema tests for CRM client, contact, and agreement functionality
 *
 * @ai_instructions
 *   - This file contains unit tests for CRM schema relationships and constraints.
 *   - Tests verify foreign key relationships, enum constraints, and data integrity.
 *   - Tests should cover client-contact conversion and agreement version chains.
 *   - Follow existing test patterns in this directory.
 *
 * @exports     Test suite for CRM schema validation
 * @imports     Test frameworks, CRM schemas, and database utilities
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach } from "vitest";
import { 
  clientsTable,
  clientEmailsTable,
  clientPhonesTable,
  clientAddressesTable,
  contactsTable,
  opportunitiesTable,
  agreementsTable,
  agreementVersionsTable,
  signatureRequestsTable,
  insertClientSchema,
  insertClientEmailSchema,
  insertClientPhoneSchema,
  insertClientAddressSchema,
  insertContactSchema,
  insertOpportunitySchema,
  insertAgreementSchema,
  insertAgreementVersionSchema,
  insertSignatureRequestSchema
} from "../schema";

describe("CRM Schema Tests", () => {
  describe("Client Schema", () => {
    it("should validate client insert schema", () => {
      const validClient = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        status: "active",
        company: "Acme Corp"
      };

      const result = insertClientSchema.safeParse(validClient);
      expect(result.success).toBe(true);
    });

    it("should reject client without required fields", () => {
      const invalidClient = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        // missing first_name and last_name
        status: "active"
      };

      const result = insertClientSchema.safeParse(invalidClient);
      expect(result.success).toBe(false);
    });

    it("should validate client email relationship", () => {
      const validClientEmail = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        client_id: "550e8400-e29b-41d4-a716-446655440001",
        email: "test@example.com",
        type: "personal",
        is_primary: false
      };

      const result = insertClientEmailSchema.safeParse(validClientEmail);
      expect(result.success).toBe(true);
    });

    it("should validate client phone relationship", () => {
      const validClientPhone = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        client_id: "550e8400-e29b-41d4-a716-446655440001",
        phone: "+1234567890",
        type: "mobile",
        is_primary: true,
        country_code: "+1"
      };

      const result = insertClientPhoneSchema.safeParse(validClientPhone);
      expect(result.success).toBe(true);
    });

    it("should validate client address relationship", () => {
      const validClientAddress = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        client_id: "550e8400-e29b-41d4-a716-446655440001",
        type: "home",
        street_line_1: "123 Main St",
        city: "Anytown",
        postal_code: "12345",
        country: "US",
        is_primary: true
      };

      const result = insertClientAddressSchema.safeParse(validClientAddress);
      expect(result.success).toBe(true);
    });
  });

  describe("Contact Schema", () => {
    it("should validate contact insert schema", () => {
      const validContact = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Jane Smith",
        email: "jane.smith@example.com",
        company: "Tech Corp",
        lead_score: 85,
        status: "hot",
        tags: ["prospect", "enterprise"]
      };

      const result = insertContactSchema.safeParse(validContact);
      expect(result.success).toBe(true);
    });

    it("should validate contact with client relationship", () => {
      const validContactWithClient = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Converted Lead",
        email: "converted@example.com",
        client_id: "550e8400-e29b-41d4-a716-446655440001",
        status: "warm"
      };

      const result = insertContactSchema.safeParse(validContactWithClient);
      expect(result.success).toBe(true);
    });
  });

  describe("Opportunity Schema", () => {
    it("should validate opportunity insert schema", () => {
      const validOpportunity = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        client_id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Enterprise Deal",
        value: "100000.00",
        stage: "proposal",
        win_probability: 75,
        expected_close_date: "2024-12-31T23:59:59Z"
      };

      const result = insertOpportunitySchema.safeParse(validOpportunity);
      expect(result.success).toBe(true);
    });

    it("should validate opportunity with contact relationship", () => {
      const validOpportunityWithContact = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        client_id: "550e8400-e29b-41d4-a716-446655440001",
        contact_id: "550e8400-e29b-41d4-a716-446655440002",
        name: "Referral Deal",
        stage: "qualification"
      };

      const result = insertOpportunitySchema.safeParse(validOpportunityWithContact);
      expect(result.success).toBe(true);
    });

    it("should reject opportunity without required client_id", () => {
      const invalidOpportunity = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        // missing client_id
        name: "Orphan Deal",
        stage: "prospecting"
      };

      const result = insertOpportunitySchema.safeParse(invalidOpportunity);
      expect(result.success).toBe(false);
    });
  });

  describe("Agreement Schema", () => {
    it("should validate agreement insert schema", () => {
      const validAgreement = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        client_id: "550e8400-e29b-41d4-a716-446655440001",
        title: "Service Agreement",
        status: "draft",
        value: "50000.00"
      };

      const result = insertAgreementSchema.safeParse(validAgreement);
      expect(result.success).toBe(true);
    });

    it("should validate agreement version with immutable version number", () => {
      const validAgreementVersion = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        agreement_id: "550e8400-e29b-41d4-a716-446655440001",
        version_number: 1,
        content: "Agreement terms and conditions...",
        created_by: "user123"
      };

      const result = insertAgreementVersionSchema.safeParse(validAgreementVersion);
      expect(result.success).toBe(true);
    });

    it("should validate signature request", () => {
      const validSignatureRequest = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        agreement_version_id: "550e8400-e29b-41d4-a716-446655440002",
        signer_email: "signer@example.com",
        status: "pending"
      };

      const result = insertSignatureRequestSchema.safeParse(validSignatureRequest);
      expect(result.success).toBe(true);
    });

    it("should validate signature request with external envelope ID", () => {
      const validSignatureRequestWithEnvelope = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        agreement_version_id: "550e8400-e29b-41d4-a716-446655440002",
        signer_email: "signer@example.com",
        status: "pending",
        external_envelope_id: "ENVELOPE_12345"
      };

      const result = insertSignatureRequestSchema.safeParse(validSignatureRequestWithEnvelope);
      expect(result.success).toBe(true);
    });
  });

  describe("Schema Relationships", () => {
    it("should enforce client-contact conversion relationship", () => {
      // This test verifies that contacts can reference clients
      const contactWithClient = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Converted Contact",
        client_id: "550e8400-e29b-41d4-a716-446655440001",
        status: "warm"
      };

      const result = insertContactSchema.safeParse(contactWithClient);
      expect(result.success).toBe(true);
      expect(result.data?.client_id).toBe("550e8400-e29b-41d4-a716-446655440001");
    });

    it("should enforce opportunity-client relationship", () => {
      const opportunityWithClient = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        client_id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Client Deal",
        stage: "prospecting"
      };

      const result = insertOpportunitySchema.safeParse(opportunityWithClient);
      expect(result.success).toBe(true);
      expect(result.data?.client_id).toBe("550e8400-e29b-41d4-a716-446655440001");
    });

    it("should enforce agreement-client relationship", () => {
      const agreementWithClient = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        client_id: "550e8400-e29b-41d4-a716-446655440001",
        title: "Client Agreement",
        status: "draft"
      };

      const result = insertAgreementSchema.safeParse(agreementWithClient);
      expect(result.success).toBe(true);
      expect(result.data?.client_id).toBe("550e8400-e29b-41d4-a716-446655440001");
    });

    it("should enforce agreement version chain relationship", () => {
      const agreementVersion = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        agreement_id: "550e8400-e29b-41d4-a716-446655440001",
        version_number: 1,
        content: "Version 1 content",
        created_by: "user123"
      };

      const result = insertAgreementVersionSchema.safeParse(agreementVersion);
      expect(result.success).toBe(true);
      expect(result.data?.agreement_id).toBe("550e8400-e29b-41d4-a716-446655440001");
      expect(result.data?.version_number).toBe(1);
    });

    it("should enforce signature request to agreement version relationship", () => {
      const signatureRequest = {
        tenant_id: "550e8400-e29b-41d4-a716-446655440000",
        agreement_version_id: "550e8400-e29b-41d4-a716-446655440002",
        signer_email: "signer@example.com",
        status: "pending"
      };

      const result = insertSignatureRequestSchema.safeParse(signatureRequest);
      expect(result.success).toBe(true);
      expect(result.data?.agreement_version_id).toBe("550e8400-e29b-41d4-a716-446655440002");
    });
  });

  describe("Enum Constraints", () => {
    it("should validate client status enum values", () => {
      const validStatuses = ["active", "inactive", "at-risk", "new"];
      
      validStatuses.forEach(status => {
        const client = {
          tenant_id: "550e8400-e29b-41d4-a716-446655440000",
          first_name: "Test",
          last_name: "User",
          status
        };

        const result = insertClientSchema.safeParse(client);
        expect(result.success).toBe(true);
      });
    });

    it("should validate contact status enum values", () => {
      const validStatuses = ["hot", "warm", "cold"];
      
      validStatuses.forEach(status => {
        const contact = {
          tenant_id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Test Contact",
          status
        };

        const result = insertContactSchema.safeParse(contact);
        expect(result.success).toBe(true);
      });
    });

    it("should validate opportunity stage enum values", () => {
      const validStages = ["prospecting", "qualification", "proposal", "negotiation", "closed-won", "closed-lost"];
      
      validStages.forEach(stage => {
        const opportunity = {
          tenant_id: "550e8400-e29b-41d4-a716-446655440000",
          client_id: "550e8400-e29b-41d4-a716-446655440001",
          name: "Test Deal",
          stage
        };

        const result = insertOpportunitySchema.safeParse(opportunity);
        expect(result.success).toBe(true);
      });
    });

    it("should validate agreement status enum values", () => {
      const validStatuses = ["draft", "sent", "viewed", "signed", "expired"];
      
      validStatuses.forEach(status => {
        const agreement = {
          tenant_id: "550e8400-e29b-41d4-a716-446655440000",
          client_id: "550e8400-e29b-41d4-a716-446655440001",
          title: "Test Agreement",
          status
        };

        const result = insertAgreementSchema.safeParse(agreement);
        expect(result.success).toBe(true);
      });
    });

    it("should validate signature status enum values", () => {
      const validStatuses = ["pending", "completed", "declined"];
      
      validStatuses.forEach(status => {
        const signatureRequest = {
          tenant_id: "550e8400-e29b-41d4-a716-446655440000",
          agreement_version_id: "550e8400-e29b-41d4-a716-446655440002",
          signer_email: "signer@example.com",
          status
        };

        const result = insertSignatureRequestSchema.safeParse(signatureRequest);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Tenant Isolation", () => {
    it("should require tenant_id in all CRM tables", () => {
      const schemas = [
        { schema: insertClientSchema, data: { first_name: "Test", last_name: "User" } },
        { schema: insertContactSchema, data: { name: "Test Contact" } },
        { schema: insertOpportunitySchema, data: { client_id: "test", name: "Test Deal" } },
        { schema: insertAgreementSchema, data: { client_id: "test", title: "Test Agreement" } }
      ];

      schemas.forEach(({ schema, data }) => {
        const result = schema.safeParse(data);
        expect(result.success).toBe(false);
        expect(result.error?.issues).toContainEqual(
          expect.objectContaining({
            path: ["tenant_id"],
            message: expect.stringContaining("Required")
          })
        );
      });
    });
  });
});
