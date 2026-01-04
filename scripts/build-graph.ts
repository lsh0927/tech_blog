/**
 * Graph Builder
 *
 * This script builds a knowledge graph from embeddings
 * by calculating cosine similarity between posts.
 *
 * Usage: npx tsx scripts/build-graph.ts
 */

import fs from 'fs';
import path from 'path';

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
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  generatedAt: string;
}

// Configuration
const EMBEDDINGS_FILE = path.join(process.cwd(), 'public/embeddings.json');
const GRAPH_FILE = path.join(process.cwd(), 'public/graph-data.json');
const SIMILARITY_THRESHOLD = 0.65; // Minimum similarity to create an edge
const MAX_EDGES_PER_NODE = 5; // Maximum connections per node

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Assign groups based on primary tag
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
  console.log('🔗 Building knowledge graph...\n');

  // Load embeddings
  if (!fs.existsSync(EMBEDDINGS_FILE)) {
    console.log('❌ No embeddings file found. Run generate-embeddings.ts first.');
    // Create empty graph
    const emptyGraph: GraphData = {
      nodes: [],
      edges: [],
      generatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(GRAPH_FILE, JSON.stringify(emptyGraph, null, 2));
    return;
  }

  const embeddingsData: EmbeddingsCache = JSON.parse(
    fs.readFileSync(EMBEDDINGS_FILE, 'utf-8')
  );

  const posts = embeddingsData.posts;
  console.log(`📚 Processing ${posts.length} posts\n`);

  if (posts.length === 0) {
    console.log('No posts to process.');
    const emptyGraph: GraphData = {
      nodes: [],
      edges: [],
      generatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(GRAPH_FILE, JSON.stringify(emptyGraph, null, 2));
    return;
  }

  // Calculate all pairwise similarities
  const similarities: { i: number; j: number; similarity: number }[] = [];

  console.log('📊 Calculating similarities...');
  for (let i = 0; i < posts.length; i++) {
    for (let j = i + 1; j < posts.length; j++) {
      const similarity = cosineSimilarity(posts[i].embedding, posts[j].embedding);

      if (similarity >= SIMILARITY_THRESHOLD) {
        similarities.push({ i, j, similarity });
      }
    }
  }

  // Sort by similarity (highest first)
  similarities.sort((a, b) => b.similarity - a.similarity);

  // Build edges with connection limit
  const connectionCount = new Map<number, number>();
  const edges: GraphEdge[] = [];

  for (const { i, j, similarity } of similarities) {
    const countI = connectionCount.get(i) || 0;
    const countJ = connectionCount.get(j) || 0;

    if (countI < MAX_EDGES_PER_NODE && countJ < MAX_EDGES_PER_NODE) {
      edges.push({
        source: posts[i].slug,
        target: posts[j].slug,
        weight: Math.round(similarity * 100) / 100,
      });

      connectionCount.set(i, countI + 1);
      connectionCount.set(j, countJ + 1);
    }
  }

  // Build nodes
  const tagGroups = new Map<string, number>();
  const nodes: GraphNode[] = posts.map((post, index) => ({
    id: post.slug,
    title: post.title,
    tags: post.tags,
    group: assignGroup(post.tags, tagGroups),
    connections: connectionCount.get(index) || 0,
  }));

  // Create graph data
  const graphData: GraphData = {
    nodes,
    edges,
    generatedAt: new Date().toISOString(),
  };

  // Save graph
  fs.writeFileSync(GRAPH_FILE, JSON.stringify(graphData, null, 2));

  // Print statistics
  console.log(`\n✨ Graph built successfully!`);
  console.log(`   Nodes: ${nodes.length}`);
  console.log(`   Edges: ${edges.length}`);
  console.log(`   Tag groups: ${tagGroups.size}`);

  if (edges.length > 0) {
    const avgWeight =
      edges.reduce((sum, e) => sum + e.weight, 0) / edges.length;
    console.log(`   Average similarity: ${(avgWeight * 100).toFixed(1)}%`);
  }

  console.log(`\n📁 Saved to: ${GRAPH_FILE}`);

  // Show tag groups
  console.log(`\n🏷️  Tag groups:`);
  for (const [tag, group] of tagGroups) {
    console.log(`   ${group}: ${tag}`);
  }
}

main().catch(console.error);
