import { useState, useEffect } from 'react';

interface LinkEntry {
  slug: string;
  title: string;
  score?: number;
}

interface BacklinksEntry {
  explicit: LinkEntry[];
  aiSuggested: LinkEntry[];
}

interface BacklinksProps {
  currentSlug: string;
}

export default function Backlinks({ currentSlug }: BacklinksProps) {
  const [backlinks, setBacklinks] = useState<BacklinksEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    explicit: true,
    aiSuggested: true,
  });

  useEffect(() => {
    if (!currentSlug) return;

    fetch('/links-data.json')
      .then((res) => res.json())
      .then((data) => {
        setBacklinks(data.backlinks?.[currentSlug] || { explicit: [], aiSuggested: [] });
        setLoading(false);
      })
      .catch(() => {
        setBacklinks({ explicit: [], aiSuggested: [] });
        setLoading(false);
      });
  }, [currentSlug]);

  const toggleSection = (section: 'explicit' | 'aiSuggested') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (loading) {
    return (
      <div className="backlinks-loading">
        Loading backlinks...
      </div>
    );
  }

  const hasExplicit = backlinks && backlinks.explicit.length > 0;
  const hasAISuggested = backlinks && backlinks.aiSuggested.length > 0;
  const hasAny = hasExplicit || hasAISuggested;

  return (
    <div className="backlinks">
      {!hasAny ? (
        <div className="backlinks-empty">
          <div className="backlinks-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <p className="backlinks-empty-text">No links to this note yet</p>
        </div>
      ) : (
        <>
          {/* Explicit Backlinks */}
          {hasExplicit && (
            <div className="backlinks-section">
              <button
                onClick={() => toggleSection('explicit')}
                className="backlinks-section-header"
              >
                <span className="backlinks-section-icon">🔗</span>
                <span className="backlinks-section-title">Linked Here</span>
                <span className="backlinks-section-count">{backlinks!.explicit.length}</span>
                <span className="backlinks-section-toggle">
                  {expandedSections.explicit ? '−' : '+'}
                </span>
              </button>

              {expandedSections.explicit && (
                <ul className="backlinks-list">
                  {backlinks!.explicit.map((link) => (
                    <li key={link.slug}>
                      <a href={`/posts/${link.slug}`} className="backlinks-link">
                        <span className="backlinks-link-title">{link.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* AI Suggested Links */}
          {hasAISuggested && (
            <div className="backlinks-section">
              <button
                onClick={() => toggleSection('aiSuggested')}
                className="backlinks-section-header"
              >
                <span className="backlinks-section-icon">🤖</span>
                <span className="backlinks-section-title">Related Notes</span>
                <span className="backlinks-section-count">{backlinks!.aiSuggested.length}</span>
                <span className="backlinks-section-toggle">
                  {expandedSections.aiSuggested ? '−' : '+'}
                </span>
              </button>

              {expandedSections.aiSuggested && (
                <ul className="backlinks-list">
                  {backlinks!.aiSuggested.map((link) => (
                    <li key={link.slug}>
                      <a href={`/posts/${link.slug}`} className="backlinks-link">
                        <span className="backlinks-link-title">{link.title}</span>
                        {link.score && (
                          <span className="backlinks-link-score">
                            {Math.round(link.score * 100)}%
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              <p className="backlinks-ai-note">
                AI-suggested based on semantic similarity
              </p>
            </div>
          )}
        </>
      )}

      <style>{`
        .backlinks {
          padding: 1rem;
        }

        .backlinks-loading {
          padding: 1rem;
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .backlinks-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          text-align: center;
        }

        .backlinks-empty-icon {
          color: var(--text-muted);
          opacity: 0.5;
          margin-bottom: 0.75rem;
        }

        .backlinks-empty-text {
          color: var(--text-muted);
          font-size: 0.875rem;
          margin: 0;
        }

        .backlinks-section {
          margin-bottom: 1rem;
        }

        .backlinks-section-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.5rem;
          background: none;
          border: none;
          border-radius: 6px;
          color: var(--text-secondary);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .backlinks-section-header:hover {
          background: var(--bg-tertiary);
        }

        .backlinks-section-icon {
          font-size: 0.875rem;
        }

        .backlinks-section-title {
          flex: 1;
          text-align: left;
        }

        .backlinks-section-count {
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          background: var(--bg-tertiary);
          border-radius: 4px;
          color: var(--text-muted);
        }

        .backlinks-section-toggle {
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .backlinks-list {
          list-style: none;
          padding: 0;
          margin: 0.5rem 0 0;
        }

        .backlinks-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          margin-bottom: 0.25rem;
          background: var(--bg-tertiary);
          border-radius: 6px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.8125rem;
          transition: all 0.15s ease;
        }

        .backlinks-link:hover {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }

        .backlinks-link-title {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .backlinks-link-score {
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          background: var(--accent-primary);
          color: var(--bg-primary);
          border-radius: 4px;
          font-weight: 600;
          margin-left: 0.5rem;
          flex-shrink: 0;
        }

        .backlinks-ai-note {
          font-size: 0.6875rem;
          color: var(--text-muted);
          margin: 0.5rem 0 0;
          padding: 0 0.5rem;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
