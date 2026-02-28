// open-next.config.ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
    // Enable minification to stay under the 3MiB limit for the Cloudflare Free plan
    minify: true,
});
