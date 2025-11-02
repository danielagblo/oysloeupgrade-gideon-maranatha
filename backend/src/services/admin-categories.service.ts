import { AppDataSource } from "../config/database.js";
import { Category } from "../entities/Category.js";
import { Subcategory } from "../entities/Subcategory.js";
import { NotFoundError, ConflictError } from "../utils/errors.js";

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

  async getCategories() {
    const categories = await this.categoryRepository.find({
      relations: ["subcategories"],
      order: { displayOrder: "ASC", name: "ASC" },
    });

    // Build hierarchy
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
    // Check for duplicate name
    const existing = await this.categoryRepository.findOne({
      where: { name: input.name },
    });

    if (existing) {
      throw new ConflictError("Category with this name already exists");
    }

    // Generate slug if not provided
    const slug =
      input.slug ||
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // Check for duplicate slug
    const existingSlug = await this.categoryRepository.findOne({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictError("Category with this slug already exists");
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
      throw new NotFoundError("Category not found");
    }

    if (input.name && input.name !== category.name) {
      const existing = await this.categoryRepository.findOne({
        where: { name: input.name },
      });
      if (existing && existing.id !== categoryId) {
        throw new ConflictError("Category with this name already exists");
      }
      category.name = input.name;
    }

    if (input.slug && input.slug !== category.slug) {
      const existing = await this.categoryRepository.findOne({
        where: { slug: input.slug },
      });
      if (existing && existing.id !== categoryId) {
        throw new ConflictError("Category with this slug already exists");
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

  async createSubcategory(
    categoryId: string,
    input: CreateSubcategoryInput
  ) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    // Check for duplicate name in this category
    const existing = await this.subcategoryRepository.findOne({
      where: { categoryId, name: input.name },
    });

    if (existing) {
      throw new ConflictError(
        "Subcategory with this name already exists in this category"
      );
    }

    // Generate slug if not provided
    const slug =
      input.slug ||
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

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
      throw new NotFoundError("Subcategory not found");
    }

    if (input.name && input.name !== subcategory.name) {
      const existing = await this.subcategoryRepository.findOne({
        where: { categoryId, name: input.name },
      });
      if (existing && existing.id !== subcategoryId) {
        throw new ConflictError(
          "Subcategory with this name already exists in this category"
        );
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
}


