import { useEffect, useRef, useState } from 'react';

type StarNode = {
  id: number;
  x: number;
  y: number;
  label: string;
  color: string;
  size: number;
  stamp?: string;
};

type Edge = {
  id: string;
  from: number;
  to: number;
};

type ToolMode = 'add' | 'connect' | 'sticker';

const palettes = ['#f7d76b', '#ff9ccf', '#8eeae6', '#b7a7ff', '#90d8ff', '#ffd59e'];

const initialStars: StarNode[] = [
  { id: 1, x: 220, y: 180, label: '아이디어', color: '#f7d76b', size: 120 },
  { id: 2, x: 500, y: 260, label: '실험', color: '#ff9ccf', size: 110 },
  { id: 3, x: 360, y: 420, label: '콘셉트', color: '#8eeae6', size: 106 },
  { id: 4, x: 650, y: 430, label: '협업', color: '#b7a7ff', size: 118 },
];

const initialEdges: Edge[] = [
  { id: '1-2', from: 1, to: 2 },
  { id: '2-3', from: 2, to: 3 },
  { id: '2-4', from: 2, to: 4 },
  { id: '3-4', from: 3, to: 4 },
];

const prompts = [
  '이 아이디어를 7살 어린이에게 설명한다면?',
  '예산을 10배로 늘린다면 어떤 기능을 넣을까?',
  '반대로 완전히 실패하게 만들려면 어떻게 해야 할까?',
  '가장 감성적인 한 줄 문장을 떠올려보자',
];

const stampSet = ['✨', '⭐', '👍', '❓', '💡'];

function App() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<StarNode[]>(initialStars);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [toolMode, setToolMode] = useState<ToolMode>('add');
  const [selectedId, setSelectedId] = useState<number | null>(1);
  const [promptIndex, setPromptIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 180, y: 80 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggingNode, setDraggingNode] = useState<{ id: number; offsetX: number; offsetY: number } | null>(null);
  const [connectFrom, setConnectFrom] = useState<number | null>(null);

  useEffect(() => {
    if (!draggingNode) return;

    const handleMove = (event: PointerEvent) => {
      const board = canvasRef.current;
      if (!board) return;

      const rect = board.getBoundingClientRect();
      const worldX = (event.clientX - rect.left - pan.x) / scale;
      const worldY = (event.clientY - rect.top - pan.y) / scale;

      setNodes((prev) =>
        prev.map((node) =>
          node.id === draggingNode.id
            ? {
                ...node,
                x: worldX - draggingNode.offsetX,
                y: worldY - draggingNode.offsetY,
              }
            : node
        )
      );
    };

    const handleUp = () => setDraggingNode(null);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [draggingNode, pan, scale]);

  const toWorldPosition = (clientX: number, clientY: number) => {
    const board = canvasRef.current;
    if (!board) return { x: 0, y: 0 };

    const rect = board.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / scale,
      y: (clientY - rect.top - pan.y) / scale,
    };
  };

  const addNodeAt = (x: number, y: number) => {
    const nextId = Date.now();
    const nextSize = 100 + Math.random() * 40;

    const newNode: StarNode = {
      id: nextId,
      x,
      y,
      label: `아이디어 ${nodes.length + 1}`,
      color: palettes[Math.floor(Math.random() * palettes.length)],
      size: nextSize,
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedId(nextId);
  };

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    setIsPanning(true);
  };

  const handleCanvasPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    const board = canvasRef.current;
    if (!board) return;

    const rect = board.getBoundingClientRect();
    setPan((prev) => ({
      x: prev.x + event.movementX,
      y: prev.y + event.movementY,
    }));
  };

  const handleCanvasPointerUp = () => setIsPanning(false);

  const handleCanvasDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (toolMode !== 'add') return;
    const { x, y } = toWorldPosition(event.clientX, event.clientY);
    addNodeAt(x, y);
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const nextScale = Math.min(1.8, Math.max(0.7, scale * (1 - event.deltaY * 0.0012)));
    setScale(nextScale);
  };

  const handleNodePointerDown = (event: React.PointerEvent<HTMLDivElement>, node: StarNode) => {
    event.stopPropagation();
    const { x, y } = toWorldPosition(event.clientX, event.clientY);

    if (toolMode === 'connect') {
      if (connectFrom === null) {
        setConnectFrom(node.id);
        return;
      }

      if (connectFrom !== node.id) {
        setEdges((prev) => {
          const key = `${Math.min(connectFrom, node.id)}-${Math.max(connectFrom, node.id)}`;
          if (prev.some((edge) => edge.id === key)) return prev;
          return [...prev, { id: key, from: Math.min(connectFrom, node.id), to: Math.max(connectFrom, node.id) }];
        });
      }

      setConnectFrom(null);
      return;
    }

    if (toolMode === 'sticker') {
      const stamp = stampSet[Math.floor(Math.random() * stampSet.length)];
      setNodes((prev) =>
        prev.map((item) =>
          item.id === node.id
            ? {
                ...item,
                stamp,
              }
            : item
        )
      );
      return;
    }

    setSelectedId(node.id);
    setDraggingNode({
      id: node.id,
      offsetX: x - node.x,
      offsetY: y - node.y,
    });
  };

  const cyclePrompt = () => {
    setPromptIndex((prev) => (prev + 1) % prompts.length);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">✦</div>
          <span className="brand-name">별빛캔버스</span>
        </div>

        <div className="team-line">
          <span className="team-pill">우주선 팀</span>
          <div className="avatars" aria-label="connected users">
            {['A', 'J', 'M', 'Y'].map((name, index) => (
              <div key={name} className="avatar" style={{ ['--delay' as string]: `${index * 0.15}s` }}>
                {name}
              </div>
            ))}
          </div>
        </div>

        <button className="share-button">공유하기</button>
      </header>

      <div
        ref={canvasRef}
        className="canvas-surface"
        onDoubleClick={handleCanvasDoubleClick}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={handleCanvasPointerUp}
        onWheel={handleWheel}
      >
        <div className="starfield" aria-hidden="true">
          {Array.from({ length: 90 }).map((_, index) => (
            <span
              key={index}
              className="spark"
              style={{
                left: `${(index * 13) % 100}%`,
                top: `${(index * 19) % 100}%`,
                animationDelay: `${(index % 10) * 0.6}s`,
                opacity: 0.3 + ((index * 7) % 10) * 0.07,
              }}
            />
          ))}
        </div>

        <div className="cursor cursor-left">👾</div>
        <div className="cursor cursor-right">👨‍🚀</div>

        <div
          className="board-layer"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          }}
        >
          <svg className="connections" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid meet" aria-label="idea connections">
            {edges.map((edge) => {
              const from = nodes.find((node) => node.id === edge.from);
              const to = nodes.find((node) => node.id === edge.to);
              if (!from || !to) return null;

              return (
                <path
                  key={edge.id}
                  d={`M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${(from.y + to.y) / 2 - 18} ${to.x} ${to.y}`}
                />
              );
            })}
          </svg>

          {nodes.map((node) => (
            <div
              key={node.id}
              className={`idea-node ${selectedId === node.id ? 'selected' : ''}`}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: `${node.size}px`,
                height: `${node.size}px`,
                background: `radial-gradient(circle at 30% 30%, #fff8d4 0%, ${node.color} 35%, rgba(23,20,37,0.95) 100%)`,
              }}
              onPointerDown={(event) => handleNodePointerDown(event, node)}
              onClick={() => setSelectedId(node.id)}
            >
              <span className="node-label">{node.label}</span>
              <span className="node-glow" aria-hidden="true" />
              {node.stamp ? <span className="node-stamp">{node.stamp}</span> : null}
            </div>
          ))}
        </div>

        <aside className="tool-panel">
          {(['add', 'sticker', 'connect'] as ToolMode[]).map((mode) => (
            <button
              key={mode}
              className={`tool-button ${toolMode === mode ? 'active' : ''}`}
              onClick={() => {
                setToolMode(mode);
                if (mode !== 'connect') setConnectFrom(null);
              }}
            >
              {mode === 'add' ? '✦ 추가' : mode === 'sticker' ? '✨ 스티커' : '⟡ 연결'}
            </button>
          ))}
        </aside>

        <div className="capsule-machine" aria-label="prompt capsule machine" onClick={cyclePrompt}>
          <div className="machine-top">🎰</div>
          <div className="machine-body">
            <div className="slot-light" />
            <div className="lever" />
          </div>
          <div className="prompt-card">{prompts[promptIndex]}</div>
        </div>
      </div>
    </div>
  );
}

export default App;
