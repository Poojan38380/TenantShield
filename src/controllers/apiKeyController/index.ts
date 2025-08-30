import { createApiKey } from "./createApiKey.ts";
import { getApiKeys } from "./getApiKeys.ts";
import { revokeApiKey } from "./revokeApiKey.ts";
import { rotateApiKey } from "./rotateApiKey.ts";
import { deleteApiKey } from "./deleteApiKey.ts";

export const apiKeyController = {
    createApiKey,
    getApiKeys,
    revokeApiKey,
    rotateApiKey,
    deleteApiKey,
};

