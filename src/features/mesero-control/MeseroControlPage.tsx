import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import {
  ALERT_AUDIO,
  ALERT_OPTIONS,
  EMOTIONS,
  GENERAL_AUDIO,
  GREETING_AUDIO,
  KIKY_AUDIO,
} from "./catalog";
import type { AudioAction } from "./catalog";
import {
  MESERO_OPTIONS,
  MESERO_TTS_SESSION_KEY,
} from "./constants";
import { useMeseroAudio } from "./useMeseroAudio";
import type { MeseroLogLevel } from "./useMeseroAudio";
import { useMeseroController } from "./useMeseroController";
import { useMeseroTts } from "./useMeseroTts";
import type {
  MeseroConfig,
  MeseroMerchant,
  MeseroProduct,
  PaymentPollingStatus,
  ProductFilterMode,
} from "./types";
import "./mesero-control.css";

interface LogEntry {
  id: number;
  time: string;
  message: string;
  level: MeseroLogLevel;
}

interface SectionProps {
  title: string;
  icon: string;
  actions?: ReactNode;
  children: ReactNode;
}

interface ActionGridProps {
  actions: readonly AudioAction[];
  onAction: (action: AudioAction) => void;
}

function Section({ title, icon, actions, children }: SectionProps) {
  return (
    <section className="mc-section">
      <div className="mc-section-heading">
        <span className="mc-section-icon" aria-hidden="true">{icon}</span>
        <h2 className="mc-section-title">{title}</h2>
        {actions}
      </div>
      <div className="mc-section-body">{children}</div>
    </section>
  );
}

function ActionGrid({ actions, onAction }: ActionGridProps) {
  return (
    <div className="mc-action-grid">
      {actions.map((action) => (
        <button
          className="mc-action"
          key={action.id}
          type="button"
          onClick={() => onAction(action)}
        >
          <span className="mc-action-icon" aria-hidden="true">{action.icon}</span>
          <span className="mc-action-label">{action.label}</span>
          {action.description ? (
            <span className="mc-action-detail">{action.description}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function commandWasCooledDown(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.played === false) return true;
  return isRecord(value.data) && value.data.played === false;
}

function clampVolume(value: string): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : 1;
}

function parseMerchantIds(value: string): number[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => Number.parseInt(item.trim(), 10))
        .filter((item) => Number.isFinite(item) && item > 0),
    ),
  );
}

function getInitialTtsToken(): string {
  const environmentToken = import.meta.env.VITE_MESERO_TTS_TOKEN;
  if (typeof environmentToken === "string" && environmentToken.trim()) {
    return environmentToken.trim();
  }
  try {
    return window.sessionStorage.getItem(MESERO_TTS_SESSION_KEY) ?? "";
  } catch {
    return "";
  }
}

function formatMoney(value: number): string {
  return `Bs ${Number.isFinite(value) ? value.toFixed(2) : "0.00"}`;
}

function formatLastSale(time: string | undefined): string | null {
  if (!time) return null;
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("es-BO", { hour12: false });
}

function buildPaymentDetail(status: PaymentPollingStatus): string {
  const detail: string[] = [];
  if (status.productName) detail.push(status.productName);
  if (status.productId !== undefined) detail.push(`prod. #${status.productId}`);
  if (status.merchantId !== undefined) detail.push(`merchant #${status.merchantId}`);
  if (status.orderId !== undefined) detail.push(`orden #${status.orderId}`);
  if (status.amount !== undefined) detail.push(formatMoney(status.amount));
  return detail.join(" · ") || (status.isPolling ? "Esperando confirmación" : "Sin producto activo");
}

export function MeseroControlPage() {
  const logSequenceRef = useRef(0);
  const logListRef = useRef<HTMLDivElement | null>(null);
  const initialLogWrittenRef = useRef(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const writeLog = useCallback((message: string, level: MeseroLogLevel = "info") => {
    const entry: LogEntry = {
      id: ++logSequenceRef.current,
      time: new Date().toLocaleTimeString("es-BO", { hour12: false }),
      message,
      level,
    };
    setLogs((current) => [...current.slice(-249), entry]);
  }, []);

  const controller = useMeseroController(writeLog);
  const audio = useMeseroAudio(writeLog);
  const tts = useMeseroTts(writeLog);
  const { stopLocalAudio } = audio;
  const { resetTtsStatus, stopTts } = tts;

  const [alertFile, setAlertFile] = useState(ALERT_OPTIONS[0]?.value ?? "");
  const [alertVolume, setAlertVolume] = useState("1");
  const [customAsset, setCustomAsset] = useState("");
  const [customDisplayText, setCustomDisplayText] = useState("");
  const [customVolume, setCustomVolume] = useState("1");
  const [customForce, setCustomForce] = useState(false);
  const [ttsText, setTtsText] = useState("");
  const [ttsToken, setTtsToken] = useState(getInitialTtsToken);
  const [configBaseUrl, setConfigBaseUrl] = useState("");
  const [configBearerToken, setConfigBearerToken] = useState("");
  const [configMerchantIds, setConfigMerchantIds] = useState("");
  const [configProductId, setConfigProductId] = useState("");
  const [newMerchantId, setNewMerchantId] = useState("");

  const selectedOption = useMemo(
    () => MESERO_OPTIONS.find((option) => option.url === controller.selectedUrl),
    [controller.selectedUrl],
  );
  const isMeseroTwo = useMemo(() => {
    let hostname = "";
    try {
      hostname = new URL(controller.selectedUrl).hostname;
    } catch {
      // La lista ya valida URLs; se conserva el fallback por ID/etiqueta.
    }
    return (
      selectedOption?.id === "mesero-2" ||
      /mesero\s*2/i.test(selectedOption?.label ?? "") ||
      hostname === "100.105.14.4"
    );
  }, [controller.selectedUrl, selectedOption]);
  const generalAudio = useMemo(
    () => GENERAL_AUDIO.filter((action) =>
      action.id === "order-mesero-2" ? isMeseroTwo : action.id !== "order" || !isMeseroTwo,
    ),
    [isMeseroTwo],
  );

  useEffect(() => {
    if (initialLogWrittenRef.current) return;
    initialLogWrittenRef.current = true;
    writeLog("Panel Mesero listo. Selecciona un robot y pulsa Conectar.", "info");
  }, [writeLog]);

  useEffect(() => {
    const list = logListRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [logs]);

  useEffect(() => {
    const config = controller.configuration;
    if (!config) return;
    const frame = window.requestAnimationFrame(() => {
      setConfigBaseUrl(config.baseUrl ?? "");
      setConfigBearerToken(config.bearerToken ?? "");
      setConfigMerchantIds(config.merchantIds.join(","));
      setConfigProductId(config.productId === undefined ? "" : String(config.productId));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [controller.configuration]);

  useEffect(() => {
    stopLocalAudio();
    stopTts();
    resetTtsStatus();
  }, [controller.selectedUrl, resetTtsStatus, stopLocalAudio, stopTts]);

  const handleConnect = useCallback(async () => {
    const connected = await controller.connect();
    if (connected) await tts.checkTtsService(controller.selectedUrl);
    else tts.resetTtsStatus();
  }, [controller, tts]);

  const playAudioAction = useCallback(
    async (action: AudioAction) => {
      void audio.playLocalAudio(action.localFile, action.label);

      if (action.endpoint) {
        const result = await controller.sendCommand(action.endpoint);
        if (!result.ok || commandWasCooledDown(result.data)) {
          audio.stopLocalAudio();
          if (commandWasCooledDown(result.data)) {
            writeLog("El robot está en cooldown; audio local detenido", "warning");
          }
        }
        return;
      }

      if (!action.remoteAsset) return;
      const result = await controller.sendCommand("/audio/play", {
        asset: action.remoteAsset,
        volume: 1,
        force: false,
        displayText: action.displayText ?? null,
      });
      if (!result.ok) writeLog("El audio continuará solamente en este navegador", "warning");
    },
    [audio, controller, writeLog],
  );

  const handleAlert = useCallback(async () => {
    const option = ALERT_OPTIONS.find((item) => item.value === alertFile);
    if (!option) {
      writeLog("Selecciona una alerta", "warning");
      return;
    }
    void audio.playLocalAudio(option.value, option.label);
    const result = await controller.sendCommand("/audio/play", {
      asset: `audio/${option.value}`,
      volume: clampVolume(alertVolume),
      force: true,
      displayText: null,
      showOverlay: false,
    });
    if (!result.ok) writeLog("La alerta continuará solamente en este navegador", "warning");
  }, [alertFile, alertVolume, audio, controller, writeLog]);

  const handleCustomAudio = useCallback(async () => {
    const normalizedAsset = customAsset.trim().replace(/^\/+/, "");
    if (!normalizedAsset) {
      writeLog("Escribe la ruta del audio personalizado", "warning");
      return;
    }
    const localFile = normalizedAsset.split("/").filter(Boolean).pop();
    if (localFile) {
      void audio.playLocalAudio(localFile, customDisplayText.trim() || localFile);
    }
    const remoteAsset = normalizedAsset.startsWith("audio/")
      ? normalizedAsset
      : `audio/${normalizedAsset}`;
    const result = await controller.sendCommand("/audio/play", {
      asset: remoteAsset,
      volume: clampVolume(customVolume),
      force: customForce,
      displayText: customDisplayText.trim() || null,
    });
    if (!result.ok) writeLog("El audio personalizado no se reprodujo en el robot", "warning");
  }, [audio, controller, customAsset, customDisplayText, customForce, customVolume, writeLog]);

  const handleStopAudio = useCallback(async () => {
    audio.stopLocalAudio();
    tts.stopTts();
    await controller.sendCommand("/audio/stop");
  }, [audio, controller, tts]);

  const handleTtsTokenChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setTtsToken(value);
    try {
      if (value) window.sessionStorage.setItem(MESERO_TTS_SESSION_KEY, value);
      else window.sessionStorage.removeItem(MESERO_TTS_SESSION_KEY);
    } catch {
      // El token sigue disponible en memoria aunque sessionStorage esté bloqueado.
    }
  }, []);

  const handleSpeak = useCallback(async () => {
    const spoken = await tts.speak(ttsText, controller.selectedUrl, ttsToken);
    if (spoken) setTtsText("");
  }, [controller.selectedUrl, tts, ttsText, ttsToken]);

  const handleSaveConfig = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const update: Partial<MeseroConfig> = {};
      if (configMerchantIds.trim()) {
        const merchantIds = parseMerchantIds(configMerchantIds);
        if (merchantIds.length === 0) {
          writeLog("La lista de merchant IDs no contiene valores válidos", "warning");
          return;
        }
        update.merchantIds = merchantIds;
      }
      if (configBaseUrl.trim()) update.baseUrl = configBaseUrl.trim();
      if (configBearerToken.trim()) update.bearerToken = configBearerToken.trim();
      if (configProductId.trim()) {
        const productId = Number.parseInt(configProductId, 10);
        if (!Number.isFinite(productId) || productId <= 0) {
          writeLog("Product ID inválido", "warning");
          return;
        }
        update.productId = productId;
      }
      await controller.saveConfig(update);
    },
    [
      configBaseUrl,
      configBearerToken,
      configMerchantIds,
      configProductId,
      controller,
      writeLog,
    ],
  );

  const handleAddMerchant = useCallback(async () => {
    const merchantId = Number.parseInt(newMerchantId, 10);
    if (!Number.isFinite(merchantId) || merchantId <= 0) {
      writeLog("Merchant ID inválido", "warning");
      return;
    }
    const configuredIds = parseMerchantIds(configMerchantIds);
    const loadedIds = controller.productState?.merchants.map((merchant) => merchant.merchantId) ?? [];
    const ids = Array.from(new Set([...loadedIds, ...configuredIds]));
    if (!ids.includes(merchantId)) ids.push(merchantId);
    setConfigMerchantIds(ids.join(","));
    const saved = await controller.saveConfig({ merchantIds: ids });
    if (saved) setNewMerchantId("");
  }, [configMerchantIds, controller, newMerchantId, writeLog]);

  const handleRemoveMerchant = useCallback(
    async (merchantId: number) => {
      if (!window.confirm(`¿Eliminar el merchant ${merchantId}?`)) return;
      const configured = parseMerchantIds(configMerchantIds);
      const loaded = controller.productState?.merchants.map((merchant) => merchant.merchantId) ?? [];
      const source = Array.from(new Set([...loaded, ...configured]));
      const nextIds = source.filter((id) => id !== merchantId);
      setConfigMerchantIds(nextIds.join(","));
      await controller.saveConfig({ merchantIds: nextIds });
    },
    [configMerchantIds, controller],
  );

  const toggleMerchant = useCallback(
    async (merchant: MeseroMerchant) => {
      const merchants = controller.productState?.merchants ?? [];
      const enabled = !merchant.enabled;
      const enabledCount = merchants.filter((item) => item.enabled).length;
      if (!enabled && enabledCount <= 1) {
        writeLog(
          "El backend no puede representar cero merchants habilitados; deja al menos uno activo",
          "warning",
        );
        return;
      }
      const merchantUpdates = Object.fromEntries(
        merchants.map((item) => [
          String(item.merchantId),
          { enabled: item.merchantId === merchant.merchantId ? enabled : item.enabled },
        ]),
      );
      await controller.updateProductFilter({
        merchants: merchantUpdates,
      });
    },
    [controller, writeLog],
  );

  const toggleProduct = useCallback(
    async (product: MeseroProduct) => {
      await controller.updateProductFilter({
        products: { [String(product.id)]: { visible: !product.visible } },
      });
    },
    [controller],
  );

  const togglePinnedProduct = useCallback(
    async (product: MeseroProduct) => {
      await controller.updateProductFilter({
        products: { [String(product.id)]: { pinned: !product.pinned } },
      });
    },
    [controller],
  );

  const setFilterMode = useCallback(
    async (filterMode: ProductFilterMode) => {
      await controller.updateProductFilter({ filterMode });
    },
    [controller],
  );

  const paymentDetail = buildPaymentDetail(controller.paymentStatus);
  const lastSale = formatLastSale(controller.paymentStatus.counter.recent[0]?.time);
  const ttsState = tts.ttsStatus === "online"
    ? "online"
    : tts.ttsStatus === "checking"
      ? "checking"
      : tts.ttsStatus === "offline"
        ? "offline"
        : "unknown";

  return (
    <div className="mc-page">
      <div className="mc-shell">
        <header className="mc-header">
          <div className="mc-header-row">
            <div className="mc-brand">
              <span className="mc-brand-icon" aria-hidden="true">🤖</span>
              <div>
                <span className="mc-eyebrow">Control remoto</span>
                <h1>Mesero Robot</h1>
              </div>
            </div>
            <div className="mc-status-group" aria-live="polite">
              <span className="mc-pill" data-state={controller.connectionStatus}>
                <span className="mc-dot" aria-hidden="true" />
                {controller.connectionStatus === "online"
                  ? "Robot online"
                  : controller.connectionStatus === "connecting"
                    ? "Conectando"
                    : "Robot offline"}
              </span>
              <span className="mc-pill" data-state={ttsState}>
                <span className="mc-dot" aria-hidden="true" />
                {tts.ttsStatus === "online"
                  ? "TTS online"
                  : tts.ttsStatus === "checking"
                    ? "Verificando TTS"
                    : tts.ttsStatus === "offline"
                      ? "TTS offline"
                      : "TTS sin verificar"}
              </span>
            </div>
          </div>
          <div className="mc-connection-row">
            <label className="mc-select-wrap">
              <span className="mc-eyebrow">Robot seleccionado</span>
              <select
                className="mc-select"
                value={controller.selectedUrl}
                onChange={(event) => controller.selectUrl(event.target.value)}
                aria-label="Robot seleccionado"
                disabled={controller.connectionStatus === "connecting" || controller.isBusy}
              >
                {MESERO_OPTIONS.map((option) => (
                  <option key={option.id} value={option.url}>
                    {option.label} · {option.url}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="mc-button mc-button--primary"
              type="button"
              onClick={() => void handleConnect()}
              disabled={controller.connectionStatus === "connecting" || controller.isBusy}
            >
              {controller.connectionStatus === "connecting" ? "Conectando…" : "Conectar"}
            </button>
          </div>
        </header>

        {audio.activeAudioLabel ? (
          <div className="mc-audio-banner" role="status">
            <span className="mc-audio-pulse" aria-hidden="true" />
            <span aria-hidden="true">🔊</span>
            Reproduciendo: {audio.activeAudioLabel}
          </div>
        ) : null}

        <main className="mc-main">
          <div className="mc-controls">
            <Section title="Pago QR" icon="💳">
              <div className="mc-payment-grid">
                <div className="mc-status-card" data-phase={controller.paymentStatus.phase}>
                  <div className="mc-status-row">
                    <span className="mc-polling-indicator" aria-hidden="true" />
                    <div className="mc-status-copy">
                      <span className="mc-status-label">{controller.paymentStatus.label}</span>
                      <span className="mc-status-detail">{paymentDetail}</span>
                    </div>
                  </div>
                  <div className="mc-actions-row">
                    <button
                      className="mc-button mc-button--success mc-button--compact"
                      type="button"
                      onClick={() => void controller.startPaymentPolling()}
                    >
                      Iniciar polling
                    </button>
                    <button
                      className="mc-button mc-button--danger mc-button--compact"
                      type="button"
                      onClick={() => void controller.stopPaymentPolling()}
                    >
                      Detener polling
                    </button>
                  </div>
                </div>
                <div className="mc-sales-card">
                  <div className="mc-sales-row">
                    <span aria-hidden="true">🛒</span>
                    <strong className="mc-sales-number">
                      {controller.paymentStatus.counter.totalSales}
                    </strong>
                    <span className="mc-sales-label">ventas</span>
                    <span className="mc-sales-amount">
                      {formatMoney(controller.paymentStatus.counter.totalAmount)}
                    </span>
                  </div>
                  {controller.paymentStatus.counter.byProduct.length > 0 ? (
                    <div className="mc-sales-products">
                      {controller.paymentStatus.counter.byProduct.map((product, index) => (
                        <span className="mc-chip" key={`${product.name}-${index}`}>
                          {product.name} ×{product.count}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {lastSale ? <div className="mc-last-sale">Última: {lastSale}</div> : null}
                </div>
              </div>
            </Section>

            <Section title="Expresiones" icon="✨">
              <div className="mc-action-grid">
                {EMOTIONS.map((emotion) => (
                  <button
                    className="mc-action"
                    key={emotion.id}
                    type="button"
                    onClick={() => void controller.sendCommand("/attract/set", { gif: emotion.id })}
                  >
                    <span className="mc-action-icon" aria-hidden="true">{emotion.icon}</span>
                    <span className="mc-action-label">{emotion.label}</span>
                    <span className="mc-action-detail">{emotion.description}</span>
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Pantalla" icon="🖥️">
              <div className="mc-action-grid">
                <button
                  className="mc-action mc-action--primary"
                  type="button"
                  onClick={() => void playAudioAction({
                    id: "greet",
                    label: "Café e imagen",
                    description: "Producto y saludo",
                    icon: "🗣️",
                    localFile: "question_coffe.wav",
                    endpoint: "/greet",
                  })}
                >
                  <span className="mc-action-icon" aria-hidden="true">🗣️</span>
                  <span className="mc-action-label">Café e imagen</span>
                  <span className="mc-action-detail">Producto y saludo</span>
                </button>
                <button
                  className="mc-action"
                  type="button"
                  onClick={() => void controller.sendCommand("/product")}
                >
                  <span className="mc-action-icon" aria-hidden="true">🖼️</span>
                  <span className="mc-action-label">Solo producto</span>
                  <span className="mc-action-detail">Mostrar sin audio</span>
                </button>
                <button
                  className="mc-action"
                  type="button"
                  onClick={() => void playAudioAction({
                    id: "pay-button",
                    label: "Indicar botón de pago",
                    description: "Continuar con QR",
                    icon: "💳",
                    localFile: "select_button_to_pay.wav",
                    remoteAsset: "audio/select_button_to_pay.wav",
                    displayText: "Presiona el botón Pagar pedido con QR para continuar",
                  })}
                >
                  <span className="mc-action-icon" aria-hidden="true">💳</span>
                  <span className="mc-action-label">Indicar botón de pago</span>
                  <span className="mc-action-detail">Continuar con QR</span>
                </button>
              </div>
            </Section>

            <Section title="Saludos e interacciones" icon="👋">
              <ActionGrid actions={GREETING_AUDIO} onAction={(action) => void playAudioAction(action)} />
            </Section>

            <Section title="Alertas y sonidos" icon="🚨">
              <div className="mc-form-grid mc-form-grid--three">
                <label className="mc-field">
                  <span className="mc-label">Sirena o sonido</span>
                  <select
                    className="mc-select"
                    value={alertFile}
                    onChange={(event) => setAlertFile(event.target.value)}
                  >
                    {ALERT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.icon} {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mc-field">
                  <span className="mc-label">Volumen</span>
                  <input
                    className="mc-input"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={alertVolume}
                    onChange={(event) => setAlertVolume(event.target.value)}
                  />
                </label>
                <button
                  className="mc-button mc-button--primary"
                  type="button"
                  onClick={() => void handleAlert()}
                >
                  Reproducir
                </button>
              </div>
              <div style={{ marginTop: 9 }}>
                <ActionGrid actions={ALERT_AUDIO} onAction={(action) => void playAudioAction(action)} />
              </div>
            </Section>

            <Section
              title="Audios generales"
              icon="🔊"
              actions={(
                <button
                  className="mc-button mc-button--danger mc-button--compact"
                  type="button"
                  onClick={() => void handleStopAudio()}
                >
                  Detener todo
                </button>
              )}
            >
              <ActionGrid actions={generalAudio} onAction={(action) => void playAudioAction(action)} />
              <div className="mc-form-grid mc-form-grid--three" style={{ marginTop: 10 }}>
                <label className="mc-field">
                  <span className="mc-label">Asset personalizado</span>
                  <input
                    className="mc-input"
                    type="text"
                    placeholder="audio/archivo.wav"
                    value={customAsset}
                    onChange={(event) => setCustomAsset(event.target.value)}
                  />
                </label>
                <label className="mc-field">
                  <span className="mc-label">Volumen</span>
                  <input
                    className="mc-input"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={customVolume}
                    onChange={(event) => setCustomVolume(event.target.value)}
                  />
                </label>
                <label className="mc-check">
                  <input
                    type="checkbox"
                    checked={customForce}
                    onChange={(event) => setCustomForce(event.target.checked)}
                  />
                  Forzar
                </label>
                <label className="mc-field mc-field--wide">
                  <span className="mc-label">Texto en pantalla (opcional)</span>
                  <input
                    className="mc-input"
                    type="text"
                    value={customDisplayText}
                    onChange={(event) => setCustomDisplayText(event.target.value)}
                  />
                </label>
              </div>
              <div className="mc-actions-row">
                <button
                  className="mc-button mc-button--primary"
                  type="button"
                  onClick={() => void handleCustomAudio()}
                >
                  Reproducir personalizado
                </button>
              </div>
            </Section>

            <Section title="Audios Kíky" icon="🍰">
              <ActionGrid actions={KIKY_AUDIO} onAction={(action) => void playAudioAction(action)} />
            </Section>

            <Section
              title="Merchants y productos"
              icon="🏪"
              actions={(
                <button
                  className="mc-button mc-button--compact"
                  type="button"
                  onClick={() => void controller.reloadProducts()}
                  disabled={controller.isBusy}
                >
                  Recargar
                </button>
              )}
            >
              <div className="mc-products-toolbar">
                <div className="mc-filter-row" aria-label="Modo de filtro">
                  {(["all", "blacklist", "whitelist"] as const).map((mode) => (
                    <button
                      className="mc-mode-button"
                      key={mode}
                      type="button"
                      aria-pressed={controller.productState?.filterMode === mode}
                      onClick={() => void setFilterMode(mode)}
                      disabled={!controller.productState || controller.isBusy}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <span className="mc-product-summary">
                  {controller.productState
                    ? `${controller.productState.visibleProducts}/${controller.productState.totalProducts} visibles`
                    : "Sin productos cargados"}
                </span>
              </div>
              {controller.productState && controller.productState.filterMode !== "blacklist" ? (
                <p className="mc-helper" style={{ margin: "0 0 9px" }}>
                  La visibilidad individual se aplica en modo blacklist; en whitelist usa el pin.
                </p>
              ) : null}

              <div className="mc-inline" style={{ marginBottom: 9 }}>
                <input
                  className="mc-input"
                  type="number"
                  min="1"
                  placeholder="Nuevo merchant ID"
                  value={newMerchantId}
                  onChange={(event) => setNewMerchantId(event.target.value)}
                />
                <button
                  className="mc-button mc-button--compact"
                  type="button"
                  onClick={() => void handleAddMerchant()}
                  disabled={controller.isBusy}
                >
                  Agregar
                </button>
              </div>

              {controller.productState?.merchants.length ? (
                <div className="mc-merchant-list">
                  {controller.productState.merchants.map((merchant) => (
                    <article
                      className="mc-merchant"
                      data-enabled={String(merchant.enabled)}
                      key={merchant.merchantId}
                    >
                      <div className="mc-merchant-heading">
                        <label className="mc-toggle">
                          <input
                            type="checkbox"
                            checked={merchant.enabled}
                            onChange={() => void toggleMerchant(merchant)}
                            disabled={controller.isBusy}
                          />
                          Activo
                        </label>
                        <span className="mc-merchant-name">
                          [{merchant.merchantId}] {merchant.merchantName}
                        </span>
                        <span className="mc-merchant-meta">
                          {merchant.visibleCount}/{merchant.productCount}
                        </span>
                        <button
                          className="mc-icon-button mc-icon-button--danger"
                          type="button"
                          title="Eliminar merchant"
                          aria-label={`Eliminar merchant ${merchant.merchantId}`}
                          onClick={() => void handleRemoveMerchant(merchant.merchantId)}
                          disabled={controller.isBusy}
                        >
                          ×
                        </button>
                      </div>
                      <div className="mc-product-list">
                        {merchant.products.length ? merchant.products.map((product) => (
                          <div
                            className="mc-product-row"
                            data-visible={String(product.visible)}
                            key={product.id}
                          >
                            <label
                              className="mc-toggle"
                              title={controller.productState?.filterMode === "blacklist"
                                ? "Mostrar u ocultar producto"
                                : "Disponible únicamente en modo blacklist"}
                            >
                              <input
                                type="checkbox"
                                checked={product.visible}
                                onChange={() => void toggleProduct(product)}
                                disabled={
                                  controller.isBusy ||
                                  controller.productState?.filterMode !== "blacklist"
                                }
                              />
                              Visible
                            </label>
                            <span className="mc-product-name">
                              {product.name} · ID {product.id}
                            </span>
                            <span className="mc-product-price">{formatMoney(product.price)}</span>
                            <button
                              className="mc-icon-button"
                              type="button"
                              title={product.pinned ? "Desfijar producto" : "Fijar producto"}
                              aria-label={product.pinned ? "Desfijar producto" : "Fijar producto"}
                              aria-pressed={product.pinned}
                              onClick={() => void togglePinnedProduct(product)}
                              disabled={controller.isBusy}
                            >
                              📌
                            </button>
                          </div>
                        )) : <div className="mc-empty">Este merchant no tiene productos.</div>}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mc-empty">Conecta el robot para cargar merchants y productos.</div>
              )}
            </Section>
          </div>

          <aside className="mc-sidebar">
            <Section title="Texto a voz" icon="🗣️">
              <label className="mc-field">
                <span className="mc-label">Texto</span>
                <textarea
                  className="mc-textarea"
                  rows={4}
                  placeholder="Escribe lo que debe decir el robot…"
                  value={ttsText}
                  onChange={(event) => setTtsText(event.target.value)}
                />
              </label>
              <label className="mc-field" style={{ marginTop: 8 }}>
                <span className="mc-label">Token TTS</span>
                <input
                  className="mc-input"
                  type="password"
                  autoComplete="off"
                  placeholder="VITE_MESERO_TTS_TOKEN o token temporal"
                  value={ttsToken}
                  onChange={handleTtsTokenChange}
                />
                <span className="mc-helper">Solo se conserva durante esta sesión.</span>
              </label>
              <div className="mc-actions-row">
                <button
                  className="mc-button mc-button--compact"
                  type="button"
                  onClick={() => void tts.checkTtsService(controller.selectedUrl)}
                  disabled={tts.ttsStatus === "checking"}
                >
                  Verificar
                </button>
                <button
                  className="mc-button mc-button--primary"
                  type="button"
                  onClick={() => void handleSpeak()}
                  disabled={tts.ttsStatus !== "online" || tts.isSpeaking || !ttsText.trim() || !ttsToken.trim()}
                >
                  {tts.isSpeaking ? "Reproduciendo…" : "Hablar"}
                </button>
              </div>
            </Section>

            <Section title="Configuración remota" icon="⚙️">
              <form onSubmit={(event) => void handleSaveConfig(event)}>
                <div className="mc-form-grid">
                  <label className="mc-field mc-field--wide">
                    <span className="mc-label">Base URL del API comercial</span>
                    <input
                      className="mc-input"
                      type="url"
                      value={configBaseUrl}
                      onChange={(event) => setConfigBaseUrl(event.target.value)}
                    />
                  </label>
                  <label className="mc-field mc-field--wide">
                    <span className="mc-label">Bearer token</span>
                    <input
                      className="mc-input"
                      type="password"
                      autoComplete="off"
                      value={configBearerToken}
                      onChange={(event) => setConfigBearerToken(event.target.value)}
                    />
                  </label>
                  <label className="mc-field">
                    <span className="mc-label">Merchant IDs</span>
                    <input
                      className="mc-input"
                      type="text"
                      placeholder="1,53,55"
                      value={configMerchantIds}
                      onChange={(event) => setConfigMerchantIds(event.target.value)}
                    />
                  </label>
                  <label className="mc-field">
                    <span className="mc-label">Product ID</span>
                    <input
                      className="mc-input"
                      type="number"
                      min="1"
                      value={configProductId}
                      onChange={(event) => setConfigProductId(event.target.value)}
                    />
                  </label>
                </div>
                <div className="mc-actions-row">
                  <button
                    className="mc-button mc-button--primary"
                    type="submit"
                    disabled={controller.isBusy}
                  >
                    Guardar configuración
                  </button>
                </div>
              </form>
            </Section>

            <div className="mc-console">
              <div className="mc-console-header">
                <span className="mc-section-title">Consola</span>
                <button
                  className="mc-button mc-button--compact"
                  type="button"
                  onClick={() => setLogs([])}
                  disabled={logs.length === 0}
                >
                  Limpiar
                </button>
              </div>
              <div className="mc-log-list" ref={logListRef} aria-live="polite">
                {logs.length ? logs.map((entry) => (
                  <div className="mc-log-entry" data-level={entry.level} key={entry.id}>
                    <span className="mc-log-time">[{entry.time}]</span>
                    <span>{entry.message}</span>
                  </div>
                )) : <div className="mc-empty">Sin eventos todavía.</div>}
              </div>
            </div>
          </aside>
        </main>
      </div>

      {controller.isBusy ? (
        <div className="mc-busy-overlay" role="status">
          <span className="mc-spinner" aria-hidden="true" />
          Procesando comando…
        </div>
      ) : null}
    </div>
  );
}

export default MeseroControlPage;
