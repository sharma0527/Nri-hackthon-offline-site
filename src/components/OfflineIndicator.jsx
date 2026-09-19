import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <div
      className={`offline-badge ${isOnline ? 'cached-ready' : 'offline-active'}`}
      title={isOnline ? 'Network connected - local cache active' : 'Offline mode active - playing local bundle'}
    >
      <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
      <span>{isOnline ? 'Offline Ready' : 'Offline Mode'}</span>
    </div>
  );
}
