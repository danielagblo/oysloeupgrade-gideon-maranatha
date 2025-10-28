import { Router } from "express";
import { z } from "zod";
import { UserController } from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validation.middleware.js";

const router = Router();
const userController = new UserController();

const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(255).optional(),
    lastName: z.string().min(1).max(255).optional(),
    name: z.string().min(1).max(255).optional(),
    phone: z.string().min(10).max(15).optional(),
    address: z.string().max(500).optional(),
    preferredNotificationEmail: z.string().email().optional(),
    preferredNotificationPhone: z.string().min(10).max(15).optional(),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  }),
});

const deleteAccountSchema = z.object({
  body: z.object({
    password: z.string().min(1),
  }),
});

const getUserProductsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z
      .enum(["draft", "active", "paused", "archived", "sold"])
      .optional(),
  }),
});

const getUserReviewsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

const getWalletTransactionsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    type: z
      .enum(["credit", "debit", "referral", "coupon", "purchase", "refund"])
      .optional(),
  }),
});

const updatePreferencesSchema = z.object({
  body: z.object({
    preferredNotificationEmail: z.string().email().optional(),
    preferredNotificationPhone: z.string().min(10).max(15).optional(),
  }),
});

const userPreferencesSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    phone: z.string().min(10).max(15).optional(),
    name: z.string().min(1).max(255).optional(),
    address: z.string().max(500).optional(),
    avatar: z.string().optional(),
    preferredNotificationEmail: z.string().email().optional(),
    preferredNotificationPhone: z.string().min(10).max(15).optional(),
  }),
});

router.get(
  "/profile",
  authenticate,
  userController.getProfile.bind(userController)
);

router.put(
  "/profile",
  authenticate,
  validateRequest(updateProfileSchema),
  userController.updateProfile.bind(userController)
);

router.get("/me", authenticate, userController.getProfile.bind(userController));

router.put(
  "/me",
  authenticate,
  validateRequest(updateProfileSchema),
  userController.updateProfile.bind(userController)
);

router.put(
  "/password",
  authenticate,
  validateRequest(changePasswordSchema),
  userController.changePassword.bind(userController)
);


router.get(
  "/products",
  authenticate,
  validateRequest(getUserProductsSchema),
  userController.getUserProducts.bind(userController)
);

router.get(
  "/reviews",
  authenticate,
  validateRequest(getUserReviewsSchema),
  userController.getUserReviews.bind(userController)
);

router.get(
  "/wallet/transactions",
  authenticate,
  validateRequest(getWalletTransactionsSchema),
  userController.getWalletTransactions.bind(userController)
);

router.get(
  "/preferences",
  authenticate,
  userController.getPreferences.bind(userController)
);

router.put(
  "/preferences",
  authenticate,
  validateRequest(userPreferencesSchema),
  userController.updatePreferences.bind(userController)
);

router.delete(
  "/account",
  authenticate,
  validateRequest(deleteAccountSchema),
  userController.deleteAccount.bind(userController)
);

router.get(
  "/preferences",
  authenticate,
  userController.getPreferences.bind(userController)
);

router.put(
  "/preferences",
  authenticate,
  validateRequest(updatePreferencesSchema),
  userController.updatePreferences.bind(userController)
);

export default router;
