// On-screen debug panel for iOS testing
// Shows logs without needing Safari dev tools

import { useState, useEffect, useRef } from 'react';
import { debugLog, type LogEntry } from '../../utils/debugLogger';

export function DebugPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = debugLog.subscribe(setLogs);
    return unsubscribe;
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && isExpanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isExpanded]);

  if (!debugLog.isEnabled()) {
    return null;
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return '#ff4444';
      case 'warn': return '#ffaa00';
      case 'debug': return '#888888';
      default: return '#00cc00';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toISOString().substr(11, 12);
  };

  const formatData = (data: unknown): string => {
    if (data === undefined) return '';
    try {
      if (typeof data === 'object') {
        return JSON.stringify(data, null, 0);
      }
      return String(data);
    } catch {
      return '[Object]';
    }
  };

  // Minimized badge
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '10px',
          zIndex: 9999,
          background: '#333',
          color: '#0f0',
          border: '1px solid #0f0',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          fontSize: '12px',
          fontFamily: 'monospace',
          cursor: 'pointer',
        }}
      >
        {logs.length}
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: isExpanded ? '0' : '80px',
        left: '0',
        right: '0',
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.95)',
        borderTop: '2px solid #0f0',
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#0f0',
        maxHeight: isExpanded ? '60vh' : '120px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          background: '#222',
          borderBottom: '1px solid #333',
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 'bold' }}>
          DEBUG ({logs.length} logs)
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => debugLog.clear()}
            style={{
              background: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '3px',
              padding: '2px 6px',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '3px',
              padding: '2px 6px',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            style={{
              background: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '3px',
              padding: '2px 6px',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            Min
          </button>
        </div>
      </div>

      {/* Logs */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: '#666', padding: '8px' }}>No logs yet...</div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              style={{
                padding: '2px 4px',
                borderBottom: '1px solid #222',
                wordBreak: 'break-all',
              }}
            >
              <span style={{ color: '#666' }}>{formatTime(log.timestamp)}</span>
              {' '}
              <span style={{ color: getLevelColor(log.level) }}>[{log.level.toUpperCase()}]</span>
              {' '}
              <span style={{ color: '#6cf' }}>[{log.tag}]</span>
              {' '}
              <span style={{ color: '#fff' }}>{log.message}</span>
              {log.data !== undefined && (
                <span style={{ color: '#999' }}> {formatData(log.data)}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
