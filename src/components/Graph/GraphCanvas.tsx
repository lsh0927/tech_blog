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
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphCanvasProps {
  width?: number;
  height?: number;
  onNodeClick?: (nodeId: string) => void;
}

// Color palette for groups
const GROUP_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#ef4444', // red
  '#84cc16', // lime
  '#f97316', // orange
];

export default function GraphCanvas({
  width = 800,
  height = 600,
  onNodeClick,
}: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    node: GraphNode | null;
  }>({ show: false, x: 0, y: 0, node: null });

  // Fetch graph data
  useEffect(() => {
    fetch('/graph-data.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load graph data');
        return res.json();
      })
      .then((data) => {
        setGraphData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading graph:', err);
        setError('Failed to load graph data');
        setLoading(false);
      });
  }, []);

  // Render graph with D3
  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (graphData.nodes.length === 0) {
      return;
    }

    // Clone data to avoid mutation
    const nodes: GraphNode[] = graphData.nodes.map((d) => ({ ...d }));
    const edges: GraphEdge[] = graphData.edges.map((d) => ({ ...d }));

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create container for zoom
    const container = svg.append('g');

    // Create force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(edges)
          .id((d: any) => d.id)
          .distance(100)
          .strength((d: any) => d.weight * 0.5)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Draw edges
    const link = container
      .append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('class', 'graph-link')
      .attr('stroke-width', (d) => Math.max(1, d.weight * 3));

    // Draw nodes
    const node = container
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'graph-node')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node circles
    node
      .append('circle')
      .attr('r', (d) => 8 + d.connections * 2)
      .attr('fill', (d) => GROUP_COLORS[d.group % GROUP_COLORS.length])
      .attr('stroke', 'var(--bg-primary)')
      .attr('stroke-width', 2);

    // Node labels
    node
      .append('text')
      .attr('class', 'graph-node-label')
      .attr('dy', -15)
      .attr('text-anchor', 'middle')
      .text((d) => {
        const maxLen = 20;
        return d.title.length > maxLen
          ? d.title.slice(0, maxLen) + '...'
          : d.title;
      });

    // Hover effects
    node
      .on('mouseenter', function (event, d) {
        // Highlight connected edges
        link.attr('stroke', (l: any) =>
          l.source.id === d.id || l.target.id === d.id
            ? 'var(--graph-edge-active)'
            : 'var(--graph-edge)'
        );
        link.attr('stroke-opacity', (l: any) =>
          l.source.id === d.id || l.target.id === d.id ? 1 : 0.3
        );

        // Show tooltip
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltip({
            show: true,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            node: d,
          });
        }
      })
      .on('mouseleave', () => {
        link.attr('stroke', 'var(--graph-edge)');
        link.attr('stroke-opacity', 0.6);
        setTooltip({ show: false, x: 0, y: 0, node: null });
      })
      .on('click', (_, d) => {
        if (onNodeClick) {
          onNodeClick(d.id);
        } else {
          window.location.href = `/posts/${d.id}`;
        }
      });

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // Initial zoom to fit
    const initialZoom = d3.zoomIdentity
      .translate(width / 4, height / 4)
      .scale(0.8);
    svg.call(zoom.transform, initialZoom);

    return () => {
      simulation.stop();
    };
  }, [graphData, width, height, onNodeClick]);

  if (loading) {
    return (
      <div
        className="graph-container flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-[var(--text-muted)]">Loading graph...</div>
      </div>
    );
  }

  if (error || !graphData) {
    return (
      <div
        className="graph-container flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center text-[var(--text-muted)]">
          <p className="mb-2">{error || 'No graph data available'}</p>
          <p className="text-sm">Add more posts to see connections</p>
        </div>
      </div>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <div
        className="graph-container flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center text-[var(--text-muted)]">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mx-auto mb-4 opacity-50"
          >
            <circle cx="12" cy="12" r="3" />
            <circle cx="19" cy="5" r="2" />
            <circle cx="5" cy="19" r="2" />
            <line x1="14.5" y1="9.5" x2="17.5" y2="6.5" />
            <line x1="9.5" y1="14.5" x2="6.5" y2="17.5" />
          </svg>
          <p className="mb-2">No posts in the graph yet</p>
          <p className="text-sm">Create posts to see the knowledge graph</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="graph-container relative" style={{ height }}>
      <svg ref={svgRef} width="100%" height="100%" />

      {/* Tooltip */}
      {tooltip.show && tooltip.node && (
        <div
          className="graph-tooltip"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
          }}
        >
          <div className="font-medium mb-1">{tooltip.node.title}</div>
          {tooltip.node.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tooltip.node.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="text-xs text-[var(--text-muted)] mt-1">
            {tooltip.node.connections} connections
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-4">
          <span>Drag to move nodes</span>
          <span>Scroll to zoom</span>
          <span>Click to view post</span>
        </div>
      </div>
    </div>
  );
}
