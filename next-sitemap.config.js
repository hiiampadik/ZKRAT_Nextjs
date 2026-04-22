/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://zkratkolektiv.com",
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  outDir: process.env.GITHUB_PAGES === "true" ? "./out" : "./public",
};