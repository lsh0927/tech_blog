import { useState, useEffect } from 'react';

interface Heading {
  depth: number;
  text: string;
  slug: string;
}

interface TableOfContentsProps {
  headings: Heading[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0,
      }
    );

    // Observe all headings
    headings.forEach((heading) => {
      const element = document.getElementById(heading.slug);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) {
    return null;
  }

  // Filter to show only h2 and h3
  const filteredHeadings = headings.filter(
    (h) => h.depth >= 2 && h.depth <= 3
  );

  if (filteredHeadings.length === 0) {
    return null;
  }

  return (
    <div className="toc">
      <div className="toc-header">
        <span className="toc-title">On This Page</span>
      </div>
      <nav className="toc-nav">
        <ul className="toc-list">
          {filteredHeadings.map((heading) => (
            <li
              key={heading.slug}
              className={`toc-item depth-${heading.depth}`}
            >
              <a
                href={`#${heading.slug}`}
                className={`toc-link ${activeId === heading.slug ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(heading.slug);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                    // Update URL without scrolling
                    window.history.pushState(null, '', `#${heading.slug}`);
                  }
                }}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <style>{`
        .toc {
          padding: 1rem;
          border-top: 1px solid var(--bg-tertiary);
        }

        .toc-header {
          margin-bottom: 0.75rem;
        }

        .toc-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .toc-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .toc-item {
          margin-bottom: 0.25rem;
        }

        .toc-item.depth-3 {
          padding-left: 0.75rem;
        }

        .toc-link {
          display: block;
          padding: 0.25rem 0.5rem;
          font-size: 0.8125rem;
          color: var(--text-muted);
          text-decoration: none;
          border-radius: 4px;
          border-left: 2px solid transparent;
          transition: all 0.15s ease;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .toc-link:hover {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }

        .toc-link.active {
          color: var(--accent-primary);
          border-left-color: var(--accent-primary);
          background: rgba(212, 165, 116, 0.1);
        }
      `}</style>
    </div>
  );
}
