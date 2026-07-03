(function () {
  const DEFAULT_BASE = "http://127.0.0.1:8787";

  class WerklesApiClient {
    constructor(baseUrl = DEFAULT_BASE) {
      this.baseUrl = baseUrl.replace(/\/$/, "");
      this.token = localStorage.getItem("werkles_api_token") || "";
      this.user = null;
      this.connected = false;
    }

    async request(path, options = {}) {
      const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      };

      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers,
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || `Request failed: ${response.status}`);
      }
      return body;
    }

    async connect() {
      await this.request("/health");
      this.connected = true;
      return true;
    }

    async login(email = "demo@werkles.local") {
      const result = await this.request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      this.token = result.token;
      this.user = result.user;
      localStorage.setItem("werkles_api_token", this.token);
      return result;
    }

    async restoreSession() {
      if (!this.token) return null;
      const result = await this.request("/auth/session");
      this.user = result.user;
      return result;
    }

    async getMatchingSnapshot(query = {}) {
      const params = new URLSearchParams(query);
      const suffix = params.toString() ? `?${params}` : "";
      return this.request(`/matching/snapshot${suffix}`);
    }

    async updateProfile(profile) {
      return this.request("/matching/profile", {
        method: "PUT",
        body: JSON.stringify(profile),
      });
    }

    async getProofStatus() {
      return this.request("/proof/status");
    }

    async setProofChecks(checks) {
      return this.request("/proof/status", {
        method: "PUT",
        body: JSON.stringify({ checks }),
      });
    }

    async addIntro(profileId) {
      return this.request("/intros", {
        method: "POST",
        body: JSON.stringify({ profileId }),
      });
    }

    async removeIntro(profileId) {
      return this.request(`/intros/${profileId}`, { method: "DELETE" });
    }

    async clearIntros() {
      return this.request("/intros", { method: "DELETE" });
    }

    async toggleShortlist(profileId) {
      return this.request("/matching/shortlist", {
        method: "POST",
        body: JSON.stringify({ profileId }),
      });
    }

    async getBillingStatus() {
      return this.request("/billing/status");
    }

    async createCheckoutSession(planId = "partner") {
      return this.request("/billing/checkout-session", {
        method: "POST",
        body: JSON.stringify({ planId }),
      });
    }
  }

  window.WerklesApi = new WerklesApiClient(window.WERKLES_API_URL || DEFAULT_BASE);
})();
