import { AppDataSource } from "../src/data-source.js";

import { User } from "../src/entities/User.js";

import { Product } from "../src/entities/Product.js";

(async () => {
  await AppDataSource.initialize();

  const u = await AppDataSource.getRepository(User).save({
    email: `t${Date.now()}@ex.com`,
    passwordHash: "x",
    name: "Test User",
  });

  const p = await AppDataSource.getRepository(Product).save({
    name: "Test",
    description: "Test product",
    price: 100,
    status: "active",
    userId: u.id,
  });

  const loaded = await AppDataSource.getRepository(Product).findOne({
    where: { id: p.id },
    relations: { user: true },
  });

  console.log({ userId: u.id, productUserId: loaded?.user?.id });

  await AppDataSource.destroy();
})();
