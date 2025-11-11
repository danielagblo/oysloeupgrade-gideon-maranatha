#!/usr/bin/env bun

import dotenv from 'dotenv';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

import { AppDataSource } from './data-source.js';
import { User } from './entities/User.js';
import { Category } from './entities/Category.js';
import { Subcategory } from './entities/Subcategory.js';
import { Product } from './entities/Product.js';
import { ProductImage } from './entities/ProductImage.js';
import { SupportCase } from './entities/SupportCase.js';
import { SupportCaseAssignment } from './entities/SupportCaseAssignment.js';
import { SupportMessage } from './entities/SupportMessage.js';
import { Review } from './entities/Review.js';
import { Favorite } from './entities/Favorite.js';
import { Wallet } from './entities/Wallet.js';
import { AdminUser } from './entities/AdminUser.js';
import { hashPassword } from './utils/password.js';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('📊 Connected to database');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing test data...');
    await clearExistingData();

    // Create test admin user
    console.log('👨‍💼 Creating test admin user...');
    const testAdmin = await createTestAdmin();

    // Create test user
    console.log('👤 Creating test user...');
    const testUser = await createTestUser();

    // Create categories and subcategories
    console.log('📂 Creating categories and subcategories...');
    const categories = await createCategories();

    // Create products for the test user
    console.log('📦 Creating products...');
    const products = await createProducts(testUser, categories);

    // Create support cases
    console.log('🎫 Creating support cases...');
    const supportCases = await createSupportCases(testUser, testAdmin);

    // Create reviews
    console.log('⭐ Creating reviews...');
    await createReviews(products, testUser);

    // Create favorites
    console.log('❤️ Creating favorites...');
    await createFavorites(products, testUser);

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Test Data Summary:');
    console.log(`   👤 Test User: ${testUser.email} (ID: ${testUser.id})`);
    console.log(`   👨‍💼 Test Admin: ${testAdmin.username} (ID: ${testAdmin.id})`);
    console.log(`   📂 Categories: ${categories.length}`);
    console.log(`   📦 Products: ${products.length}`);
    console.log(`   🎫 Support Cases: ${supportCases.length}`);
    console.log('\n🔑 Test Credentials:');
    console.log('   User: testuser@example.com / password123');
    console.log('   Admin: testadmin / admin123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

async function clearExistingData() {
  console.log('   Note: Skipping data clearing to avoid foreign key constraints.');
  console.log('   If you need to reseed, manually clear the database first.');
  // We'll let the seeding script handle duplicate key errors gracefully
  // or create data only if it doesn't exist
}

async function createTestAdmin() {
  const adminRepo = AppDataSource.getRepository(AdminUser);

  // Check if test admin already exists
  const existingAdmin = await adminRepo.findOne({ where: { username: 'testadmin' } });
  if (existingAdmin) {
    console.log('   Test admin already exists, skipping creation');
    return existingAdmin;
  }

  const admin = adminRepo.create({
    username: 'testadmin',
    email: 'testadmin@example.com',
    passwordHash: await hashPassword('admin123'),
    role: 'admin',
    permissions: [
      'user:read', 'user:update', 'user:verify', 'user:mute',
      'ads:read', 'ads:moderate', 'ads:delete',
      'support:read', 'support:manage',
      'content:manage', 'system:reports'
    ],
    isActive: true,
  });

  return await adminRepo.save(admin);
}

async function createTestUser() {
  const userRepo = AppDataSource.getRepository(User);
  const walletRepo = AppDataSource.getRepository(Wallet);

  // Check if test user already exists
  const existingUser = await userRepo.findOne({ where: { email: 'testuser@example.com' } });
  if (existingUser) {
    console.log('   Test user already exists, skipping creation');
    return existingUser;
  }

  const user = userRepo.create({
    email: 'testuser@example.com',
    phone: '+1234567890',
    passwordHash: await hashPassword('password123'),
    name: 'John Doe',
    address: '123 Test Street, Test City',
    referralCode: 'TEST123',
    referralPoints: 50,
    level: 'SILVER',
    isActive: true,
    isStaff: false,
    isSuperuser: false,
    phoneVerified: true,
    emailVerified: true,
    verificationStatus: 'verified',
    verificationLevel: 'basic',
    isMuted: false,
  });

  const savedUser = await userRepo.save(user);

  // Create wallet for user
  const wallet = walletRepo.create({
    userId: savedUser.id,
    balance: 100.00,
  });

  await walletRepo.save(wallet);

  return savedUser;
}

async function createCategories() {
  const categoryRepo = AppDataSource.getRepository(Category);
  const subcategoryRepo = AppDataSource.getRepository(Subcategory);

  // Check if categories already exist
  const existingCategories = await categoryRepo.find();
  if (existingCategories.length > 0) {
    console.log(`   Categories already exist (${existingCategories.length} found), skipping creation`);
    return existingCategories;
  }

  const categoriesData = [
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      displayOrder: 1,
      archived: false,
      subcategories: [
        { name: 'Smartphones', slug: 'smartphones', displayOrder: 1 },
        { name: 'Laptops', slug: 'laptops', displayOrder: 2 },
        { name: 'Tablets', slug: 'tablets', displayOrder: 3 },
        { name: 'Accessories', slug: 'accessories', displayOrder: 4 },
      ]
    },
    {
      name: 'Vehicles',
      slug: 'vehicles',
      description: 'Cars, motorcycles, and automotive',
      displayOrder: 2,
      archived: false,
      subcategories: [
        { name: 'Cars', slug: 'cars', displayOrder: 1 },
        { name: 'Motorcycles', slug: 'motorcycles', displayOrder: 2 },
        { name: 'Parts & Accessories', slug: 'parts-accessories', displayOrder: 3 },
      ]
    },
    {
      name: 'Real Estate',
      slug: 'real-estate',
      description: 'Properties and real estate',
      displayOrder: 3,
      archived: false,
      subcategories: [
        { name: 'Apartments', slug: 'apartments', displayOrder: 1 },
        { name: 'Houses', slug: 'houses', displayOrder: 2 },
        { name: 'Commercial', slug: 'commercial', displayOrder: 3 },
      ]
    },
    {
      name: 'Fashion & Beauty',
      slug: 'fashion-beauty',
      description: 'Clothing, accessories, and beauty products',
      displayOrder: 4,
      archived: false,
      subcategories: [
        { name: 'Clothing', slug: 'clothing', displayOrder: 1 },
        { name: 'Shoes', slug: 'shoes', displayOrder: 2 },
        { name: 'Jewelry', slug: 'jewelry', displayOrder: 3 },
        { name: 'Beauty Products', slug: 'beauty-products', displayOrder: 4 },
      ]
    },
  ];

  const savedCategories = [];

  for (const categoryData of categoriesData) {
    const { subcategories, ...categoryFields } = categoryData;
    const category = categoryRepo.create(categoryFields);
    const savedCategory = await categoryRepo.save(category);

    // Create subcategories
    for (const subData of subcategories) {
      const subcategory = subcategoryRepo.create({
        ...subData,
        categoryId: savedCategory.id,
        archived: false,
      });
      await subcategoryRepo.save(subcategory);
    }

    savedCategories.push(savedCategory);
  }

  return savedCategories;
}

async function createProducts(user: User, categories: Category[]) {
  const productRepo = AppDataSource.getRepository(Product);
  const productImageRepo = AppDataSource.getRepository(ProductImage);

  // Check if products already exist for this user
  const existingProducts = await productRepo.find({ where: { userId: user.id } });
  if (existingProducts.length > 0) {
    console.log(`   Products already exist for test user (${existingProducts.length} found), skipping creation`);
    return existingProducts;
  }

  const productsData = [
    {
      name: 'iPhone 15 Pro Max',
      description: 'Latest iPhone with advanced features. Barely used, comes with original box and accessories.',
      price: 1199.99,
      categoryId: categories[0].id, // Electronics
      subcategoryId: null, // Will be set to Smartphones
      status: 'active' as const,
      moderationStatus: 'active' as const,
      viewsCount: 45,
      favoritesCount: 12,
      reportsCount: 0,
      isPromoted: false,
      images: [
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500',
        'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=500',
      ]
    },
    {
      name: 'MacBook Pro M3',
      description: 'Powerful laptop for professional work. 16GB RAM, 512GB SSD. Perfect condition.',
      price: 2499.99,
      categoryId: categories[0].id, // Electronics
      subcategoryId: null, // Will be set to Laptops
      status: 'active' as const,
      moderationStatus: 'active' as const,
      viewsCount: 78,
      favoritesCount: 23,
      reportsCount: 1,
      isPromoted: true,
      promotedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      images: [
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500',
        'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=500',
      ]
    },
    {
      name: 'Honda Civic 2020',
      description: 'Well maintained Honda Civic with low mileage. Single owner, full service history.',
      price: 18500.00,
      categoryId: categories[1].id, // Vehicles
      subcategoryId: null, // Will be set to Cars
      status: 'active' as const,
      moderationStatus: 'active' as const,
      viewsCount: 156,
      favoritesCount: 34,
      reportsCount: 0,
      isPromoted: false,
      images: [
        'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=500',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500',
      ]
    },
    {
      name: 'Modern 2BR Apartment',
      description: 'Beautiful 2 bedroom apartment in downtown. Fully furnished, parking included.',
      price: 2500.00,
      categoryId: categories[2].id, // Real Estate
      subcategoryId: null, // Will be set to Apartments
      status: 'active' as const,
      moderationStatus: 'active' as const,
      viewsCount: 89,
      favoritesCount: 18,
      reportsCount: 0,
      isPromoted: true,
      promotedUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=500',
      ]
    },
    {
      name: 'Designer Handbag',
      description: 'Authentic designer handbag in excellent condition. Comes with dust bag and authenticity card.',
      price: 899.99,
      categoryId: categories[3].id, // Fashion & Beauty
      subcategoryId: null, // Will be set to Accessories
      status: 'active' as const,
      moderationStatus: 'pending' as const,
      viewsCount: 23,
      favoritesCount: 7,
      reportsCount: 0,
      isPromoted: false,
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
      ]
    },
    {
      name: 'Gaming PC Setup',
      description: 'High-end gaming PC with RTX 4070, i7 processor, 32GB RAM. Perfect for gaming and content creation.',
      price: 3299.99,
      categoryId: categories[0].id, // Electronics
      subcategoryId: null, // Will be set to Accessories
      status: 'draft' as const,
      moderationStatus: 'pending' as const,
      viewsCount: 0,
      favoritesCount: 0,
      reportsCount: 0,
      isPromoted: false,
      images: [
        'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500',
      ]
    },
  ];

  const savedProducts = [];

  // Get subcategories for proper assignment
  const subcategoryRepo = AppDataSource.getRepository(Subcategory);
  const electronicsSubs = await subcategoryRepo.find({ where: { categoryId: categories[0].id } });
  const vehiclesSubs = await subcategoryRepo.find({ where: { categoryId: categories[1].id } });
  const realEstateSubs = await subcategoryRepo.find({ where: { categoryId: categories[2].id } });
  const fashionSubs = await subcategoryRepo.find({ where: { categoryId: categories[3].id } });

  const subcategoryMap = {
    'smartphones': electronicsSubs.find(s => s.slug === 'smartphones')?.id,
    'laptops': electronicsSubs.find(s => s.slug === 'laptops')?.id,
    'tablets': electronicsSubs.find(s => s.slug === 'tablets')?.id,
    'accessories': electronicsSubs.find(s => s.slug === 'accessories')?.id,
    'cars': vehiclesSubs.find(s => s.slug === 'cars')?.id,
    'apartments': realEstateSubs.find(s => s.slug === 'apartments')?.id,
    'clothing': fashionSubs.find(s => s.slug === 'clothing')?.id,
  };

  for (let i = 0; i < productsData.length; i++) {
    const productData = productsData[i];

    // Assign appropriate subcategory
    let subcategoryId = null;
    if (i === 0) subcategoryId = subcategoryMap.smartphones; // iPhone
    else if (i === 1) subcategoryId = subcategoryMap.laptops; // MacBook
    else if (i === 2) subcategoryId = subcategoryMap.cars; // Honda Civic
    else if (i === 3) subcategoryId = subcategoryMap.apartments; // Apartment
    else if (i === 4) subcategoryId = subcategoryMap.clothing; // Handbag (fashion)
    else if (i === 5) subcategoryId = subcategoryMap.accessories; // Gaming PC

    const product = productRepo.create({
      ...productData,
      userId: user.id,
      subcategoryId,
      pid: `TEST${String(i + 1).padStart(3, '0')}`,
    });

    const savedProduct = await productRepo.save(product);

    // Create product images
    for (let j = 0; j < productData.images.length; j++) {
      const image = productImageRepo.create({
        productId: savedProduct.id,
        url: productData.images[j],
        publicId: `test_image_${savedProduct.id}_${j}`,
        format: 'jpg',
        bytes: 150000,
        width: 800,
        height: 600,
        order: j,
      });
      await productImageRepo.save(image);
    }

    savedProducts.push(savedProduct);
  }

  return savedProducts;
}

async function createSupportCases(user: User, admin: AdminUser) {
  const supportCaseRepo = AppDataSource.getRepository(SupportCase);
  const supportMessageRepo = AppDataSource.getRepository(SupportMessage);

  // Check if support cases already exist for this user
  const existingCases = await supportCaseRepo.find({ where: { userId: user.id } });
  if (existingCases.length > 0) {
    console.log(`   Support cases already exist for test user (${existingCases.length} found), skipping creation`);
    return existingCases;
  }

  const casesData = [
    {
      subject: 'Issue with product listing',
      status: 'open',
      priority: 'normal',
      category: 'technical',
      messages: [
        {
          content: 'Hi, I\'m having trouble listing my iPhone for sale. The images aren\'t uploading properly.',
          isFromAdmin: false,
        },
        {
          content: 'Hello! I\'ll help you with that. Can you try clearing your browser cache and trying again?',
          isFromAdmin: true,
        },
        {
          content: 'Thanks! That worked. But now I can\'t set the price. It keeps showing an error.',
          isFromAdmin: false,
        },
      ]
    },
    {
      subject: 'Payment not received',
      status: 'in_progress',
      priority: 'high',
      category: 'payment',
      assignedAdminId: admin.id,
      messages: [
        {
          content: 'I sold my MacBook yesterday but haven\'t received the payment yet. It\'s been 24 hours.',
          isFromAdmin: false,
        },
        {
          content: 'I\'m investigating this payment issue. Can you provide the transaction ID?',
          isFromAdmin: true,
        },
      ]
    },
    {
      subject: 'Account verification question',
      status: 'resolved',
      priority: 'low',
      category: 'account',
      resolvedAt: new Date(),
      messages: [
        {
          content: 'How long does account verification usually take?',
          isFromAdmin: false,
        },
        {
          content: 'Account verification typically takes 24-48 hours. You\'ll receive an email once it\'s complete.',
          isFromAdmin: true,
        },
        {
          content: 'Thank you for the information!',
          isFromAdmin: false,
        },
      ]
    },
  ];

  const savedCases = [];

  for (const caseData of casesData) {
    const { messages, ...caseFields } = caseData;
    const supportCase = supportCaseRepo.create({
      ...caseFields,
      userId: user.id,
    });

    const savedCase = await supportCaseRepo.save(supportCase);

    // Create messages
    for (let i = 0; i < messages.length; i++) {
      const messageData = messages[i];
      const message = supportMessageRepo.create({
        caseId: savedCase.id,
        senderId: messageData.isFromAdmin ? admin.id.toString() : user.id,
        senderType: messageData.isFromAdmin ? 'admin' : 'user',
        content: messageData.content,
      });
      await supportMessageRepo.save(message);
    }

    savedCases.push(savedCase);
  }

  return savedCases;
}

async function createReviews(products: Product[], user: User) {
  const reviewRepo = AppDataSource.getRepository(Review);

  // Check if reviews already exist for this user
  const existingReviews = await reviewRepo.find({ where: { userId: user.id } });
  if (existingReviews.length > 0) {
    console.log(`   Reviews already exist for test user (${existingReviews.length} found), skipping creation`);
    return;
  }

  const reviewsData = [
    {
      productId: products[0].id, // iPhone
      rating: 5,
      comment: 'Excellent product! Exactly as described. Fast shipping and great communication.',
    },
    {
      productId: products[1].id, // MacBook
      rating: 4,
      comment: 'Great laptop, very satisfied with the purchase. Minor wear but nothing major.',
    },
    {
      productId: products[2].id, // Honda Civic
      rating: 5,
      comment: 'Amazing car! Well maintained and exactly as advertised. Highly recommend!',
    },
  ];

  for (const reviewData of reviewsData) {
    const review = reviewRepo.create({
      ...reviewData,
      userId: user.id,
    });
    await reviewRepo.save(review);
  }
}

async function createFavorites(products: Product[], user: User) {
  const favoriteRepo = AppDataSource.getRepository(Favorite);

  // Check if favorites already exist for this user
  const existingFavorites = await favoriteRepo.find({ where: { userId: user.id } });
  if (existingFavorites.length > 0) {
    console.log(`   Favorites already exist for test user (${existingFavorites.length} found), skipping creation`);
    return;
  }

  // User favorites some products
  const favoriteProducts = products.slice(0, 3); // First 3 products

  for (const product of favoriteProducts) {
    const favorite = favoriteRepo.create({
      userId: user.id,
      productId: product.id,
    });
    await favoriteRepo.save(favorite);
  }
}

// Run the seed script
if (import.meta.main) {
  seedDatabase()
    .then(() => {
      console.log('\n🎉 Seeding completed! You can now test the API with the test data.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
