import { createApiKey } from "./createApiKey.js";
import { getApiKeys } from "./getApiKeys.js";
import { revokeApiKey } from "./revokeApiKey.js";
import { rotateApiKey } from "./rotateApiKey.js";
import { deleteApiKey } from "./deleteApiKey.js";

export const apiKeyController = {
    createApiKey,
    getApiKeys,
    revokeApiKey,
    rotateApiKey,
    deleteApiKey,
};

