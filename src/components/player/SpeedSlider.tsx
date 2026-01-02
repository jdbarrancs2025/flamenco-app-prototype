interface SpeedSliderProps {
  value: number;
  onChange?: (value: number) => void;
}

export function SpeedSlider({ value = 1.0, onChange }: SpeedSliderProps) {
  // Convert value (0.8-1.2) to percentage (0-100)
  const percentage = ((value - 0.8) / 0.4) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange?.(newValue);
  };

  return (
    <div className="w-full flex items-center" style={{ padding: '0 11px', height: '44px' }}>
      <div className="relative w-full flex items-center" style={{ height: '16px' }}>
        {/* Track background */}
        <div className="absolute w-full flex" style={{ height: '16px' }}>
          {/* Active (purple) portion */}
          <div
            className="h-full"
            style={{ width: `${percentage}%`, backgroundColor: '#6750A4', borderRadius: '16px 0 0 16px' }}
          />
          {/* Handle */}
          <div style={{ width: '4px', height: '44px', backgroundColor: '#6750A4', borderRadius: '2px', marginTop: '-14px' }} />
          {/* Inactive (light purple) portion */}
          <div
            className="h-full flex-1 relative"
            style={{ backgroundColor: '#E8DEF8', borderRadius: '0 16px 16px 0' }}
          >
            {/* Stop dot at end */}
            <div
              className="absolute top-1/2 rounded-full"
              style={{ right: '4px', transform: 'translateY(-50%)', width: '4px', height: '4px', backgroundColor: '#4A4459' }}
            />
          </div>
        </div>

        {/* Hidden range input for interaction */}
        <input
          type="range"
          min="0.8"
          max="1.2"
          step="0.01"
          value={value}
          onChange={handleChange}
          className="absolute w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 10 }}
          aria-label="Velocidad de reproducción"
        />
      </div>
    </div>
  );
}
