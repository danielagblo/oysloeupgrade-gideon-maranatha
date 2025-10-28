import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import {
  createReviewSchema,
  deleteReviewSchema,
  updateReviewSchema,
} from '../validators/review.validator.js';

const router = Router();
const productController = new ProductController();

router.use(authenticate);

router.post(
  '/',
  validateRequest(createReviewSchema),
  productController.createReview.bind(productController)
);

router.patch(
  '/:id',
  validateRequest(updateReviewSchema),
  productController.updateReview.bind(productController)
);

router.delete(
  '/:id',
  validateRequest(deleteReviewSchema),
  productController.deleteReview.bind(productController)
);

export default router;
