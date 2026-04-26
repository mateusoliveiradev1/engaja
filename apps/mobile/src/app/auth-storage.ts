export interface MobileAuthStorage {
  clearSessionToken(): Promise<void>;
  getSessionToken(): Promise<string | undefined>;
  setSessionToken(sessionToken: string): Promise<void>;
}

interface SecureStoreModule {
  deleteItemAsync(key: string): Promise<void>;
  getItemAsync(key: string): Promise<string | null>;
  isAvailableAsync?: () => Promise<boolean>;
  setItemAsync(key: string, value: string): Promise<void>;
}

const SESSION_TOKEN_STORAGE_KEY = "engaja.auth.sessionToken";

let memorySessionToken: string | undefined;

export const secureStoreAuthStorage: MobileAuthStorage = {
  async clearSessionToken() {
    const secureStore = await loadAvailableSecureStore();

    if (secureStore !== undefined) {
      try {
        await secureStore.deleteItemAsync(SESSION_TOKEN_STORAGE_KEY);
      } catch {
        // Web previews can load the SecureStore shim but reject operations.
      }
    }

    getWebStorage()?.removeItem(SESSION_TOKEN_STORAGE_KEY);
    memorySessionToken = undefined;
  },
  async getSessionToken() {
    const secureStore = await loadAvailableSecureStore();

    if (secureStore !== undefined) {
      try {
        const token = await secureStore.getItemAsync(SESSION_TOKEN_STORAGE_KEY);

        return token ?? undefined;
      } catch {
        // Fall back to browser storage when SecureStore is unavailable on web.
      }
    }

    return getWebStorage()?.getItem(SESSION_TOKEN_STORAGE_KEY) ?? memorySessionToken;
  },
  async setSessionToken(sessionToken) {
    const secureStore = await loadAvailableSecureStore();

    if (secureStore !== undefined) {
      try {
        await secureStore.setItemAsync(SESSION_TOKEN_STORAGE_KEY, sessionToken);
        return;
      } catch {
        // Fall back to browser storage when SecureStore is unavailable on web.
      }
    }

    getWebStorage()?.setItem(SESSION_TOKEN_STORAGE_KEY, sessionToken);
    memorySessionToken = sessionToken;
  },
};

export function createMemoryAuthStorage(initialSessionToken?: string): MobileAuthStorage & {
  read(): string | undefined;
} {
  let currentSessionToken = initialSessionToken;

  return {
    clearSessionToken() {
      currentSessionToken = undefined;
      return Promise.resolve();
    },
    getSessionToken() {
      return Promise.resolve(currentSessionToken);
    },
    read() {
      return currentSessionToken;
    },
    setSessionToken(sessionToken) {
      currentSessionToken = sessionToken;
      return Promise.resolve();
    },
  };
}

async function loadAvailableSecureStore(): Promise<SecureStoreModule | undefined> {
  try {
    const secureStore = await loadSecureStore();

    if (secureStore === undefined) {
      return undefined;
    }

    if (secureStore.isAvailableAsync === undefined) {
      return secureStore;
    }

    return (await secureStore.isAvailableAsync()) ? secureStore : undefined;
  } catch {
    return undefined;
  }
}

async function loadSecureStore(): Promise<SecureStoreModule | undefined> {
  try {
    return await import("expo-secure-store");
  } catch {
    return undefined;
  }
}

function getWebStorage():
  | {
      getItem(key: string): string | null;
      removeItem(key: string): void;
      setItem(key: string, value: string): void;
    }
  | undefined {
  return (
    globalThis as {
      localStorage?: {
        getItem(key: string): string | null;
        removeItem(key: string): void;
        setItem(key: string, value: string): void;
      };
    }
  ).localStorage;
}
