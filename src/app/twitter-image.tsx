// Twitter card variant — identical composition to the Open Graph image.
// 1200x630 works for both `summary_large_image` (Twitter) and Open Graph,
// so there's no reason to fork the design. The image factory is re-exported
// from opengraph-image; `runtime` must be declared statically per route per
// Next.js route-segment-config rules (re-exporting it fails the build).
export { default, alt, size, contentType } from "./opengraph-image";

export const runtime = "nodejs";
