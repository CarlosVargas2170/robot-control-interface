// ─── Shared composite WebRTC stream (single MediaMTX path, many consumers) ───

import { connectWhep } from "./mediamtxWhep";

/**
 * Un solo path MediaMTX (p.ej. "camaras") con el mosaic 2×2 del GStreamer.
 * Varios widgets de cámara comparten la misma conexión WHEP + <video> oculto
 * y cada uno recorta su cuadrante en canvas.
 */

type Listener = (video: HTMLVideoElement | null, error: string | null) => void;

interface SharedState {
  refCount: number;
  pc: RTCPeerConnection | null;
  video: HTMLVideoElement | null;
  error: string | null;
  listeners: Set<Listener>;
  abort: AbortController | null;
  key: string | null;
}

const state: SharedState = {
  refCount: 0,
  pc: null,
  video: null,
  error: null,
  listeners: new Set(),
  abort: null,
  key: null,
};

function notify() {
  for (const fn of state.listeners) {
    fn(state.video, state.error);
  }
}

async function start(baseUrl: string, path: string) {
  const key = `${baseUrl}|${path}`;
  if (state.key === key && state.video) return;

  stopInternal();
  state.key = key;
  state.error = null;
  state.abort = new AbortController();

  try {
    const { pc, stream } = await connectWhep(
      baseUrl,
      path,
      state.abort.signal,
    );
    state.pc = pc;

    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.style.display = "none";
    document.body.appendChild(video);
    video.srcObject = stream;

    await video.play().catch(() => {
      /* autoplay policies: muted + playsInline suele bastar */
    });

    state.video = video;
    notify();
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    state.error = err instanceof Error ? err.message : "Error WHEP composite";
    console.warn("[compositeStream]", state.error);
    notify();
  }
}

function stopInternal() {
  state.abort?.abort();
  state.abort = null;

  if (state.pc) {
    state.pc.close();
    state.pc = null;
  }

  if (state.video) {
    state.video.pause();
    state.video.srcObject = null;
    state.video.remove();
    state.video = null;
  }

  state.key = null;
}

/**
 * Adquiere el stream compuesto. El primer consumidor abre WHEP;
 * el último lo cierra.
 */
export function acquireCompositeStream(
  baseUrl: string,
  path: string,
  listener: Listener,
): () => void {
  state.listeners.add(listener);
  state.refCount += 1;

  // Entregar estado actual de inmediato
  listener(state.video, state.error);

  void start(baseUrl, path);

  return () => {
    state.listeners.delete(listener);
    state.refCount = Math.max(0, state.refCount - 1);
    if (state.refCount === 0) {
      stopInternal();
      state.error = null;
      notify();
    }
  };
}

/** Mapeo de posición 0..N-1 → región normalizada en el frame NxM */
export function gridRect(
  position: number,
  cols: number,
  rows: number,
): {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
} {
  const col = position % cols;
  const row = Math.floor(position / cols);
  return {
    sx: col / cols,
    sy: row / rows,
    sw: 1 / cols,
    sh: 1 / rows,
  };
}

/**
 * @deprecated Usar `gridRect()` para layouts genéricos.
 * Solo funciona para 2×2.
 */
export function quadrantRect(quadrant: number): {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
} {
  return gridRect(quadrant, 2, 2);
}
