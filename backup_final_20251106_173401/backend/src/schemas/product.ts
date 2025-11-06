import { z } from 'zod';

export const ProductStatus = z.enum(['draft', 'active', 'paused', 'archived', 'sold']);

export const Product = z
  .object({
    id: z.string().uuid().describe('Product UUID'),
    pid: z.string().min(1).max(20).optional().describe('Product public ID'),
    userId: z.string().uuid().describe('Product owner user ID'),
    categoryId: z.string().uuid().optional().describe('Product category ID'),
    subcategoryId: z.string().uuid().optional().describe('Product subcategory ID'),
    name: z.string().min(1).max(100).describe('Product name'),
    description: z.string().min(1).describe('Product description'),
    image: z.string().url().optional().describe('Primary product image URL'),
    price: z.number().positive().describe('Product price'),
    status: ProductStatus.default('draft').describe('Product status'),
    viewsCount: z.number().int().min(0).default(0).describe('Product view count'),
    favoritesCount: z.number().int().min(0).default(0).describe('Product favorites count'),
    reportsCount: z.number().int().min(0).default(0).describe('Product reports count'),
    isPromoted: z.boolean().default(false).describe('Whether product is promoted'),
    promotedUntil: z.string().datetime().optional().describe('Promotion end date'),
    createdAt: z.string().datetime().describe('Product creation timestamp'),
    updatedAt: z.string().datetime().describe('Product last update timestamp'),
  })
  .openapi('Product', {
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      pid: 'PROD123',
      userId: '456e7890-e89b-12d3-a456-426614174001',
      categoryId: '789e0123-e89b-12d3-a456-426614174002',
      subcategoryId: '012e3456-e89b-12d3-a456-426614174003',
      name: 'iPhone 13 Pro Max',
      description: 'Latest iPhone with 128GB storage, excellent condition',
      image: 'https://example.com/images/iphone13.jpg',
      price: 2500.0,
      status: 'active',
      viewsCount: 150,
      favoritesCount: 25,
      reportsCount: 0,
      isPromoted: true,
      promotedUntil: '2024-02-15T23:59:59Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
    },
  });

export const CreateProductBody = z
  .object({
    categoryId: z.string().uuid().optional().describe('Product category ID'),
    subcategoryId: z.string().uuid().optional().describe('Product subcategory ID'),
    name: z.string().min(1).max(100).describe('Product name'),
    description: z.string().min(1).describe('Product description'),
    image: z.string().url().optional().describe('Primary product image URL'),
    price: z.number().positive().describe('Product price'),
    status: ProductStatus.default('draft').describe('Product status'),
  })
  .openapi('CreateProductBody', {
    example: {
      categoryId: '789e0123-e89b-12d3-a456-426614174002',
      subcategoryId: '012e3456-e89b-12d3-a456-426614174003',
      name: 'iPhone 13 Pro Max',
      description: 'Latest iPhone with 128GB storage, excellent condition',
      image: 'https://example.com/images/iphone13.jpg',
      price: 2500.0,
      status: 'draft',
    },
  });

export const UpdateProductBody = z
  .object({
    categoryId: z.string().uuid().optional().describe('Product category ID'),
    subcategoryId: z.string().uuid().optional().describe('Product subcategory ID'),
    name: z.string().min(1).max(100).optional().describe('Product name'),
    description: z.string().min(1).optional().describe('Product description'),
    image: z.string().url().optional().describe('Primary product image URL'),
    price: z.number().positive().optional().describe('Product price'),
    status: ProductStatus.optional().describe('Product status'),
    isPromoted: z.boolean().optional().describe('Whether product is promoted'),
    promotedUntil: z.string().datetime().optional().describe('Promotion end date'),
  })
  .openapi('UpdateProductBody', {
    example: {
      name: 'iPhone 13 Pro Max - Updated',
      description: 'Latest iPhone with 128GB storage, excellent condition. Price reduced!',
      price: 2300.0,
      status: 'active',
      isPromoted: true,
      promotedUntil: '2024-02-15T23:59:59Z',
    },
  });

export const ProductWithDetails = Product.extend({
  user: z
    .object({
      id: z.string().uuid().describe('User UUID'),
      name: z.string().describe('User name'),
      avatar: z.string().url().optional().describe('User avatar URL'),
    })
    .optional()
    .describe('Product owner information'),
  category: z
    .object({
      id: z.string().uuid().describe('Category UUID'),
      name: z.string().describe('Category name'),
    })
    .optional()
    .describe('Product category information'),
  subcategory: z
    .object({
      id: z.string().uuid().describe('Subcategory UUID'),
      name: z.string().describe('Subcategory name'),
    })
    .optional()
    .describe('Product subcategory information'),
  images: z
    .array(
      z.object({
        id: z.string().uuid().describe('Image UUID'),
        url: z.string().url().describe('Image URL'),
        isPrimary: z.boolean().describe('Whether this is the primary image'),
      })
    )
    .optional()
    .describe('Product images'),
  features: z
    .array(
      z.object({
        id: z.string().uuid().describe('Feature UUID'),
        name: z.string().describe('Feature name'),
        value: z.string().describe('Feature value'),
      })
    )
    .optional()
    .describe('Product features'),
  reviews: z
    .array(
      z.object({
        id: z.string().uuid().describe('Review UUID'),
        rating: z.number().int().min(1).max(5).describe('Review rating'),
        comment: z.string().optional().describe('Review comment'),
        user: z
          .object({
            id: z.string().uuid().describe('User UUID'),
            name: z.string().describe('User name'),
          })
          .describe('Reviewer information'),
        createdAt: z.string().datetime().describe('Review creation timestamp'),
      })
    )
    .optional()
    .describe('Product reviews'),
}).openapi('ProductWithDetails', {
  example: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    pid: 'PROD123',
    userId: '456e7890-e89b-12d3-a456-426614174001',
    categoryId: '789e0123-e89b-12d3-a456-426614174002',
    subcategoryId: '012e3456-e89b-12d3-a456-426614174003',
    name: 'iPhone 13 Pro Max',
    description: 'Latest iPhone with 128GB storage, excellent condition',
    image: 'https://example.com/images/iphone13.jpg',
    price: 2500.0,
    status: 'active',
    viewsCount: 150,
    favoritesCount: 25,
    reportsCount: 0,
    isPromoted: true,
    promotedUntil: '2024-02-15T23:59:59Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    user: {
      id: '456e7890-e89b-12d3-a456-426614174001',
      name: 'John Doe',
      avatar: 'https://example.com/avatars/john.jpg',
    },
    category: {
      id: '789e0123-e89b-12d3-a456-426614174002',
      name: 'Electronics',
    },
    subcategory: {
      id: '012e3456-e89b-12d3-a456-426614174003',
      name: 'Smartphones',
    },
    images: [
      {
        id: 'img1-uuid',
        url: 'https://example.com/images/iphone13-1.jpg',
        isPrimary: true,
      },
    ],
    features: [
      { id: 'feat1-uuid', name: 'Storage', value: '128GB' },
      { id: 'feat2-uuid', name: 'Color', value: 'Graphite' },
    ],
    reviews: [
      {
        id: 'rev1-uuid',
        rating: 5,
        comment: 'Great phone!',
        user: { id: 'user2-uuid', name: 'Jane Smith' },
        createdAt: '2024-01-10T00:00:00Z',
      },
    ],
  },
});

export const ProductQueryParams = z
  .object({
    page: z.number().int().min(1).default(1).describe('Page number'),
    limit: z.number().int().min(1).max(100).default(20).describe('Items per page'),
    search: z.string().optional().describe('Search term'),
    categoryId: z.string().uuid().optional().describe('Filter by category ID'),
    subcategoryId: z.string().uuid().optional().describe('Filter by subcategory ID'),
    minPrice: z.number().nonnegative().optional().describe('Minimum price filter'),
    maxPrice: z.number().nonnegative().optional().describe('Maximum price filter'),
    status: ProductStatus.optional().describe('Filter by status'),
    isPromoted: z.boolean().optional().describe('Filter by promotion status'),
    sortBy: z
      .enum(['createdAt', 'updatedAt', 'price', 'viewsCount', 'favoritesCount'])
      .default('createdAt')
      .describe('Sort field'),
    sortOrder: z.enum(['asc', 'desc']).default('desc').describe('Sort order'),
  })
  .openapi('ProductQueryParams', {
    example: {
      page: 1,
      limit: 20,
      search: 'iPhone',
      categoryId: '789e0123-e89b-12d3-a456-426614174002',
      minPrice: 1000,
      maxPrice: 3000,
      status: 'active',
      isPromoted: true,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
  });
