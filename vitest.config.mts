import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
	test: {
		include: ["test/**/*.spec.ts"],
		poolOptions: {
			workers: {
				wrangler: { configPath: "./wrangler.jsonc" },
				miniflare: { bindings: { ACCESS_TEAM_DOMAIN: "https://image-auth-tests.cloudflareaccess.com", ACCESS_AUD: "1".repeat(64) } },
			},
		},
	},
});
