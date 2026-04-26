import { createDatabaseConnection } from "../client.js";
import { applyDevelopmentSeed, assertDevelopmentSeedWithinBudget } from "../seed/flv-store.js";

const connection = createDatabaseConnection();

try {
  assertDevelopmentSeedWithinBudget();
  const result = await applyDevelopmentSeed(connection.db);
  console.log(`Seeded FLV development dataset: ${result.insertedLabels.join(", ")}.`);
} finally {
  await connection.close();
}
