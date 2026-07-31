import { SENSITIVE_FIELDS } from "./constant";

export const removeSensitiveFields = (obj: any) => {
    delete obj.password;
    return obj;
};
