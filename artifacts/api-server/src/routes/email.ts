/**
 * @file        artifacts/api-server/src/routes/email.ts
 * @module      API Routes / Email
 * @purpose     Email account and message management endpoints
 *
 * @ai_instructions
 *   - Implement all email endpoints defined in OpenAPI specification
 *   - Use proper authentication and authorization middleware
 *   - Validate request bodies using Zod schemas
 *   - Handle errors consistently with proper HTTP status codes
 *   - Use the email service layer for business logic
 *
 * @exports     Express router with email endpoints
 * @depends_on  EmailService, authentication middleware, validation middleware
 *
 * @copyright   SPDX-FileCopyrightText: 2025 Trevor Lam <trevor@example.org>
 * @license     SPDX-License-Identifier: MIT
 */

import { Router } from "express";
import { requireAuth } from "../middlewares/require-auth";
import { requirePermission } from "../middlewares/require-permission";
import { validateRequest } from "../middlewares/validate-request";
import { EmailService } from "../lib/email-service";

const router = Router();
const emailService = new EmailService();

// Apply authentication middleware to all email routes
router.use(requireAuth);

/**
 * GET /email/accounts
 * List email accounts for the current user
 */
router.get("/accounts", requirePermission("email:read"), async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.tenant?.id;
    
    if (!userId || !tenantId) {
      return res.status(401).json({
        error: "Unauthorized",
        statusCode: 401
      });
    }

    const accounts = await emailService.listAccounts(userId, tenantId);
    res.json({
      accounts,
      pagination: {
        page: 1,
        limit: accounts.length,
        total: accounts.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /email/accounts
 * Connect a new email account
 */
router.post(
  "/accounts",
  requirePermission("email:write"),
  validateRequest({
    body: {
      provider: { type: "string", enum: ["gmail", "outlook", "imap", "yahoo", "apple"] },
      email_address: { type: "string", format: "email" },
      display_name: { type: "string" },
      oauth_token: { type: "string" },
      settings: { type: "object", optional: true }
    }
  }),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.tenant?.id;
      
      if (!userId || !tenantId) {
        return res.status(401).json({
          error: "Unauthorized",
          statusCode: 401
        });
      }

      const account = await emailService.createAccount({
        ...req.body,
        userId,
        tenantId
      });

      res.status(201).json(account);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /email/accounts/{accountId}/messages
 * List email messages for an account
 */
router.get(
  "/accounts/:accountId/messages",
  requirePermission("email:read"),
  validateRequest({
    params: {
      accountId: { type: "string", format: "uuid" }
    },
    query: {
      folder: { type: "string", enum: ["inbox", "sent", "drafts", "archive", "trash"], default: "inbox" },
      page: { type: "number", default: 1, minimum: 1 },
      limit: { type: "number", default: 20, minimum: 1, maximum: 100 },
      search: { type: "string", optional: true },
      unread_only: { type: "boolean", default: false }
    }
  }),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.tenant?.id;
      const { accountId } = req.params;
      
      if (!userId || !tenantId) {
        return res.status(401).json({
          error: "Unauthorized",
          statusCode: 401
        });
      }

      const options = {
        folder: req.query.folder as string,
        page: Number(req.query.page),
        limit: Number(req.query.limit),
        search: req.query.search as string,
        unreadOnly: req.query.unread_only === "true"
      };

      const result = await emailService.listMessages(accountId, userId, tenantId, options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /email/accounts/{accountId}/send
 * Send an email through a connected account
 */
router.post(
  "/accounts/:accountId/send",
  requirePermission("email:write"),
  validateRequest({
    params: {
      accountId: { type: "string", format: "uuid" }
    },
    body: {
      to_address: { type: "array", items: { type: "object", properties: { email: { type: "string", format: "email" }, name: { type: "string" } } } },
      subject: { type: "string" },
      body: { type: "string" },
      cc_address: { type: "array", optional: true, items: { type: "object", properties: { email: { type: "string", format: "email" }, name: { type: "string" } } } },
      bcc_address: { type: "array", optional: true, items: { type: "object", properties: { email: { type: "string", format: "email" }, name: { type: "string" } } } },
      body_html: { type: "string", optional: true },
      attachments: { type: "array", optional: true, items: { type: "object", properties: { name: { type: "string" }, content: { type: "string", format: "byte" }, content_type: { type: "string" } } } }
    }
  }),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.tenant?.id;
      const { accountId } = req.params;
      
      if (!userId || !tenantId) {
        return res.status(401).json({
          error: "Unauthorized",
          statusCode: 401
        });
      }

      const message = await emailService.sendEmail(accountId, userId, tenantId, req.body);
      res.json(message);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /email/drafts
 * List email drafts for the current user
 */
router.get(
  "/drafts",
  requirePermission("email:read"),
  validateRequest({
    query: {
      account_id: { type: "string", format: "uuid", optional: true },
      page: { type: "number", default: 1, minimum: 1 },
      limit: { type: "number", default: 20, minimum: 1, maximum: 100 }
    }
  }),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.tenant?.id;
      
      if (!userId || !tenantId) {
        return res.status(401).json({
          error: "Unauthorized",
          statusCode: 401
        });
      }

      const options = {
        accountId: req.query.account_id as string,
        page: Number(req.query.page),
        limit: Number(req.query.limit)
      };

      const result = await emailService.listDrafts(userId, tenantId, options);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /email/drafts
 * Create a new email draft
 */
router.post(
  "/drafts",
  requirePermission("email:write"),
  validateRequest({
    body: {
      account_id: { type: "string", format: "uuid" },
      to_address: { type: "array", optional: true, items: { type: "object", properties: { email: { type: "string", format: "email" }, name: { type: "string" } } } },
      cc_address: { type: "array", optional: true, items: { type: "object", properties: { email: { type: "string", format: "email" }, name: { type: "string" } } } },
      bcc_address: { type: "array", optional: true, items: { type: "object", properties: { email: { type: "string", format: "email" }, name: { type: "string" } } } },
      subject: { type: "string", optional: true },
      body: { type: "string", optional: true },
      body_html: { type: "string", optional: true },
      is_reply_to: { type: "string", format: "uuid", optional: true },
      is_forward_of: { type: "string", format: "uuid", optional: true }
    }
  }),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.tenant?.id;
      
      if (!userId || !tenantId) {
        return res.status(401).json({
          error: "Unauthorized",
          statusCode: 401
        });
      }

      const draft = await emailService.createDraft({
        ...req.body,
        userId,
        tenantId
      });

      res.status(201).json(draft);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /email/drafts/{draftId}
 * Update an existing email draft
 */
router.patch(
  "/drafts/:draftId",
  requirePermission("email:write"),
  validateRequest({
    params: {
      draftId: { type: "string", format: "uuid" }
    },
    body: {
      to_address: { type: "array", optional: true, items: { type: "object", properties: { email: { type: "string", format: "email" }, name: { type: "string" } } } },
      cc_address: { type: "array", optional: true, items: { type: "object", properties: { email: { type: "string", format: "email" }, name: { type: "string" } } } },
      bcc_address: { type: "array", optional: true, items: { type: "object", properties: { email: { type: "string", format: "email" }, name: { type: "string" } } } },
      subject: { type: "string", optional: true },
      body: { type: "string", optional: true },
      body_html: { type: "string", optional: true }
    }
  }),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.tenant?.id;
      const { draftId } = req.params;
      
      if (!userId || !tenantId) {
        return res.status(401).json({
          error: "Unauthorized",
          statusCode: 401
        });
      }

      const draft = await emailService.updateDraft(draftId, userId, tenantId, req.body);
      res.json(draft);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /email/messages/{messageId}/star
 * Toggle star status of an email message
 */
router.post(
  "/messages/:messageId/star",
  requirePermission("email:write"),
  validateRequest({
    params: {
      messageId: { type: "string", format: "uuid" }
    },
    body: {
      starred: { type: "boolean" }
    }
  }),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.tenant?.id;
      const { messageId } = req.params;
      
      if (!userId || !tenantId) {
        return res.status(401).json({
          error: "Unauthorized",
          statusCode: 401
        });
      }

      const message = await emailService.toggleStar(messageId, userId, tenantId, req.body.starred);
      res.json(message);
    } catch (error) {
      next(error);
    }
  }
);

export { router as emailRouter };
