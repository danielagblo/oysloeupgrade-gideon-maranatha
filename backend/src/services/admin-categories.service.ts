import { AppDataSource } from '../config/database.js';
import { Category } from '../entities/Category.js';
import { Feature } from '../entities/Feature.js';
import { Product } from '../entities/Product.js';
import { ProductFeature } from '../entities/ProductFeature.js';
import { Subcategory } from '../entities/Subcategory.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  iconUrl?: string;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  iconUrl?: string;
  isActive?: boolean;
}

export interface CreateSubcategoryInput {
  name: string;
  slug?: string;
  description?: string;
  parameters?: any[];
  iconUrl?: string;
  isActive?: boolean;
}

export class AdminCategoriesService {
  private get categoryRepository() {
    return AppDataSource.getRepository(Category);
  }

  private get subcategoryRepository() {
    return AppDataSource.getRepository(Subcategory);
  }

  private get productRepository() {
    return AppDataSource.getRepository(Product);
  }

  private get featureRepository() {
    return AppDataSource.getRepository(Feature);
  }

  async getCategories() {
    const categories = await this.categoryRepository.find({
      relations: ['subcategories'],
      order: { displayOrder: 'ASC', name: 'ASC' },
    });

    const hierarchy = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      subcategories: (cat.subcategories || []).map((sub) => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
      })),
    }));

    return {
      categories,
      hierarchy,
    };
  }

  async createCategory(input: CreateCategoryInput) {
    const existing = await this.categoryRepository.findOne({
      where: { name: input.name },
    });

    if (existing) {
      throw new ConflictError('Category with this name already exists');
    }

    const slug =
      input.slug ||
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const existingSlug = await this.categoryRepository.findOne({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictError('Category with this slug already exists');
    }

    const category = this.categoryRepository.create({
      name: input.name,
      slug,
      description: input.description,
      iconUrl: input.iconUrl,
      archived: !(input.isActive ?? true),
    });

    return await this.categoryRepository.save(category);
  }

  async updateCategory(categoryId: string, input: UpdateCategoryInput) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (input.name && input.name !== category.name) {
      const existing = await this.categoryRepository.findOne({
        where: { name: input.name },
      });
      if (existing && existing.id !== categoryId) {
        throw new ConflictError('Category with this name already exists');
      }
      category.name = input.name;
    }

    if (input.slug && input.slug !== category.slug) {
      const existing = await this.categoryRepository.findOne({
        where: { slug: input.slug },
      });
      if (existing && existing.id !== categoryId) {
        throw new ConflictError('Category with this slug already exists');
      }
      category.slug = input.slug;
    }

    if (input.description !== undefined) {
      category.description = input.description;
    }

    if (input.iconUrl !== undefined) {
      category.iconUrl = input.iconUrl;
    }

    if (input.isActive !== undefined) {
      category.archived = !input.isActive;
    }

    return await this.categoryRepository.save(category);
  }

  async createSubcategory(categoryId: string, input: CreateSubcategoryInput) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    const existing = await this.subcategoryRepository.findOne({
      where: { categoryId, name: input.name },
    });

    if (existing) {
      throw new ConflictError('Subcategory with this name already exists in this category');
    }

    const slug =
      input.slug ||
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const subcategory = this.subcategoryRepository.create({
      categoryId,
      name: input.name,
      slug,
      description: input.description,
      archived: !(input.isActive ?? true),
    });

    return await this.subcategoryRepository.save(subcategory);
  }

  async updateSubcategory(
    categoryId: string,
    subcategoryId: string,
    input: CreateSubcategoryInput
  ) {
    const subcategory = await this.subcategoryRepository.findOne({
      where: { id: subcategoryId, categoryId },
    });

    if (!subcategory) {
      throw new NotFoundError('Subcategory not found');
    }

    if (input.name && input.name !== subcategory.name) {
      const existing = await this.subcategoryRepository.findOne({
        where: { categoryId, name: input.name },
      });
      if (existing && existing.id !== subcategoryId) {
        throw new ConflictError('Subcategory with this name already exists in this category');
      }
      subcategory.name = input.name;
    }

    if (input.slug && input.slug !== subcategory.slug) {
      subcategory.slug = input.slug;
    }

    if (input.description !== undefined) {
      subcategory.description = input.description;
    }

    if (input.isActive !== undefined) {
      subcategory.archived = !input.isActive;
    }

    return await this.subcategoryRepository.save(subcategory);
  }

  async deleteCategory(categoryId: string) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
      relations: ['subcategories'],
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Check if category has products
    const productCount = await this.productRepository.count({
      where: { categoryId },
    });

    if (productCount > 0) {
      throw new ConflictError(
        `Cannot delete category: ${productCount} product(s) are using this category`
      );
    }

    // Check if category has subcategories
    if (category.subcategories && category.subcategories.length > 0) {
      throw new ConflictError(
        `Cannot delete category: ${category.subcategories.length} subcategory(ies) exist. Delete subcategories first.`
      );
    }

    await this.categoryRepository.remove(category);
    return { success: true };
  }

  async deleteSubcategory(categoryId: string, subcategoryId: string) {
    const subcategory = await this.subcategoryRepository.findOne({
      where: { id: subcategoryId, categoryId },
    });

    if (!subcategory) {
      throw new NotFoundError('Subcategory not found');
    }

    // Check if subcategory has products
    const productCount = await this.productRepository.count({
      where: { subcategoryId },
    });

    if (productCount > 0) {
      throw new ConflictError(
        `Cannot delete subcategory: ${productCount} product(s) are using this subcategory`
      );
    }

    // Check if subcategory has features
    const featureCount = await this.featureRepository.count({
      where: { subcategoryId },
    });

    if (featureCount > 0) {
      throw new ConflictError(
        `Cannot delete subcategory: ${featureCount} feature(s) exist. Delete features first.`
      );
    }

    await this.subcategoryRepository.remove(subcategory);
    return { success: true };
  }

  async deleteFeature(categoryId: string, subcategoryId: string, featureId: string) {
    // Verify subcategory belongs to category
    const subcategory = await this.subcategoryRepository.findOne({
      where: { id: subcategoryId, categoryId },
    });

    if (!subcategory) {
      throw new NotFoundError('Subcategory not found');
    }

    const feature = await this.featureRepository.findOne({
      where: { id: featureId, subcategoryId },
    });

    if (!feature) {
      throw new NotFoundError('Feature not found');
    }

    // Note: ProductFeature junction table will cascade delete
    // But we should check if any products are using this feature
    const productFeatureRepository = AppDataSource.getRepository(ProductFeature);
    const usageCount = await productFeatureRepository.count({
      where: { featureId },
    });

    if (usageCount > 0) {
      throw new ConflictError(
        `Cannot delete feature: ${usageCount} product(s) are using this feature`
      );
    }

    await this.featureRepository.remove(feature);
    return { success: true };
  }

  async reorderCategories(orders: Array<{ id: string; displayOrder: number }>) {
    // Use transaction to ensure all updates succeed or fail together
    return await AppDataSource.transaction(async (manager) => {
      const categoryRepository = manager.getRepository(Category);

      for (const order of orders) {
        await categoryRepository.update(order.id, {
          displayOrder: order.displayOrder,
        });
      }

      return { success: true, updated: orders.length };
    });
  }
}



