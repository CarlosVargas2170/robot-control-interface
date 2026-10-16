import { useCallback, useEffect, useRef, useState } from "react";

export type MeseroLogLevel = "info" | "success" | "warning" | "error";

type LogWriter = (message: string, level?: MeseroLogLevel) => void;

function encodeAssetPath(path: string): string {
  return path
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function resolveMeseroAudioUrl(fileName: string): string {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}apps/mesero-control/audio/${encodeAssetPath(fileName)}`;
}

function releaseAudio(audio: HTMLAudioElement): void {
  audio.pause();
  audio.currentTime = 0;
  audio.removeAttribute("src");
  audio.load();
}

export function useMeseroAudio(writeLog: LogWriter) {
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const writeLogRef = useRef(writeLog);
  const [activeAudioLabel, setActiveAudioLabel] = useState<string | null>(null);

  useEffect(() => {
    writeLogRef.current = writeLog;
  }, [writeLog]);

  const stopLocalAudio = useCallback(() => {
    const current = currentAudioRef.current;
    currentAudioRef.current = null;
    if (current) releaseAudio(current);
    setActiveAudioLabel(null);
  }, []);

  const playLocalAudio = useCallback(
    async (fileName: string, label: string): Promise<boolean> => {
      const previous = currentAudioRef.current;
      currentAudioRef.current = null;
      if (previous) releaseAudio(previous);

      const audio = new Audio(resolveMeseroAudioUrl(fileName));
      audio.preload = "auto";
      currentAudioRef.current = audio;
      setActiveAudioLabel(label);

      const clearIfCurrent = () => {
        if (currentAudioRef.current !== audio) return;
        currentAudioRef.current = null;
        setActiveAudioLabel(null);
      };

      audio.addEventListener("ended", clearIfCurrent, { once: true });
      audio.addEventListener("error", clearIfCurrent, { once: true });

      try {
        await audio.play();
        writeLogRef.current(`Audio local: ${label}`, "success");
        return true;
      } catch (error) {
        clearIfCurrent();
        releaseAudio(audio);
        const message = error instanceof Error ? error.message : "No se pudo reproducir";
        writeLogRef.current(`Audio local no disponible: ${message}`, "warning");
        return false;
      }
    },
    [],
  );

  useEffect(
    () => () => {
      const current = currentAudioRef.current;
      currentAudioRef.current = null;
      if (current) releaseAudio(current);
    },
    [],
  );

  return {
    activeAudioLabel,
    playLocalAudio,
    stopLocalAudio,
  };
}
