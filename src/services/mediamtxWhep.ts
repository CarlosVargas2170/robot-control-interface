// ─── MediaMTX WHEP client (WebRTC HTTP Egress Protocol) ───────────────────────

/**
 * Conecta a un path de MediaMTX vía WHEP y devuelve el MediaStream remoto.
 *
 * MediaMTX expone: POST {baseUrl}/{path}/whep  (SDP offer → SDP answer)
 *
 * @see https://github.com/bluenviron/mediamtx
 */
/** Construye la URL WHEP sin duplicar path ni barras. */
export function buildWhepUrl(baseUrl: string, path: string): string {
  const origin = baseUrl.replace(/\/$/, "");
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  // Si baseUrl ya termina con el path (p.ej. .../camaras), no lo duplicar
  if (cleanPath && origin.endsWith(`/${cleanPath}`)) {
    return `${origin}/whep`;
  }
  return cleanPath ? `${origin}/${cleanPath}/whep` : `${origin}/whep`;
}

export async function connectWhep(
  baseUrl: string,
  path: string,
  signal?: AbortSignal,
): Promise<{ pc: RTCPeerConnection; stream: MediaStream }> {
  const whepUrl = buildWhepUrl(baseUrl, path);
  console.log(`[WHEP] POST ${whepUrl}`);

  const pc = new RTCPeerConnection({
    // MediaMTX suele meter candidatos en el SDP; STUN público como fallback
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  const stream = new MediaStream();

  pc.ontrack = (ev) => {
    for (const track of ev.streams[0]?.getTracks() ?? [ev.track]) {
      stream.addTrack(track);
    }
  };

  // Solo recepción de video (y audio si viene)
  pc.addTransceiver("video", { direction: "recvonly" });
  pc.addTransceiver("audio", { direction: "recvonly" });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // Esperar a que termine el gathering de ICE (SDP completo para MediaMTX)
  await waitForIceGathering(pc, signal);

  const localSdp = pc.localDescription?.sdp;
  if (!localSdp) {
    pc.close();
    throw new Error("No se generó SDP local");
  }

  if (signal?.aborted) {
    pc.close();
    throw new DOMException("Aborted", "AbortError");
  }

  const res = await fetch(whepUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/sdp",
    },
    body: localSdp,
    signal,
  });

  if (!res.ok) {
    pc.close();
    throw new Error(`WHEP ${whepUrl} → HTTP ${res.status}`);
  }

  const answerSdp = await res.text();
  await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

  return { pc, stream };
}

function waitForIceGathering(
  pc: RTCPeerConnection,
  signal?: AbortSignal,
  timeoutMs = 3000,
): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();

  return new Promise((resolve, reject) => {
    const onState = () => {
      if (pc.iceGatheringState === "complete") cleanup(resolve);
    };

    const timer = window.setTimeout(() => cleanup(resolve), timeoutMs);

    const onAbort = () => {
      cleanup(() => reject(new DOMException("Aborted", "AbortError")));
    };

    const cleanup = (fn: () => void) => {
      window.clearTimeout(timer);
      pc.removeEventListener("icegatheringstatechange", onState);
      signal?.removeEventListener("abort", onAbort);
      fn();
    };

    pc.addEventListener("icegatheringstatechange", onState);
    signal?.addEventListener("abort", onAbort);
  });
}
