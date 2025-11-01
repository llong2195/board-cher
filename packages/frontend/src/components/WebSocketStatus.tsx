import { useEffect, useState } from 'react';
import type { ConnectionState } from '../services/websocket.service';

export interface WebSocketStatusProps {
  connectionState: ConnectionState;
  className?: string;
  showText?: boolean;
}

/**
 * Visual indicator for WebSocket connection status
 * Shows different colors and text based on connection state
 *
 * @example
 * ```tsx
 * const { connectionState } = useWebSocket({ url, token });
 *
 * <WebSocketStatus
 *   connectionState={connectionState}
 *   showText={true}
 *   className="fixed top-4 right-4"
 * />
 * ```
 */
export function WebSocketStatus({
  connectionState,
  className = '',
  showText = true,
}: WebSocketStatusProps) {
  const [pulseKey, setPulseKey] = useState(0);

  // Trigger pulse animation on state change
  useEffect(() => {
    setPulseKey((prev) => prev + 1);
  }, [connectionState]);

  const getStatusConfig = () => {
    switch (connectionState) {
      case 'connected':
        return {
          color: 'bg-green-500',
          text: 'Connected',
          border: 'border-green-600',
          textColor: 'text-green-700',
        };
      case 'connecting':
        return {
          color: 'bg-yellow-500',
          text: 'Connecting...',
          border: 'border-yellow-600',
          textColor: 'text-yellow-700',
        };
      case 'reconnecting':
        return {
          color: 'bg-yellow-500',
          text: 'Reconnecting...',
          border: 'border-yellow-600',
          textColor: 'text-yellow-700',
        };
      case 'disconnected':
      default:
        return {
          color: 'bg-red-500',
          text: 'Disconnected',
          border: 'border-red-600',
          textColor: 'text-red-700',
        };
    }
  };

  const { color, text, border, textColor } = getStatusConfig();
  const isAnimating = connectionState === 'connecting' || connectionState === 'reconnecting';

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${border} bg-white shadow-sm ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`WebSocket status: ${text}`}
    >
      {/* Status indicator dot */}
      <div className="relative">
        <div
          className={`h-2.5 w-2.5 rounded-full ${color} ${isAnimating ? 'animate-pulse' : ''}`}
          key={pulseKey}
        />
        {connectionState === 'connected' && (
          <div
            className={`absolute inset-0 h-2.5 w-2.5 rounded-full ${color} opacity-75 animate-ping`}
          />
        )}
      </div>

      {/* Status text */}
      {showText && <span className={`text-sm font-medium ${textColor}`}>{text}</span>}
    </div>
  );
}

/**
 * Minimal status indicator (dot only)
 * Useful for compact layouts
 */
export function WebSocketStatusDot({ connectionState }: { connectionState: ConnectionState }) {
  return (
    <WebSocketStatus connectionState={connectionState} showText={false} className="px-2 py-2" />
  );
}
