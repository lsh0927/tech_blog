/**
 * Links Data Builder
 *
 * This script builds a unified links data file that includes:
 * - Explicit wiki links [[post-name]]
 * - AI-suggested similar posts (from embeddings)
 * - Backlinks (both explicit and AI-suggested)
 * - Graph data with link type differentiation
 *
 * Usage: npx tsx scripts/build-links-data.ts
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Types
interface EmbeddingData {
  slug: string;
  title: string;
  tags: string[];
  embedding: number[];
}

interface EmbeddingsCache {
  version: string;
  posts: EmbeddingData[];
}

interface PostData {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  tags: string[];
  content: string;
  explicitLinks: string[]; // [[wiki-links]] found in content
}

interface LinkEntry {
  slug: string;
  title: string;
  score?: number; // similarity score for AI suggestions
}

interface BacklinksEntry {
  explicit: LinkEntry[]; // posts that explicitly link to this post
  aiSuggested: LinkEntry[]; // AI-suggested related posts
}

interface GraphNode {
  id: string;
  title: string;
  tags: string[];
  group: number;
  connections: number;
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: 'explicit' | 'ai'; // Link type for visualization
}

interface LinksData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  backlinks: Record<string, BacklinksEntry>;
  postMeta: Record<string, { title: string; tags: string[]; excerpt?: string }>;
  generatedAt: string;
}

// Configuration
const POSTS_DIR = path.join(process.cwd(), 'src/content/posts');
const EMBEDDINGS_FILE = path.join(process.cwd(), 'public/embeddings.json');
const LINKS_FILE = path.join(process.cwd(), 'public/links-data.json');
const SIMILARITY_THRESHOLD = 0.65;
const MAX_AI_SUGGESTIONS = 5;

// Wiki link regex: [[page-name]] or [[page-name|display text]]
const WIKI_LINK_REGEX = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

/**
 * Parse wiki links from MDX content
 */
function parseWikiLinks(content: string): string[] {
  const links: string[] = [];
  let match;

  while ((match = WIKI_LINK_REGEX.exec(content)) !== null) {
    const linkTarget = match[1].trim().toLowerCase().replace(/\s+/g, '-');
    if (!links.includes(linkTarget)) {
      links.push(linkTarget);
    }
  }

  return links;
}

/**
 * Read all MDX posts and parse wiki links
 */
function readPosts(): PostData[] {
  const posts: PostData[] = [];

  if (!fs.existsSync(POSTS_DIR)) {
    console.log('No posts directory found.');
    return posts;
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'));

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    const slug = file.replace('.mdx', '');
    const explicitLinks = parseWikiLinks(content);

    posts.push({
      slug,
      title: data.title || slug,
      date: data.date?.toString() || new Date().toISOString(),
      excerpt: data.excerpt,
      tags: data.tags || [],
      content,
      explicitLinks,
    });
  }

  return posts;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Get AI-suggested similar posts based on embeddings
 */
function getAISuggestions(
  slug: string,
  embeddings: EmbeddingData[],
  explicitLinks: string[]
): LinkEntry[] {
  const currentPost = embeddings.find((e) => e.slug === slug);
  if (!currentPost) return [];

  const suggestions: { slug: string; title: string; score: number }[] = [];

  for (const other of embeddings) {
    if (other.slug === slug) continue;
    // Skip if already explicitly linked
    if (explicitLinks.includes(other.slug)) continue;

    const similarity = cosineSimilarity(currentPost.embedding, other.embedding);
    if (similarity >= SIMILARITY_THRESHOLD) {
      suggestions.push({
        slug: other.slug,
        title: other.title,
        score: Math.round(similarity * 100) / 100,
      });
    }
  }

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_AI_SUGGESTIONS);
}

/**
 * Assign group based on primary tag
 */
function assignGroup(tags: string[], tagGroups: Map<string, number>): number {
  if (tags.length === 0) return 0;
  const primaryTag = tags[0];
  if (!tagGroups.has(primaryTag)) {
    tagGroups.set(primaryTag, tagGroups.size);
  }
  return tagGroups.get(primaryTag) || 0;
}

/**
 * Main function
 */
async function main() {
  console.log('🔗 Building unified links data...\n');

  // Read posts
  const posts = readPosts();
  console.log(`📚 Found ${posts.length} posts`);

  // Load embeddings
  let embeddings: EmbeddingData[] = [];
  if (fs.existsSync(EMBEDDINGS_FILE)) {
    const embeddingsData: EmbeddingsCache = JSON.parse(
      fs.readFileSync(EMBEDDINGS_FILE, 'utf-8')
    );
    embeddings = embeddingsData.posts;
    console.log(`📊 Loaded ${embeddings.length} embeddings`);
  }

  // Create slug-to-post mapping
  const postMap = new Map<string, PostData>();
  for (const post of posts) {
    postMap.set(post.slug, post);
  }

  // Build edges (both explicit and AI)
  const edges: GraphEdge[] = [];
  const connectionCount = new Map<string, number>();

  // Process explicit links
  console.log('\n🔍 Processing explicit wiki links...');
  let explicitLinkCount = 0;
  for (const post of posts) {
    for (const targetSlug of post.explicitLinks) {
      // Only add edge if target post exists
      if (postMap.has(targetSlug)) {
        edges.push({
          source: post.slug,
          target: targetSlug,
          weight: 1.0,
          type: 'explicit',
        });
        connectionCount.set(post.slug, (connectionCount.get(post.slug) || 0) + 1);
        connectionCount.set(targetSlug, (connectionCount.get(targetSlug) || 0) + 1);
        explicitLinkCount++;
      }
    }
  }
  console.log(`   Found ${explicitLinkCount} explicit links`);

  // Process AI suggestions
  console.log('🤖 Processing AI suggestions...');
  const aiSuggestionsMap = new Map<string, LinkEntry[]>();
  let aiLinkCount = 0;

  for (const post of posts) {
    const suggestions = getAISuggestions(post.slug, embeddings, post.explicitLinks);
    aiSuggestionsMap.set(post.slug, suggestions);

    for (const suggestion of suggestions) {
      // Avoid duplicate edges (check both directions)
      const edgeExists = edges.some(
        (e) =>
          (e.source === post.slug && e.target === suggestion.slug) ||
          (e.source === suggestion.slug && e.target === post.slug)
      );

      if (!edgeExists) {
        edges.push({
          source: post.slug,
          target: suggestion.slug,
          weight: suggestion.score!,
          type: 'ai',
        });
        connectionCount.set(post.slug, (connectionCount.get(post.slug) || 0) + 1);
        connectionCount.set(
          suggestion.slug,
          (connectionCount.get(suggestion.slug) || 0) + 1
        );
        aiLinkCount++;
      }
    }
  }
  console.log(`   Generated ${aiLinkCount} AI-suggested links`);

  // Build backlinks
  console.log('\n📎 Building backlinks...');
  const backlinks: Record<string, BacklinksEntry> = {};

  for (const post of posts) {
    backlinks[post.slug] = {
      explicit: [],
      aiSuggested: aiSuggestionsMap.get(post.slug) || [],
    };
  }

  // Populate explicit backlinks
  for (const post of posts) {
    for (const targetSlug of post.explicitLinks) {
      if (backlinks[targetSlug]) {
        backlinks[targetSlug].explicit.push({
          slug: post.slug,
          title: post.title,
        });
      }
    }
  }

  // Build nodes
  const tagGroups = new Map<string, number>();
  const nodes: GraphNode[] = posts.map((post) => ({
    id: post.slug,
    title: post.title,
    tags: post.tags,
    group: assignGroup(post.tags, tagGroups),
    connections: connectionCount.get(post.slug) || 0,
  }));

  // Build post metadata
  const postMeta: Record<string, { title: string; tags: string[]; excerpt?: string }> =
    {};
  for (const post of posts) {
    postMeta[post.slug] = {
      title: post.title,
      tags: post.tags,
      excerpt: post.excerpt,
    };
  }

  // Create final data structure
  const linksData: LinksData = {
    nodes,
    edges,
    backlinks,
    postMeta,
    generatedAt: new Date().toISOString(),
  };

  // Save to file
  fs.writeFileSync(LINKS_FILE, JSON.stringify(linksData, null, 2));

  // Print statistics
  console.log(`\n✨ Links data built successfully!`);
  console.log(`   Nodes: ${nodes.length}`);
  console.log(`   Total edges: ${edges.length}`);
  console.log(`   - Explicit: ${edges.filter((e) => e.type === 'explicit').length}`);
  console.log(`   - AI-suggested: ${edges.filter((e) => e.type === 'ai').length}`);
  console.log(`   Tag groups: ${tagGroups.size}`);
  console.log(`\n📁 Saved to: ${LINKS_FILE}`);

  // Show tag groups
  if (tagGroups.size > 0) {
    console.log(`\n🏷️  Tag groups:`);
    for (const [tag, group] of tagGroups) {
      console.log(`   ${group}: ${tag}`);
    }
  }
}

main().catch(console.error);
