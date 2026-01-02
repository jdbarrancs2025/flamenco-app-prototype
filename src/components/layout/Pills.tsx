interface PillsProps {
  activeTab?: string;
}

const tabs = [
  { id: 'mixer', label: 'Mixer' },
  { id: 'plantillas', label: 'Plantillas' },
  { id: 'progreso', label: 'Progreso' },
];

export function Pills({ activeTab = 'mixer' }: PillsProps) {
  return (
    <nav className="flex items-center" style={{ gap: '12px', paddingLeft: '16px', paddingRight: '16px', height: '32px' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`
            flex justify-center items-center rounded-full
            font-medium transition-colors whitespace-nowrap shrink-0
            ${tab.id === activeTab
              ? 'text-white'
              : 'text-black'
            }
          `}
          style={{
            padding: '6px 14px',
            fontSize: '14px',
            lineHeight: '1.4',
            backgroundColor: tab.id === activeTab ? 'rgba(0,0,0,0.9)' : '#F6F6F6',
            borderRadius: '20px'
          }}
          disabled={tab.id !== 'mixer'}
        >
          {tab.label}
        </button>
      ))}
      {/* Three dots menu button */}
      <button className="flex items-center justify-center ml-auto" style={{ width: '48px', height: '48px', marginRight: '-12px' }}>
        <div className="flex items-center" style={{ gap: '4px' }}>
          <span className="bg-black rounded-full" style={{ width: '6px', height: '6px' }} />
          <span className="bg-black rounded-full" style={{ width: '6px', height: '6px' }} />
          <span className="bg-black rounded-full" style={{ width: '6px', height: '6px' }} />
        </div>
      </button>
    </nav>
  );
}
