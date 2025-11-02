import "reflect-metadata";

import { AppDataSource } from "../src/data-source.js";

import { User } from "../src/entities/User.js";

import { Product } from "../src/entities/Product.js";

(async () => {
  await AppDataSource.initialize();

  const userMeta = AppDataSource.getMetadata(User);

  const prodMeta = AppDataSource.getMetadata(Product);

  console.log(
    "User relations:",
    userMeta.relations.map((r) => r.propertyName)
  );

  console.log(
    "Product relations:",
    prodMeta.relations.map((r) => r.propertyName)
  );

  await AppDataSource.destroy();
})();
