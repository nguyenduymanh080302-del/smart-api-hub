interface FindManyOptions {
    /** List of columns to select from the database */
    fields?: string[];
    /** Key-value filters, supports suffixes like _gte, _lte, _ne, and _like */
    filters?: Record<string, any>;
    /** Global query string search across string/text columns */
    q?: string;
    /** Column name to sort by */
    sort?: string;
    /** Sort direction: "asc" or "desc" */
    order?: string;
    /** Active page index (1-based) */
    page?: number;
    /** Number of records to return per page */
    limit?: number;
    /** Parent tables to expand (embed parent objects) */
    expand?: string[];
    /** Child tables to embed (nest children arrays) */
    embed?: string[];
}

interface CacheEntry {
    data: any
    expiresAt: number
}