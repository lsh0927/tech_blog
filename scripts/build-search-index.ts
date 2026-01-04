/**
 * Search Index Builder
 *
 * This script builds a search index for Fuse.js client-side search.
 * The index includes post titles, excerpts, tags, and content snippets.
 *
 * Usage: npx tsx scripts/build-search-index.ts
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Types
interface SearchEntry {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  content: string; // First ~500 chars of content for search
  date: string;
}

interface SearchIndex {
  entries: SearchEntry[];
  generatedAt: string;
}

// Configuration
const POSTS_DIR = path.join(process.cwd(), 'src/content/posts');
const SEARCH_INDEX_FILE = path.join(process.cwd(), 'public/search-index.json');
const CONTENT_PREVIEW_LENGTH = 500;

/**
 * Strip MDX/Markdown syntax for cleaner search text
 */
function stripMarkdown(content: string): string {
  return content
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`[^`]+`/g, '')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove wiki links but keep text
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, link, text) => text || link)
    // Remove images
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove MDX component tags
    .replace(/<\/?[A-Z][^>]*>/g, '')
    // Remove headers markers
    .replace(/^#+\s+/gm, '')
    // Remove emphasis markers
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Read all MDX posts and create search entries
 */
function buildSearchEntries(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  if (!fs.existsSync(POSTS_DIR)) {
    console.log('No posts directory found.');
    return entries;
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'));

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    const slug = file.replace('.mdx', '');
    const strippedContent = stripMarkdown(content);
    const contentPreview = strippedContent.slice(0, CONTENT_PREVIEW_LENGTH);

    entries.push({
      slug,
      title: data.title || slug,
      excerpt: data.excerpt || contentPreview.slice(0, 150),
      tags: data.tags || [],
      content: contentPreview,
      date: data.date?.toString() || new Date().toISOString(),
    });
  }

  // Sort by date (newest first)
  entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return entries;
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Building search index...\n');

  const entries = buildSearchEntries();
  console.log(`📚 Indexed ${entries.length} posts`);

  const searchIndex: SearchIndex = {
    entries,
    generatedAt: new Date().toISOString(),
  };

  // Ensure public directory exists
  const publicDir = path.dirname(SEARCH_INDEX_FILE);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(SEARCH_INDEX_FILE, JSON.stringify(searchIndex, null, 2));

  console.log(`\n✨ Search index built successfully!`);
  console.log(`📁 Saved to: ${SEARCH_INDEX_FILE}`);

  // Show sample entries
  if (entries.length > 0) {
    console.log(`\n📋 Sample entries:`);
    for (const entry of entries.slice(0, 3)) {
      console.log(`   - ${entry.title} (${entry.tags.join(', ')})`);
    }
  }
}

main().catch(console.error);
