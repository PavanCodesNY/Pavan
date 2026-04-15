#!/usr/bin/env npx tsx
/**
 * Usage: npx tsx scripts/add-highlight.ts <url>
 *
 * Scrapes a LinkedIn or X post URL and creates a markdown highlight file
 * in content/highlights/ with the post text, image, and metadata.
 *
 * For LinkedIn: extracts og:image, og:description, and date from activity ID.
 * For X: extracts og:image, og:description from the page meta tags.
 */

import fs from "fs";
import path from "path";
import https from "https";
import http from "http";

const CONTENT_DIR = path.join(process.cwd(), "content", "highlights");
const IMAGE_DIR = path.join(process.cwd(), "public", "highlights");

function detectPlatform(url: string): "linkedin" | "x" | "instagram" {
  if (url.includes("linkedin.com")) return "linkedin";
  if (url.includes("twitter.com") || url.includes("x.com")) return "x";
  if (url.includes("instagram.com")) return "instagram";
  throw new Error(`Unknown platform for URL: ${url}`);
}

function extractLinkedInDate(url: string): Date | null {
  // LinkedIn activity IDs encode a timestamp.
  // Activity ID format: the first ~41 bits are a millisecond timestamp
  // offset from LinkedIn epoch (not Unix epoch).
  // Simpler: extract from the URL's activity number.
  const match = url.match(/activity-(\d+)/);
  if (!match) return null;
  const activityId = BigInt(match[1]);
  // LinkedIn uses a custom epoch; the top bits of the ID encode ms since ~2010
  // Shift right by 22 bits to get the timestamp, add LinkedIn epoch offset
  const timestamp = Number(activityId >> 22n) + 1288834974657;
  const date = new Date(timestamp);
  if (date.getFullYear() > 2020 && date.getFullYear() < 2030) return date;
  return null;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateSlug(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function fetchHTML(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchHTML(res.headers.location).then(resolve).catch(reject);
          return;
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
        res.on("error", reject);
      }
    ).on("error", reject);
  });
}

async function downloadImage(
  imageUrl: string,
  destPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanUrl = imageUrl.replace(/&amp;/g, "&");
    const client = cleanUrl.startsWith("https") ? https : http;
    client.get(
      cleanUrl,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          downloadImage(res.headers.location, destPath)
            .then(resolve)
            .catch(reject);
          return;
        }
        const stream = fs.createWriteStream(destPath);
        res.pipe(stream);
        stream.on("finish", () => {
          stream.close();
          resolve();
        });
        stream.on("error", reject);
      }
    ).on("error", reject);
  });
}

function extractMeta(
  html: string,
  property: string
): string | null {
  // Try property="..." content="..."
  const re1 = new RegExp(
    `property="${property}"\\s+content="([^"]*)"`,
    "i"
  );
  const m1 = html.match(re1);
  if (m1) return m1[1];

  // Try content="..." property="..."
  const re2 = new RegExp(
    `content="([^"]*)"\\s+property="${property}"`,
    "i"
  );
  const m2 = html.match(re2);
  if (m2) return m2[1];

  return null;
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: npx tsx scripts/add-highlight.ts <url>");
    process.exit(1);
  }

  // Validate URL
  if (!/^https?:\/\/.+/i.test(url)) {
    console.error(`Invalid URL: "${url}". Must be a valid http/https URL.`);
    process.exit(1);
  }

  const platform = detectPlatform(url);
  console.log(`Platform: ${platform}`);

  // Fetch the page
  console.log("Fetching post...");
  const html = await fetchHTML(url);

  // Extract metadata — try multiple meta tags
  let ogImage = extractMeta(html, "og:image");
  let ogDesc =
    extractMeta(html, "og:description") ||
    extractMeta(html, "twitter:description") ||
    extractMeta(html, "description");

  // For X/Twitter: if og tags are empty, try fxtwitter as fallback
  if (!ogDesc && platform === "x") {
    const fxUrl = url.replace(/x\.com|twitter\.com/, "fxtwitter.com");
    console.log("X meta tags empty, trying fxtwitter fallback...");
    const fxHtml = await fetchHTML(fxUrl);
    ogDesc =
      extractMeta(fxHtml, "og:description") ||
      extractMeta(fxHtml, "twitter:description");
    if (!ogImage) ogImage = extractMeta(fxHtml, "og:image");
  }

  if (!ogDesc) {
    console.error("Could not extract post content from any meta tags");
    process.exit(1);
  }

  // Clean up content
  let content = decodeEntities(ogDesc);
  // Remove trailing " | N comments on LinkedIn" or similar
  content = content.replace(/\s*\|\s*\d+\s*comments?\s*(on\s+LinkedIn)?\s*$/i, "");
  content = content.trim();

  console.log(`Content: ${content.slice(0, 80)}...`);

  // Determine date
  let date: Date;
  if (platform === "linkedin") {
    date = extractLinkedInDate(url) || new Date();
  } else {
    date = new Date();
  }
  console.log(`Date: ${formatDate(date)}`);

  // Create slug
  const dateSlug = formatDateSlug(date);
  const textSlug = slugify(content.slice(0, 60));
  const fileSlug = `${dateSlug}-${textSlug}`;

  // Download image if available
  let imagePath: string | undefined;
  if (ogImage) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
    const ext = ".jpg";
    const imageFile = `${fileSlug}${ext}`;
    const destPath = path.join(IMAGE_DIR, imageFile);
    console.log("Downloading image...");
    await downloadImage(ogImage, destPath);
    imagePath = `/highlights/${imageFile}`;
    console.log(`Image saved: ${imagePath}`);
  }

  // Build frontmatter
  const frontmatter = [
    "---",
    `platform: ${platform}`,
    `date: ${formatDate(date)}`,
    `url: ${url.split("?")[0]}`,
  ];
  if (imagePath) {
    frontmatter.push(`image: ${imagePath}`);
  }
  frontmatter.push("---");

  const markdown = `${frontmatter.join("\n")}\n\n${content}\n`;

  // Write file
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  const filePath = path.join(CONTENT_DIR, `${fileSlug}.md`);
  fs.writeFileSync(filePath, markdown, "utf-8");
  console.log(`\nCreated: ${filePath}`);
  console.log("Done! Commit and push to deploy.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
