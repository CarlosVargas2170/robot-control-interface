/**
 * Strategy Pattern — Video Stream Interface
 *
 * Every video-streaming strategy must accept these props.
 * To swap implementations just change the component passed to
 * `Camera`'s `strategy` prop.
 */
export interface VideoStreamStrategyProps {
  /** Backend camera identifier (e.g. "cam_0") */
  cameraId: string;
  /** Base URL of the backend server */
  backendUrl: string;
  /** Extra CSS classes applied to the <img> or <video> element */
  className?: string;
  /** Fired when the stream status changes */
  onStatusChange?: (connected: boolean, latencyMs?: number) => void;
}
