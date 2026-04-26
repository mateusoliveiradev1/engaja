import {
  createDatabaseConnection,
  loadDatabaseConfig,
} from "../../db/client.js";
import { createDrizzleMediaRepository } from "../repository.js";
import { createMediaService } from "../service.js";
import { createStorageAdapterFromEnvironment } from "../storage.js";

async function main(): Promise<void> {
  const connection = createDatabaseConnection(loadDatabaseConfig());

  try {
    const mediaService = createMediaService({
      repository: createDrizzleMediaRepository(connection.db),
      storage: createStorageAdapterFromEnvironment(),
    });
    const result = await mediaService.runCleanup();

    console.log(
      JSON.stringify(
        {
          cleanedIntentCount: result.cleanedIntentCount,
          deletedObjectCount: result.deletedObjectCount,
        },
        null,
        2,
      ),
    );
  } finally {
    await connection.close();
  }
}

void main();
