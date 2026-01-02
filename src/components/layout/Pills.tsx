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
    <nav className="flex items-center gap-3 px-4 py-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`
            flex justify-center items-center px-[14px] py-[6px] rounded-[20px]
            font-medium text-sm leading-[140%] transition-colors whitespace-nowrap
            ${tab.id === activeTab
              ? 'bg-[rgba(0,0,0,0.9)] text-white'
              : 'bg-[#F6F6F6] text-black'
            }
          `}
          disabled={tab.id !== 'mixer'}
        >
          {tab.label}
        </button>
      ))}
      {/* Three dots indicator */}
      <div className="flex items-center gap-[3px] ml-auto">
        <span className="w-[6px] h-[6px] bg-black rounded-full" />
        <span className="w-[6px] h-[6px] bg-black rounded-full" />
        <span className="w-[6px] h-[6px] bg-black rounded-full" />
      </div>
    </nav>
  );
}
