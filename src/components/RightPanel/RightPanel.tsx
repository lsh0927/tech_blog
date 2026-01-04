import Backlinks from './Backlinks';
import MiniGraph from './MiniGraph';
import TableOfContents from './TableOfContents';

interface RightPanelProps {
  currentSlug?: string;
  showBacklinks?: boolean;
  showMiniGraph?: boolean;
  showToc?: boolean;
  headings?: { depth: number; text: string; slug: string }[];
}

export default function RightPanel({
  currentSlug,
  showBacklinks = false,
  showMiniGraph = false,
  showToc = false,
  headings = [],
}: RightPanelProps) {
  return (
    <div className="right-panel">
      {showToc && headings.length > 0 && (
        <TableOfContents headings={headings} />
      )}

      {showMiniGraph && currentSlug && (
        <MiniGraph currentSlug={currentSlug} />
      )}

      {showBacklinks && currentSlug && (
        <Backlinks currentSlug={currentSlug} />
      )}

      <style>{`
        .right-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
      `}</style>
    </div>
  );
}
