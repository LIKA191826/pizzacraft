/**
 * Static export for GitHub Pages.
 *
 * The site is served from a PROJECT page — https://<user>.github.io/pizzacraft/
 * — so every asset and route must be prefixed with `/pizzacraft`. That prefix
 * is only correct in a production build; local `next dev` stays at the root so
 * the preview keeps working at http://localhost:3000/.
 */
const isProd = process.env.NODE_ENV === "production";
const repo = "pizzacraft";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
  // GitHub Pages has no image optimizer; serve images as-is.
  images: { unoptimized: true },
  // Emit `out/foo/index.html` so refreshes on any path resolve on Pages.
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
