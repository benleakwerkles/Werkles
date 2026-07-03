/**
 * Supabase storage adapter stub.
 * Real implementation requires schema, bucket, and service-role credentials (human gates).
 */

export function createSupabaseStorageAdapter(config) {
  return {
    isConfigured() {
      return Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
    },

    async storeJobAssets(_job) {
      throw new Error(
        "Supabase storage is not implemented. Clear SQL/schema and credential gates first."
      );
    },
  };
}
