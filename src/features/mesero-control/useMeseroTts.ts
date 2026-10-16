import { useCallback, useEffect, useRef, useState } from "react";
import type { MeseroLogLevel } from "./useMeseroAudio";

const TTS_SAMPLE_RATE = 24_000;
const TTS_PREBUFFER_SECONDS = 0.15;
const TTS_HEALTH_TIMEOUT_MS = 4_000;
const TTS_SYNTHESIS_TIMEOUT_MS = 90_000;

export type TtsStatus = "unknown" | "checking" | "online" | "offline";

type LogWriter = (message: string, level?: MeseroLogLevel) => void;

interface LegacyAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getTtsOrigin(baseUrl: string): string {
  const parsed = new URL(baseUrl);
  return `${parsed.protocol}//${parsed.hostname}:9000`;
}

function concatBytes(first: Uint8Array, second: Uint8Array): Uint8Array {
  const result = new Uint8Array(first.length + second.length);
  result.set(first, 0);
  result.set(second, first.length);
  return result;
}

function decodeLittleEndianFloat32(bytes: Uint8Array): Float32Array {
  const sampleCount = Math.floor(bytes.byteLength / 4);
  const samples = new Float32Array(sampleCount);
  const view = new DataView(bytes.buffer, bytes.byteOffset, sampleCount * 4);
  for (let index = 0; index < sampleCount; index += 1) {
    const sample = view.getFloat32(index * 4, true);
    samples[index] = Number.isFinite(sample) ? Math.max(-1, Math.min(1, sample)) : 0;
  }
  return samples;
}

function waitForScheduledAudio(milliseconds: number, signal: AbortSignal): Promise<void> {
  if (milliseconds <= 0 || signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, milliseconds);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

async function playPcmStream(
  response: Response,
  audioContext: AudioContext,
  signal: AbortSignal,
): Promise<void> {
  if (!response.body) throw new Error("El navegador no soporta audio en streaming");

  const reader = response.body.getReader();
  let nextStartTime = audioContext.currentTime + TTS_PREBUFFER_SECONDS;
  let leftover = new Uint8Array(0);

  try {
    while (!signal.aborted) {
      const chunk = await reader.read();
      if (chunk.done) break;
      if (!chunk.value?.length) continue;

      const combined = concatBytes(leftover, chunk.value);
      const usableLength = combined.length - (combined.length % 4);
      leftover = combined.slice(usableLength);
      if (usableLength === 0) continue;

      const samples = decodeLittleEndianFloat32(combined.subarray(0, usableLength));
      const buffer = audioContext.createBuffer(1, samples.length, TTS_SAMPLE_RATE);
      buffer.getChannelData(0).set(samples);

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      const startTime = Math.max(nextStartTime, audioContext.currentTime);
      source.start(startTime);
      nextStartTime = startTime + buffer.duration;
    }

    if (signal.aborted) {
      await reader.cancel().catch(() => undefined);
      return;
    }

    const remainingMs = Math.max(0, (nextStartTime - audioContext.currentTime) * 1_000);
    await waitForScheduledAudio(remainingMs, signal);
  } finally {
    reader.releaseLock();
  }
}

export function useMeseroTts(writeLog: LogWriter) {
  const writeLogRef = useRef(writeLog);
  const healthControllerRef = useRef<AbortController | null>(null);
  const synthesisControllerRef = useRef<AbortController | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mountedRef = useRef(true);
  const [ttsStatus, setTtsStatus] = useState<TtsStatus>("unknown");
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    writeLogRef.current = writeLog;
  }, [writeLog]);

  const stopTts = useCallback(() => {
    synthesisControllerRef.current?.abort();
    synthesisControllerRef.current = null;
    const context = audioContextRef.current;
    audioContextRef.current = null;
    if (context && context.state !== "closed") void context.close();
    if (mountedRef.current) setIsSpeaking(false);
  }, []);

  const checkTtsService = useCallback(async (baseUrl: string): Promise<boolean> => {
    if (!mountedRef.current) return false;
    healthControllerRef.current?.abort();
    const controller = new AbortController();
    healthControllerRef.current = controller;
    if (mountedRef.current) setTtsStatus("checking");
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, TTS_HEALTH_TIMEOUT_MS);

    try {
      const response = await fetch(`${getTtsOrigin(baseUrl)}/health`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body: unknown = await response.json();
      if (!isRecord(body) || body.status !== "ok") {
        throw new Error("Respuesta de salud inesperada");
      }
      if (controller.signal.aborted || healthControllerRef.current !== controller) return false;
      if (mountedRef.current) setTtsStatus("online");
      const gpu = body.gpu === true ? "GPU activa" : "sin GPU";
      const speakers = typeof body.speakers_loaded === "number" ? body.speakers_loaded : 0;
      writeLogRef.current(`TTS disponible (${gpu}, voces: ${speakers})`, "success");
      return true;
    } catch (error) {
      const isCurrent = healthControllerRef.current === controller;
      if (isCurrent && mountedRef.current && (!controller.signal.aborted || timedOut)) {
        setTtsStatus("offline");
        const message = timedOut
          ? "Tiempo de espera agotado"
          : error instanceof Error
            ? error.message
            : "Error desconocido";
        writeLogRef.current(`TTS no disponible: ${message}`, "warning");
      }
      return false;
    } finally {
      window.clearTimeout(timeout);
      if (healthControllerRef.current === controller) healthControllerRef.current = null;
    }
  }, []);

  const speak = useCallback(
    async (text: string, baseUrl: string, token: string): Promise<boolean> => {
      if (!mountedRef.current) return false;
      const normalizedText = text.trim();
      if (!normalizedText) {
        writeLogRef.current("Escribe un texto antes de enviarlo al TTS", "warning");
        return false;
      }
      if (!token.trim()) {
        writeLogRef.current("Falta el token del servicio TTS", "warning");
        return false;
      }

      stopTts();
      const AudioContextConstructor =
        window.AudioContext ?? (window as LegacyAudioWindow).webkitAudioContext;
      if (!AudioContextConstructor) {
        writeLogRef.current("Web Audio API no está disponible", "error");
        return false;
      }

      const controller = new AbortController();
      synthesisControllerRef.current = controller;
      let synthesisTimedOut = false;
      const timeout = window.setTimeout(() => {
        synthesisTimedOut = true;
        controller.abort();
      }, TTS_SYNTHESIS_TIMEOUT_MS);
      let ownedAudioContext: AudioContext | null = null;

      try {
        const audioContext = new AudioContextConstructor();
        ownedAudioContext = audioContext;
        audioContextRef.current = audioContext;
        if (audioContext.state === "suspended") await audioContext.resume();
        if (audioContext.state !== "running") {
          throw new Error(`No se pudo activar el audio (${audioContext.state})`);
        }

        if (mountedRef.current) setIsSpeaking(true);
        writeLogRef.current("Sintetizando texto…", "info");
        const response = await fetch(`${getTtsOrigin(baseUrl)}/synthesize/play`, {
          method: "POST",
          headers: {
            Accept: "application/octet-stream",
            Authorization: `Bearer ${token.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: normalizedText,
            speaker_id: "default",
            language: "es",
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const detail = (await response.text()).slice(0, 300);
          throw new Error(`HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
        }

        await playPcmStream(response, audioContext, controller.signal);
        if (controller.signal.aborted) return false;
        writeLogRef.current("Audio TTS reproducido", "success");
        return true;
      } catch (error) {
        if (!controller.signal.aborted || synthesisTimedOut) {
          const message = synthesisTimedOut
            ? "Tiempo de espera agotado"
            : error instanceof Error
              ? error.message
              : "Error desconocido";
          writeLogRef.current(`Error TTS: ${message}`, "error");
        }
        return false;
      } finally {
        window.clearTimeout(timeout);
        const isCurrentSynthesis = synthesisControllerRef.current === controller;
        if (isCurrentSynthesis) synthesisControllerRef.current = null;
        if (ownedAudioContext && audioContextRef.current === ownedAudioContext) {
          audioContextRef.current = null;
        }
        if (ownedAudioContext && ownedAudioContext.state !== "closed") {
          await ownedAudioContext.close().catch(() => undefined);
        }
        if (isCurrentSynthesis && mountedRef.current) setIsSpeaking(false);
      }
    },
    [stopTts],
  );

  const resetTtsStatus = useCallback(() => {
    healthControllerRef.current?.abort();
    healthControllerRef.current = null;
    if (mountedRef.current) setTtsStatus("unknown");
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      healthControllerRef.current?.abort();
      synthesisControllerRef.current?.abort();
      const context = audioContextRef.current;
      audioContextRef.current = null;
      if (context && context.state !== "closed") void context.close();
    };
  }, []);

  return {
    ttsStatus,
    isSpeaking,
    checkTtsService,
    resetTtsStatus,
    speak,
    stopTts,
  };
}
