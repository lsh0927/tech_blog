import { useState, useEffect } from 'react';

interface PostEntry {
  slug: string;
  title: string;
  tags: string[];
}

interface FolderStructure {
  [key: string]: PostEntry[];
}

export default function Explorer() {
  const [posts, setPosts] = useState<PostEntry[]>([]);
  const [structure, setStructure] = useState<FolderStructure>({});
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['All Posts']));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/links-data.json')
      .then((res) => res.json())
      .then((data) => {
        const postEntries: PostEntry[] = Object.entries(data.postMeta || {}).map(
          ([slug, meta]: [string, any]) => ({
            slug,
            title: meta.title,
            tags: meta.tags || [],
          })
        );

        setPosts(postEntries);

        // Group by primary tag
        const grouped: FolderStructure = { 'All Posts': postEntries };
        for (const post of postEntries) {
          const primaryTag = post.tags[0] || 'Uncategorized';
          if (!grouped[primaryTag]) {
            grouped[primaryTag] = [];
          }
          grouped[primaryTag].push(post);
        }

        setStructure(grouped);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const toggleFolder = (folder: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) {
        next.delete(folder);
      } else {
        next.add(folder);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="p-4 text-sm text-[var(--text-muted)]">
        Loading...
      </div>
    );
  }

  const sortedFolders = Object.keys(structure).sort((a, b) => {
    if (a === 'All Posts') return -1;
    if (b === 'All Posts') return 1;
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="explorer">
      <div className="explorer-header">
        <span className="explorer-title">Explorer</span>
      </div>

      <nav className="explorer-tree">
        {sortedFolders.map((folder) => {
          const isExpanded = expandedFolders.has(folder);
          const folderPosts = structure[folder];

          // Skip "All Posts" if we have tags
          if (folder === 'All Posts' && sortedFolders.length > 2) {
            return null;
          }

          return (
            <div key={folder} className="explorer-folder">
              <button
                onClick={() => toggleFolder(folder)}
                className="explorer-folder-header"
              >
                <span className="explorer-folder-icon">
                  {isExpanded ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  )}
                </span>
                <span className="explorer-folder-name">{folder}</span>
                <span className="explorer-folder-count">{folderPosts.length}</span>
              </button>

              {isExpanded && (
                <ul className="explorer-files">
                  {folderPosts.map((post) => (
                    <li key={post.slug}>
                      <a
                        href={`/posts/${post.slug}`}
                        className="explorer-file"
                        title={post.title}
                      >
                        <span className="explorer-file-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </span>
                        <span className="explorer-file-name">{post.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <style>{`
        .explorer {
          padding: 0.5rem 0;
        }

        .explorer-header {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          margin-bottom: 0.5rem;
        }

        .explorer-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .explorer-tree {
          display: flex;
          flex-direction: column;
        }

        .explorer-folder {
          margin-bottom: 0.25rem;
        }

        .explorer-folder-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.375rem 1rem;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .explorer-folder-header:hover {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }

        .explorer-folder-icon {
          display: flex;
          align-items: center;
          color: var(--text-muted);
        }

        .explorer-folder-name {
          flex: 1;
          font-weight: 500;
        }

        .explorer-folder-count {
          font-size: 0.75rem;
          color: var(--text-muted);
          background: var(--bg-tertiary);
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
        }

        .explorer-files {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .explorer-file {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 1rem 0.375rem 2rem;
          color: var(--text-secondary);
          font-size: 0.8125rem;
          text-decoration: none;
          transition: all 0.15s ease;
          overflow: hidden;
        }

        .explorer-file:hover {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }

        .explorer-file-icon {
          display: flex;
          align-items: center;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .explorer-file-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
}
