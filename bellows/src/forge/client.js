/**
 * Ghost Forge client stub.
 * Does not call Render/Replicate. Use dry-run responses until deploy and billing gates clear.
 */

export function createForgeClient(config) {
  return {
    isConfigured() {
      return Boolean(config.ghostForgeUrl);
    },

    async fetchJobStatus(forgeJobId) {
      if (config.mode === "dry-run" || !config.ghostForgeUrl) {
        return {
          forgeJobId,
          status: "completed",
          assets: [
            {
              url: `dry-run://forge/${forgeJobId}/asset-0`,
              mimeType: "application/json",
            },
          ],
        };
      }

      throw new Error(
        "Live Ghost Forge calls are disabled. Set BELLOWS_MODE=dry-run or clear deploy gates."
      );
    },
  };
}
