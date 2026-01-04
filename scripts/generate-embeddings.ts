/**
 * AI Embeddings Generator
 *
 * This script generates OpenAI embeddings for all blog posts
 * and saves them to a JSON file for graph generation.
 *
 * Usage: npx tsx scripts/generate-embeddings.ts
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import OpenAI from 'openai';

// Types
interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  tags: string[];
  content: string;
}

interface EmbeddingData {
  slug: string;
  title: string;
  tags: string[];
  embedding: number[];
  updatedAt: string;
}

interface EmbeddingsCache {
  version: string;
  posts: EmbeddingData[];
}

// Configuration
const POSTS_DIR = path.join(process.cwd(), 'src/content/posts');
const EMBEDDINGS_FILE = path.join(process.cwd(), 'public/embeddings.json');
const MODEL = 'text-embedding-3-small';
const MAX_TOKENS = 8000; // Approximate max input for embedding

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Read all MDX posts from the content directory
 */
function readPosts(): PostMeta[] {
  const posts: PostMeta[] = [];

  if (!fs.existsSync(POSTS_DIR)) {
    console.log('No posts directory found. Creating...');
    fs.mkdirSync(POSTS_DIR, { recursive: true });
    return posts;
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'));

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data, content: mdxContent } = matter(content);

    const slug = file.replace('.mdx', '');

    posts.push({
      slug,
      title: data.title || slug,
      date: data.date?.toString() || new Date().toISOString(),
      excerpt: data.excerpt,
      tags: data.tags || [],
      content: mdxContent,
    });
  }

  return posts;
}

/**
 * Load existing embeddings cache
 */
function loadCache(): EmbeddingsCache | null {
  try {
    if (fs.existsSync(EMBEDDINGS_FILE)) {
      const data = fs.readFileSync(EMBEDDINGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('No valid cache found, will regenerate all embeddings.');
  }
  return null;
}

/**
 * Prepare text for embedding
 * 제목 + 태그만 사용하여 비용 절감 (본문 제외)
 */
function prepareTextForEmbedding(post: PostMeta): string {
  // 제목과 태그만 사용 (본문 제외로 비용 절감)
  const parts = [post.title, post.tags.join(' ')];

  // excerpt가 있으면 추가 (짧은 요약이므로 비용 영향 적음)
  if (post.excerpt) {
    parts.push(post.excerpt);
  }

  return parts.join(' | ');
}

/**
 * Generate embedding for a single post
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: MODEL,
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting embedding generation...\n');

  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is not set.');
    console.log('\nTo set it:');
    console.log('  export OPENAI_API_KEY=your-api-key');
    process.exit(1);
  }

  // Read posts
  const posts = readPosts();
  console.log(`📚 Found ${posts.length} posts\n`);

  if (posts.length === 0) {
    console.log('No posts to process.');
    // Create empty embeddings file
    const emptyCache: EmbeddingsCache = {
      version: '1.0',
      posts: [],
    };
    fs.writeFileSync(EMBEDDINGS_FILE, JSON.stringify(emptyCache, null, 2));
    return;
  }

  // Load cache
  const cache = loadCache();
  const cachedEmbeddings = new Map<string, EmbeddingData>();
  if (cache) {
    for (const post of cache.posts) {
      cachedEmbeddings.set(post.slug, post);
    }
    console.log(`📦 Loaded ${cachedEmbeddings.size} cached embeddings\n`);
  }

  // Process each post
  const newEmbeddings: EmbeddingData[] = [];
  let newCount = 0;
  let cachedCount = 0;

  for (const post of posts) {
    const cached = cachedEmbeddings.get(post.slug);

    // Check if we can use cached embedding
    // (In a real scenario, you'd check file modification time)
    if (cached) {
      console.log(`✅ Using cached: ${post.title}`);
      newEmbeddings.push(cached);
      cachedCount++;
      continue;
    }

    // Generate new embedding
    console.log(`🔄 Generating: ${post.title}`);
    const text = prepareTextForEmbedding(post);

    try {
      const embedding = await generateEmbedding(text);
      newEmbeddings.push({
        slug: post.slug,
        title: post.title,
        tags: post.tags,
        embedding,
        updatedAt: new Date().toISOString(),
      });
      newCount++;

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Failed to generate embedding for ${post.slug}:`, error);
    }
  }

  // Save embeddings
  const output: EmbeddingsCache = {
    version: '1.0',
    posts: newEmbeddings,
  };

  // Ensure public directory exists
  const publicDir = path.dirname(EMBEDDINGS_FILE);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(EMBEDDINGS_FILE, JSON.stringify(output, null, 2));

  console.log(`\n✨ Done!`);
  console.log(`   New embeddings: ${newCount}`);
  console.log(`   Cached embeddings: ${cachedCount}`);
  console.log(`   Total: ${newEmbeddings.length}`);
  console.log(`\n📁 Saved to: ${EMBEDDINGS_FILE}`);
}

main().catch(console.error);
