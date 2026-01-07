/**
 * Notion to MDX Sync Script
 *
 * Notion 데이터베이스에서 포스트를 가져와 MDX 파일로 변환합니다.
 *
 * 환경변수:
 * - NOTION_API_KEY: Notion Integration API 키
 * - NOTION_DATABASE_ID: 블로그 포스트 데이터베이스 ID
 */

import 'dotenv/config';
import { Client } from '@notionhq/client';
import * as fs from 'fs';
import * as path from 'path';
import type {
  BlockObjectResponse,
  PageObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints';

// 환경변수 확인
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_API_KEY) {
  console.log('⚠️  NOTION_API_KEY not set, skipping Notion sync');
  process.exit(0);
}

if (!NOTION_DATABASE_ID) {
  console.log('⚠️  NOTION_DATABASE_ID not set, skipping Notion sync');
  process.exit(0);
}

const notion = new Client({ auth: NOTION_API_KEY });
const POSTS_DIR = path.join(process.cwd(), 'src/content/posts');
const CACHE_FILE = path.join(process.cwd(), '.notion-cache.json');

// 캐시 타입
interface CacheEntry {
  lastEditedTime: string;
  slug: string;
}

interface Cache {
  [pageId: string]: CacheEntry;
}

// 캐시 로드
function loadCache(): Cache {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch (e) {
    console.log('⚠️  Cache file corrupted, starting fresh');
  }
  return {};
}

// 캐시 저장
function saveCache(cache: Cache): void {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// Rich Text를 문자열로 변환
function richTextToString(richText: RichTextItemResponse[]): string {
  return richText.map(item => {
    let text = item.plain_text;

    if (item.type === 'text' && item.annotations) {
      if (item.annotations.bold) text = `**${text}**`;
      if (item.annotations.italic) text = `*${text}*`;
      if (item.annotations.strikethrough) text = `~~${text}~~`;
      if (item.annotations.code) text = `\`${text}\``;
      if (item.text?.link) text = `[${text}](${item.text.link.url})`;
    }

    return text;
  }).join('');
}

// 블록을 Markdown으로 변환
async function blockToMarkdown(block: BlockObjectResponse, depth = 0): Promise<string> {
  const indent = '  '.repeat(depth);

  switch (block.type) {
    case 'paragraph':
      const pText = richTextToString(block.paragraph.rich_text);
      return pText ? `${pText}\n\n` : '\n';

    case 'heading_1':
      return `# ${richTextToString(block.heading_1.rich_text)}\n\n`;

    case 'heading_2':
      return `## ${richTextToString(block.heading_2.rich_text)}\n\n`;

    case 'heading_3':
      return `### ${richTextToString(block.heading_3.rich_text)}\n\n`;

    case 'bulleted_list_item':
      let bulletContent = `${indent}- ${richTextToString(block.bulleted_list_item.rich_text)}\n`;
      if (block.has_children) {
        const children = await getBlockChildren(block.id);
        for (const child of children) {
          bulletContent += await blockToMarkdown(child, depth + 1);
        }
      }
      return bulletContent;

    case 'numbered_list_item':
      let numContent = `${indent}1. ${richTextToString(block.numbered_list_item.rich_text)}\n`;
      if (block.has_children) {
        const children = await getBlockChildren(block.id);
        for (const child of children) {
          numContent += await blockToMarkdown(child, depth + 1);
        }
      }
      return numContent;

    case 'code':
      const lang = block.code.language || 'text';
      const code = richTextToString(block.code.rich_text);
      return `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;

    case 'quote':
      const quoteLines = richTextToString(block.quote.rich_text).split('\n');
      return quoteLines.map(line => `> ${line}`).join('\n') + '\n\n';

    case 'callout':
      const icon = block.callout.icon?.type === 'emoji' ? block.callout.icon.emoji : '💡';
      const calloutText = richTextToString(block.callout.rich_text);
      let calloutContent = `> ${icon} ${calloutText ? `**${calloutText}**` : ''}\n`;

      // callout 내부 children 처리 (bullet list 등)
      if (block.has_children) {
        const calloutChildren = await getBlockChildren(block.id);
        for (const child of calloutChildren) {
          const childMd = await blockToMarkdown(child, 0);
          // 각 줄을 blockquote로 변환
          const quotedLines = childMd.split('\n').map(line => line ? `> ${line}` : '>').join('\n');
          calloutContent += quotedLines + '\n';
        }
      }
      return calloutContent + '\n';

    case 'divider':
      return '---\n\n';

    case 'image':
      let imageUrl = '';
      if (block.image.type === 'external') {
        imageUrl = block.image.external.url;
      } else if (block.image.type === 'file') {
        imageUrl = block.image.file.url;
      }
      const caption = block.image.caption ? richTextToString(block.image.caption) : '';
      return `![${caption}](${imageUrl})\n\n`;

    case 'toggle':
      const toggleSummary = richTextToString(block.toggle.rich_text);
      let toggleContent = `<details>\n<summary>${toggleSummary}</summary>\n\n`;
      if (block.has_children) {
        const children = await getBlockChildren(block.id);
        for (const child of children) {
          toggleContent += await blockToMarkdown(child, 0);
        }
      }
      toggleContent += '</details>\n\n';
      return toggleContent;

    case 'to_do':
      const checked = block.to_do.checked ? '[x]' : '[ ]';
      return `- ${checked} ${richTextToString(block.to_do.rich_text)}\n`;

    case 'bookmark':
      const bookmarkUrl = block.bookmark.url;
      const bookmarkCaption = block.bookmark.caption ? richTextToString(block.bookmark.caption) : bookmarkUrl;
      return `[${bookmarkCaption}](${bookmarkUrl})\n\n`;

    case 'embed':
      return `<iframe src="${block.embed.url}" width="100%" height="400"></iframe>\n\n`;

    case 'video':
      let videoUrl = '';
      if (block.video.type === 'external') {
        videoUrl = block.video.external.url;
      }
      // YouTube 임베드 처리
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
        if (videoId) {
          return `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>\n\n`;
        }
      }
      return `[Video](${videoUrl})\n\n`;

    case 'table':
      return await tableToMarkdown(block);

    default:
      console.log(`⚠️  Unsupported block type: ${block.type}`);
      return '';
  }
}

// 테이블 블록을 Markdown으로 변환
async function tableToMarkdown(block: BlockObjectResponse): Promise<string> {
  if (block.type !== 'table') return '';

  const children = await getBlockChildren(block.id);
  if (children.length === 0) return '';

  let markdown = '';
  const tableWidth = block.table.table_width;

  children.forEach((row, rowIndex) => {
    if (row.type === 'table_row') {
      const cells = row.table_row.cells.map(cell => richTextToString(cell));
      markdown += `| ${cells.join(' | ')} |\n`;

      // 헤더 구분선 추가
      if (rowIndex === 0) {
        markdown += `| ${Array(tableWidth).fill('---').join(' | ')} |\n`;
      }
    }
  });

  return markdown + '\n';
}

// 블록 자식들 가져오기
async function getBlockChildren(blockId: string): Promise<BlockObjectResponse[]> {
  const blocks: BlockObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });

    blocks.push(...response.results.filter((b): b is BlockObjectResponse => 'type' in b));
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return blocks;
}

// 포스트 속성 추출 (Notion 데이터베이스 속성명에 맞춤)
function extractPostProperties(page: PageObjectResponse) {
  const props = page.properties;

  // Title 추출 (이름 필드)
  let title = 'Untitled';
  if (props['이름']?.type === 'title') {
    title = richTextToString(props['이름'].title);
  } else if (props.Title?.type === 'title') {
    title = richTextToString(props.Title.title);
  } else if (props.Name?.type === 'title') {
    title = richTextToString(props.Name.title);
  }

  // Date 추출 (created_time 또는 date 타입 지원)
  let date = new Date().toISOString().split('T')[0];
  if (props.Date?.type === 'created_time') {
    date = props.Date.created_time.split('T')[0];
  } else if (props.Date?.type === 'date' && props.Date.date?.start) {
    date = props.Date.date.start;
  }

  // Tags 추출
  let tags: string[] = [];
  if (props.Tags?.type === 'multi_select') {
    tags = props.Tags.multi_select.map(tag => tag.name);
  }

  // Excerpt 추출 (요약 필드)
  let excerpt = '';
  if (props['요약']?.type === 'rich_text') {
    excerpt = richTextToString(props['요약'].rich_text);
  } else if (props.Excerpt?.type === 'rich_text') {
    excerpt = richTextToString(props.Excerpt.rich_text);
  }

  // Slug 추출 (없으면 제목에서 생성)
  let slug = '';
  if (props.Slug?.type === 'rich_text') {
    slug = richTextToString(props.Slug.rich_text);
  }
  if (!slug) {
    slug = title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }

  // Published 추출 (공개여부 필드)
  let published = false;
  if (props['공개여부']?.type === 'checkbox') {
    published = props['공개여부'].checkbox;
  } else if (props.Published?.type === 'checkbox') {
    published = props.Published.checkbox;
  }

  return { title, date, tags, excerpt, slug, published };
}

// MDX 파일 생성
function createMdxContent(
  title: string,
  date: string,
  tags: string[],
  excerpt: string,
  content: string
): string {
  const frontmatter = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `date: ${date}`,
    excerpt ? `excerpt: "${excerpt.replace(/"/g, '\\"')}"` : null,
    tags.length > 0 ? `tags: [${tags.map(t => `"${t}"`).join(', ')}]` : 'tags: []',
    '---',
  ].filter(Boolean).join('\n');

  return `${frontmatter}\n\n${content}`;
}

// 메인 동기화 함수
async function syncNotionPosts(): Promise<void> {
  console.log('🔄 Starting Notion sync...');

  const cache = loadCache();
  const newCache: Cache = {};
  let syncedCount = 0;
  let skippedCount = 0;

  // 데이터베이스 쿼리 (공개여부가 true인 것만)
  let cursor: string | undefined;
  const pages: PageObjectResponse[] = [];

  do {
    // @ts-ignore - SDK v5.x uses dataSources instead of databases
    const response = await notion.dataSources.query({
      data_source_id: NOTION_DATABASE_ID!,
      filter: {
        property: '공개여부',
        checkbox: {
          equals: true,
        },
      },
      start_cursor: cursor,
    });

    pages.push(...response.results.filter((p): p is PageObjectResponse => 'properties' in p));
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  console.log(`📚 Found ${pages.length} published posts`);

  // posts 디렉토리 확인
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  // 각 포스트 처리
  for (const page of pages) {
    const { title, date, tags, excerpt, slug, published } = extractPostProperties(page);
    const lastEditedTime = page.last_edited_time;

    // 캐시 확인 (변경되지 않은 포스트 스킵)
    if (cache[page.id]?.lastEditedTime === lastEditedTime && cache[page.id]?.slug === slug) {
      const filePath = path.join(POSTS_DIR, `${slug}.md`);
      if (fs.existsSync(filePath)) {
        newCache[page.id] = cache[page.id];
        skippedCount++;
        console.log(`⏭️  Skipped (unchanged): ${title}`);
        continue;
      }
    }

    // 블록 내용 가져오기
    console.log(`📝 Syncing: ${title}`);
    const blocks = await getBlockChildren(page.id);

    // 블록을 Markdown으로 변환
    let content = '';
    for (const block of blocks) {
      content += await blockToMarkdown(block);
    }

    // Markdown 파일 생성
    const mdContent = createMdxContent(title, date, tags, excerpt, content.trim());
    const filePath = path.join(POSTS_DIR, `${slug}.md`);

    fs.writeFileSync(filePath, mdContent, 'utf-8');

    // 캐시 업데이트
    newCache[page.id] = { lastEditedTime, slug };
    syncedCount++;
    console.log(`✅ Synced: ${title} → ${slug}.md`);
  }

  // 캐시 저장
  saveCache(newCache);

  console.log('\n📊 Sync Summary:');
  console.log(`   Synced: ${syncedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Total: ${pages.length}`);
}

// 실행
syncNotionPosts()
  .then(() => {
    console.log('\n✨ Notion sync completed!');
  })
  .catch((error) => {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  });
