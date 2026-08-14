import { useEffect, useRef, useState } from 'react';
import { MdDeleteOutline } from 'react-icons/md';

type StarNode = {
  id: number;
  x: number;
  y: number;
  label: string;
  note: string;
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
  { id: 1, x: 220, y: 180, label: '아이디어', note: '사용자 여정을 재해석해보자', color: '#f7d76b', size: 120 },
  { id: 2, x: 500, y: 260, label: '실험', note: '초기 검증 포인트 정리', color: '#ff9ccf', size: 110 },
  { id: 3, x: 360, y: 420, label: '콘셉트', note: '감성적인 밤하늘 경험', color: '#8eeae6', size: 106 },
  { id: 4, x: 650, y: 430, label: '협업', note: '리모트 협업용 플로우', color: '#b7a7ff', size: 118 },
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
const collaboratorCursors = [
  { id: 'A', x: 700, y: 220, emoji: '👾', label: 'A' },
  { id: 'J', x: 760, y: 330, emoji: '👨‍🚀', label: 'J' },
  { id: 'M', x: 620, y: 500, emoji: '🪐', label: 'M' },
  { id: 'Y', x: 810, y: 470, emoji: '👻', label: 'Y' },
];

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
  const [pointerWorld, setPointerWorld] = useState({ x: 0, y: 0 });
  const [isBursting, setIsBursting] = useState(false);

  const selectedNode = nodes.find((node) => node.id === selectedId) ?? null;

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

  useEffect(() => {
    if (selectedId === null && nodes.length > 0) {
      setSelectedId(nodes[0].id);
    }
  }, [nodes, selectedId]);

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
    const nextId = Date.now() + Math.round(Math.random() * 1000);
    const nextSize = 100 + Math.random() * 40;

    const newNode: StarNode = {
      id: nextId,
      x,
      y,
      label: `아이디어 ${nodes.length + 1}`,
      note: '새로 떠오른 생각을 적어보세요',
      color: palettes[Math.floor(Math.random() * palettes.length)],
      size: nextSize,
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedId(nextId);
  };

  const updateNode = (id: number, updater: (node: StarNode) => StarNode) => {
    setNodes((prev) => prev.map((node) => (node.id === id ? updater(node) : node)));
  };

  const deleteSelectedNode = () => {
    if (selectedId === null) return;
    setNodes((prev) => prev.filter((node) => node.id !== selectedId));
    setEdges((prev) => prev.filter((edge) => edge.from !== selectedId && edge.to !== selectedId));
    setSelectedId((prev) => (prev === null ? null : nodes.find((node) => node.id !== prev)?.id ?? null));
  };

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    setIsPanning(true);
  };

  const handleCanvasPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const nextWorld = toWorldPosition(event.clientX, event.clientY);
    setPointerWorld(nextWorld);

    if (!isPanning) return;
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
        setSelectedId(node.id);
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
      setSelectedId(node.id);
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
      setSelectedId(node.id);
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId !== null) {
        event.preventDefault();
        deleteSelectedNode();
      }

      if (event.key === 'Escape') {
        setSelectedId(null);
      }

      if (event.key.toLowerCase() === 'n') {
        const centerX = 420;
        const centerY = 260;
        addNodeAt(centerX, centerY);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, nodes, pan, scale]);

  useEffect(() => {
    if (!isBursting) return;
    const timer = window.setTimeout(() => setIsBursting(false), 650);
    return () => window.clearTimeout(timer);
  }, [isBursting]);

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

        {collaboratorCursors.map((cursor) => (
          <div
            key={cursor.id}
            className="remote-cursor"
            style={{ left: `${cursor.x}px`, top: `${cursor.y}px` }}
          >
            <span>{cursor.emoji}</span>
            <i>{cursor.label}</i>
          </div>
        ))}

        <div className="cursor cursor-left">👾</div>
        <div className="cursor cursor-right">👨‍🚀</div>

        <div
          className="board-layer"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          }}
        >
          <svg className="connections" style={{ width: '100%', height: '100%', position: 'absolute', left: 0, top: 0 }} aria-label="idea connections">
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

            {toolMode === 'connect' && connectFrom !== null ? (() => {
              const fromNode = nodes.find((node) => node.id === connectFrom);
              if (!fromNode) return null;

              return (
                <path
                  className="preview-path"
                  d={`M ${fromNode.x} ${fromNode.y} Q ${(fromNode.x + pointerWorld.x) / 2} ${(fromNode.y + pointerWorld.y) / 2 - 18} ${pointerWorld.x} ${pointerWorld.y}`}
                />
              );
            })() : null}
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
              {node.note ? <span className="node-note">{node.note}</span> : null}
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

        <div className="status-badge">
          {toolMode === 'add' && '새 별을 더블 클릭해 추가해보세요'}
          {toolMode === 'sticker' && '별에 반응 스티커를 남겨보세요'}
          {toolMode === 'connect' && (connectFrom !== null ? '연결할 별을 하나 더 선택하세요' : '연결할 첫 별을 선택하세요')}
        </div>

        {selectedNode ? (
          <aside className="inspector-panel">
            <div className="inspector-header">
              별 편집
              <button 
                className="inspector-close-btn"
                onClick={() => deleteSelectedNode()}
                title="삭제"
              >
                <MdDeleteOutline size={18} />
              </button>
            </div>
            <label className="field-label">
              제목
              <input
                style={{margin: "0 0 0 5px"}}
                value={selectedNode.label}
                onChange={(event) =>
                  updateNode(selectedNode.id, (node) => ({ ...node, label: event.target.value || '새 별' }))
                }
              />
            </label>

            <label className="field-label">
              메모
              <textarea
                value={selectedNode.note}
                rows={3}
                onChange={(event) =>
                  updateNode(selectedNode.id, (node) => ({ ...node, note: event.target.value }))
                }
              />
            </label>

            <div className="field-label">
              색상
              <div className="swatches">
                {palettes.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`swatch ${selectedNode.color === color ? 'selected' : ''}`}
                    style={{ background: color }}
                    onClick={() => updateNode(selectedNode.id, (node) => ({ ...node, color }))}
                  />
                ))}
              </div>
            </div>

            <div className="field-label">
              크기
              <input
                type="range"
                min={80}
                max={180}
                value={selectedNode.size}
                onChange={(event) =>
                  updateNode(selectedNode.id, (node) => ({ ...node, size: Number(event.target.value) }))
                }
              />
            </div>
          </aside>
        ) : null}

        <div
          className={`capsule-machine ${isBursting ? 'bursting' : ''}`}
          aria-label="prompt capsule machine"
          onClick={() => {
            setIsBursting(true);
            cyclePrompt();
          }}
        >
          <div className="machine-top">🎰</div>
          <div className="machine-body">
            <div className="slot-light" />
            <div className="lever" />
          </div>
          <div className="prompt-card">{prompts[promptIndex]}</div>
          {isBursting ? <div className="capsule-burst" aria-hidden="true">✦ ✦ ✦</div> : null}
        </div>
      </div>
    </div>
  );
}

export default App;
