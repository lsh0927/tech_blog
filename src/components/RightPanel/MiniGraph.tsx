import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface GraphNode {
  id: string;
  title: string;
  tags: string[];
  group: number;
  connections: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  weight: number;
  type: 'explicit' | 'ai';
}

interface MiniGraphProps {
  currentSlug: string;
}

const NODE_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4', '#3b82f6', '#ef4444',
];

export default function MiniGraph({ currentSlug }: MiniGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentSlug) return;

    fetch('/links-data.json')
      .then((res) => res.json())
      .then((data) => {
        renderGraph(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load graph');
        setLoading(false);
      });
  }, [currentSlug]);

  const renderGraph = (data: { nodes: GraphNode[]; edges: GraphEdge[] }) => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerRect = containerRef.current.getBoundingClientRect();
    const width = containerRect.width;
    const height = 200;

    // Filter to show only connected nodes
    const connectedNodeIds = new Set<string>([currentSlug]);
    const relevantEdges = data.edges.filter((edge) => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;

      if (sourceId === currentSlug || targetId === currentSlug) {
        connectedNodeIds.add(sourceId);
        connectedNodeIds.add(targetId);
        return true;
      }
      return false;
    });

    const relevantNodes = data.nodes
      .filter((node) => connectedNodeIds.has(node.id))
      .map((node) => ({ ...node }));

    if (relevantNodes.length === 0) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-muted)')
        .attr('font-size', '12px')
        .text('No connections yet');
      return;
    }

    const edges = relevantEdges.map((e) => ({ ...e }));

    // Create container for zoom
    const container = svg.append('g');

    // Create simulation
    const simulation = d3
      .forceSimulation(relevantNodes)
      .force(
        'link',
        d3
          .forceLink(edges)
          .id((d: any) => d.id)
          .distance(60)
          .strength(0.5)
      )
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(25));

    // Draw edges
    const link = container
      .append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', (d: any) =>
        d.type === 'explicit' ? 'var(--accent-primary)' : 'var(--graph-edge)'
      )
      .attr('stroke-width', (d: any) => (d.type === 'explicit' ? 2 : 1))
      .attr('stroke-dasharray', (d: any) => (d.type === 'explicit' ? 'none' : '4,2'))
      .attr('stroke-opacity', 0.6);

    // Draw nodes
    const node = container
      .append('g')
      .selectAll('g')
      .data(relevantNodes)
      .join('g')
      .attr('class', 'mini-graph-node')
      .style('cursor', 'pointer');

    // Node circles
    node
      .append('circle')
      .attr('r', (d) => (d.id === currentSlug ? 10 : 6))
      .attr('fill', (d) =>
        d.id === currentSlug
          ? 'var(--accent-primary)'
          : NODE_COLORS[d.group % NODE_COLORS.length]
      )
      .attr('stroke', 'var(--bg-primary)')
      .attr('stroke-width', 2);

    // Node labels (only for current node)
    node
      .filter((d) => d.id === currentSlug)
      .append('text')
      .attr('dy', -15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', 'var(--text-primary)')
      .text((d) => d.title.slice(0, 15) + (d.title.length > 15 ? '...' : ''));

    // Hover interactions
    node
      .on('mouseenter', function (event, d) {
        if (d.id !== currentSlug) {
          d3.select(this)
            .select('circle')
            .transition()
            .duration(150)
            .attr('r', 9);

          d3.select(this)
            .append('text')
            .attr('class', 'hover-label')
            .attr('dy', -12)
            .attr('text-anchor', 'middle')
            .attr('font-size', '9px')
            .attr('fill', 'var(--text-primary)')
            .text(d.title.slice(0, 20) + (d.title.length > 20 ? '...' : ''));
        }
      })
      .on('mouseleave', function (event, d) {
        if (d.id !== currentSlug) {
          d3.select(this)
            .select('circle')
            .transition()
            .duration(150)
            .attr('r', 6);

          d3.select(this).select('.hover-label').remove();
        }
      })
      .on('click', (_, d) => {
        window.location.href = `/posts/${d.id}`;
      });

    // Update positions
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  };

  if (loading) {
    return <div className="mini-graph-loading">Loading graph...</div>;
  }

  if (error) {
    return <div className="mini-graph-error">{error}</div>;
  }

  return (
    <div className="mini-graph">
      <div className="mini-graph-header">
        <span className="mini-graph-title">Graph View</span>
        <a href="/graph" className="mini-graph-expand">
          Full View →
        </a>
      </div>
      <div ref={containerRef} className="mini-graph-container">
        <svg ref={svgRef} width="100%" height="200" />
      </div>
      <div className="mini-graph-legend">
        <span className="mini-graph-legend-item">
          <span className="legend-line legend-explicit" />
          Explicit
        </span>
        <span className="mini-graph-legend-item">
          <span className="legend-line legend-ai" />
          AI Suggested
        </span>
      </div>

      <style>{`
        .mini-graph {
          padding: 1rem;
          border-top: 1px solid var(--bg-tertiary);
        }

        .mini-graph-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .mini-graph-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }

        .mini-graph-expand {
          font-size: 0.75rem;
          color: var(--link);
          text-decoration: none;
        }

        .mini-graph-expand:hover {
          text-decoration: underline;
        }

        .mini-graph-container {
          background: var(--bg-tertiary);
          border-radius: 8px;
          overflow: hidden;
        }

        .mini-graph-loading,
        .mini-graph-error {
          padding: 1rem;
          text-align: center;
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .mini-graph-legend {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
          font-size: 0.625rem;
          color: var(--text-muted);
        }

        .mini-graph-legend-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .legend-line {
          display: inline-block;
          width: 16px;
          height: 2px;
        }

        .legend-explicit {
          background: var(--accent-primary);
        }

        .legend-ai {
          background: var(--graph-edge);
          background-image: repeating-linear-gradient(
            90deg,
            var(--graph-edge) 0,
            var(--graph-edge) 4px,
            transparent 4px,
            transparent 6px
          );
        }
      `}</style>
    </div>
  );
}
