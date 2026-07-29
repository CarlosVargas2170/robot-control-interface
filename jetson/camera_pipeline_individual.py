#!/usr/bin/env python3
"""
Pipeline GStreamer → MediaMTX con **streams individuales**.

Por qué: el composite 2×2 (un solo path "camaras") no permite al frontend
arrastrar/redimensionar cámaras de forma nativa con buena calidad.
Este script publica 4 paths independientes en MediaMTX:

  rtsp://localhost:8554/cam0
  rtsp://localhost:8554/cam1
  rtsp://localhost:8554/cam2
  rtsp://localhost:8554/monitor

El frontend (VIDEO_STRATEGY=webrtc) consume:
  http://<JETSON_IP>:8889/cam0/whep
  http://<JETSON_IP>:8889/cam1/whep
  ...

Requisitos:
  - MediaMTX corriendo (puertos 8554 RTSP publish, 8889 WebRTC)
  - GStreamer con plugins NVIDIA (nvvidconv, nvv4l2h264enc) en Jetson
  - Ajustar CAMERAS / DISPLAY según tu hardware

Uso:
  python3 camera_pipeline_individual.py
"""

from __future__ import annotations

import signal
import sys

import gi

gi.require_version("Gst", "1.0")
from gi.repository import Gst, GLib  # noqa: E402

Gst.init(None)

# ── Configuración ────────────────────────────────────────────────────────────

# Cámaras V4L2 (primeros 3 cuadrantes del layout anterior)
CAMERAS = [
    {"path": "cam0", "device": "/dev/video0", "name": "CAM FRONT"},
    {"path": "cam1", "device": "/dev/video1", "name": "CAM REAR"},
    {"path": "cam2", "device": "/dev/video2", "name": "CAM WIDE"},
]

# Monitor de la Jetson (antes cuadrante inferior-derecho)
MONITOR = {
    "path": "monitor",
    "display": ":1",
    "name": "MONITOR",
}

# MediaMTX — publicación RTSP
MEDIAMTX_RTSP = "rtsp://127.0.0.1:8554"

# Resolución de encode por stream (independiente del UI del frontend)
ENCODE_W = 640
ENCODE_H = 360
BITRATE_KBPS = 2_000


def make_camera_branch(cam: dict) -> Gst.Pipeline:
    """v4l2 (MJPEG) → decode → nvvidconv → H264 → RTSP publish."""
    path = cam["path"]
    device = cam["device"]
    location = f"{MEDIAMTX_RTSP}/{path}"

    # Nota: ajustá caps si tus cams no son MJPEG
    desc = f"""
        v4l2src device={device} name=src_{path} do-timestamp=true
          ! image/jpeg,width=640,height=480,framerate=30/1
          ! jpegdec name=jpegdec_{path}
          ! nvvidconv name=conv_{path}
          ! video/x-raw(memory:NVMM),width={ENCODE_W},height={ENCODE_H},format=NV12
          ! nvv4l2h264enc name=enc_{path} bitrate={BITRATE_KBPS * 1000}
              iframeinterval=30 insert-sps-pps=true preset-level=1
          ! h264parse name=parse_{path} config-interval=1
          ! rtspclientsink name=sink_{path} location={location}
              protocols=tcp latency=0
    """
    pipeline = Gst.parse_launch(desc)
    return pipeline


def make_monitor_branch(mon: dict) -> Gst.Pipeline:
    """ximagesrc (pantalla) → nvvidconv → H264 → RTSP publish."""
    path = mon["path"]
    display = mon["display"]
    location = f"{MEDIAMTX_RTSP}/{path}"

    desc = f"""
        ximagesrc display-name={display} name=src_{path}
            use-damage=false show-pointer=false
          ! video/x-raw,framerate=15/1
          ! videoconvert
          ! nvvidconv name=conv_{path}
          ! video/x-raw(memory:NVMM),width={ENCODE_W},height={ENCODE_H},format=NV12
          ! nvv4l2h264enc name=enc_{path} bitrate={BITRATE_KBPS * 1000}
              iframeinterval=30 insert-sps-pps=true preset-level=1
          ! h264parse name=parse_{path} config-interval=1
          ! rtspclientsink name=sink_{path} location={location}
              protocols=tcp latency=0
    """
    pipeline = Gst.parse_launch(desc)
    return pipeline


def main() -> int:
    pipelines: list[Gst.Pipeline] = []

    for cam in CAMERAS:
        try:
            p = make_camera_branch(cam)
            pipelines.append(p)
            print(f"[ok] {cam['name']} → {MEDIAMTX_RTSP}/{cam['path']}")
        except Exception as exc:
            print(f"[warn] No se pudo crear {cam['path']}: {exc}", file=sys.stderr)

    try:
        p = make_monitor_branch(MONITOR)
        pipelines.append(p)
        print(f"[ok] {MONITOR['name']} → {MEDIAMTX_RTSP}/{MONITOR['path']}")
    except Exception as exc:
        print(f"[warn] Monitor: {exc}", file=sys.stderr)

    if not pipelines:
        print("Ningún pipeline creado. Revisá devices y plugins GStreamer.", file=sys.stderr)
        return 1

    loop = GLib.MainLoop()

    def on_error(bus, msg):
        err, debug = msg.parse_error()
        src = msg.src.get_name() if msg.src else "?"
        print(f"[error] {src}: {err.message} ({debug})", file=sys.stderr)
        return True

    for p in pipelines:
        bus = p.get_bus()
        bus.add_signal_watch()
        bus.connect("message::error", on_error)
        p.set_state(Gst.State.PLAYING)

    def handle_sigint(sig, frame):
        print("\nCerrando pipelines...")
        loop.quit()

    signal.signal(signal.SIGINT, handle_sigint)
    signal.signal(signal.SIGTERM, handle_sigint)

    print("Pipelines individuales en PLAYING. Ctrl+C para salir.")
    print("Frontend: VITE_VIDEO_STRATEGY=webrtc  VITE_CAMERA_SOURCE=mediamtx")
    print(f"WHEP ejemplo: http://<JETSON_IP>:8889/{CAMERAS[0]['path']}/whep")

    try:
        loop.run()
    finally:
        for p in pipelines:
            p.set_state(Gst.State.NULL)
        print("Pipelines detenidos.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
