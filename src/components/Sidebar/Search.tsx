import { useState, useEffect, useRef, useCallback } from 'react';
import Fuse from 'fuse.js';

interface SearchEntry {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  content: string;
  date: string;
}

interface SearchResult {
  item: SearchEntry;
  score?: number;
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [fuse, setFuse] = useState<Fuse<SearchEntry> | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load search index
  useEffect(() => {
    fetch('/search-index.json')
      .then((res) => res.json())
      .then((data) => {
        const fuseInstance = new Fuse(data.entries, {
          keys: [
            { name: 'title', weight: 2 },
            { name: 'tags', weight: 1.5 },
            { name: 'excerpt', weight: 1 },
            { name: 'content', weight: 0.5 },
          ],
          includeScore: true,
          threshold: 0.4,
          minMatchCharLength: 2,
        });
        setFuse(fuseInstance);
      })
      .catch(console.error);
  }, []);

  // Handle search
  const handleSearch = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);
      setSelectedIndex(0);

      if (!fuse || searchQuery.length < 2) {
        setResults([]);
        return;
      }

      const searchResults = fuse.search(searchQuery).slice(0, 8);
      setResults(searchResults);
    },
    [fuse]
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          window.location.href = `/posts/${results[selectedIndex].item.slug}`;
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, []);

  return (
    <div ref={containerRef} className="search-container">
      <div className="search-input-wrapper">
        <svg
          className="search-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="search-input"
        />
        <kbd className="search-shortcut">⌘K</kbd>
      </div>

      {isOpen && results.length > 0 && (
        <div className="search-results">
          {results.map((result, index) => (
            <a
              key={result.item.slug}
              href={`/posts/${result.item.slug}`}
              className={`search-result ${index === selectedIndex ? 'selected' : ''}`}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="search-result-title">{result.item.title}</div>
              <div className="search-result-excerpt">{result.item.excerpt}</div>
              {result.item.tags.length > 0 && (
                <div className="search-result-tags">
                  {result.item.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="search-result-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </a>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="search-no-results">
          No results found for "{query}"
        </div>
      )}

      <style>{`
        .search-container {
          position: relative;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--bg-tertiary);
        }

        .search-input-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--bg-tertiary);
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
        }

        .search-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 0.875rem;
          outline: none;
          width: 100%;
        }

        .search-input::placeholder {
          color: var(--text-muted);
        }

        .search-shortcut {
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          background: var(--bg-secondary);
          border: 1px solid var(--bg-tertiary);
          border-radius: 4px;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }

        .search-results {
          position: absolute;
          top: 100%;
          left: 0.5rem;
          right: 0.5rem;
          margin-top: 0.25rem;
          background: var(--bg-elevated);
          border: 1px solid var(--bg-tertiary);
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          max-height: 400px;
          overflow-y: auto;
          z-index: 100;
        }

        .search-result {
          display: block;
          padding: 0.75rem 1rem;
          text-decoration: none;
          border-bottom: 1px solid var(--bg-tertiary);
          transition: background 0.15s ease;
        }

        .search-result:last-child {
          border-bottom: none;
        }

        .search-result:hover,
        .search-result.selected {
          background: var(--bg-tertiary);
        }

        .search-result-title {
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
          font-size: 0.875rem;
        }

        .search-result-excerpt {
          font-size: 0.75rem;
          color: var(--text-muted);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .search-result-tags {
          display: flex;
          gap: 0.25rem;
          margin-top: 0.5rem;
        }

        .search-result-tag {
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          background: var(--bg-secondary);
          border-radius: 4px;
          color: var(--text-muted);
        }

        .search-no-results {
          position: absolute;
          top: 100%;
          left: 0.5rem;
          right: 0.5rem;
          margin-top: 0.25rem;
          padding: 1rem;
          background: var(--bg-elevated);
          border: 1px solid var(--bg-tertiary);
          border-radius: 8px;
          text-align: center;
          font-size: 0.875rem;
          color: var(--text-muted);
          z-index: 100;
        }
      `}</style>
    </div>
  );
}
