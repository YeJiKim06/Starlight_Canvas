type StarNode = {
  id: number;
  x: number;
  y: number;
  label: string;
  color: string;
  size: number;
};

const initialStars: StarNode[] = [
  { id: 1, x: 220, y: 180, label: '아이디어', color: '#f7d76b', size: 120 },
  { id: 2, x: 500, y: 260, label: '실험', color: '#ff9ccf', size: 110 },
  { id: 3, x: 360, y: 420, label: '콘셉트', color: '#8eeae6', size: 106 },
  { id: 4, x: 650, y: 430, label: '협업', color: '#b7a7ff', size: 118 },
];

const prompts = [
  '이 아이디어를 7살 어린이에게 설명한다면?',
  '예산을 10배로 늘린다면 어떤 기능을 넣을까?',
  '반대로 완전히 실패하게 만들려면 어떻게 해야 할까?',
  '가장 감성적인 한 줄 문장을 떠올려보자',
];

const userIcons = ['👾', '👨‍🚀', '🪐', '👻'];

function App() {
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

      <div className="canvas-surface">
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

        <svg className="connections" viewBox="0 0 900 620" preserveAspectRatio="none" aria-label="idea connections">
          <path d="M 220 180 Q 300 240 500 260" />
          <path d="M 500 260 Q 440 330 360 420" />
          <path d="M 500 260 Q 580 330 650 430" />
          <path d="M 360 420 Q 500 390 650 430" />
        </svg>

        {initialStars.map((star) => (
          <div
            key={star.id}
            className="idea-node"
            style={{
              left: `${star.x}px`,
              top: `${star.y}px`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              background: `radial-gradient(circle at 30% 30%, #fff8d4 0%, ${star.color} 35%, rgba(23,20,37,0.95) 100%)`,
            }}
          >
            <span className="node-label">{star.label}</span>
            <span className="node-glow" aria-hidden="true" />
          </div>
        ))}

        <aside className="tool-panel">
          <button className="tool-button active">✦ 추가</button>
          <button className="tool-button">✨ 스티커</button>
          <button className="tool-button">⟡ 연결</button>
        </aside>

        <div className="capsule-machine" aria-label="prompt capsule machine">
          <div className="machine-top">🎰</div>
          <div className="machine-body">
            <div className="slot-light" />
            <div className="lever" />
          </div>
          <div className="prompt-card">
            {prompts[0]}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
