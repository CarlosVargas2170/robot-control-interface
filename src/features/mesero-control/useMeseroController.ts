import { useCallback, useEffect, useRef, useState } from "react";
import { meseroRequest } from "./api";
import {
  EMPTY_PAYMENT_STATUS,
  MESERO_OPTIONS,
  MESERO_URL_STORAGE_KEY,
  PAYMENT_POLL_INTERVAL_MS,
} from "./constants";
import type { MeseroLogLevel } from "./useMeseroAudio";
import type {
  ApiResult,
  MeseroConfig,
  MeseroMerchant,
  MeseroProduct,
  MeseroProductState,
  PaymentPollingStatus,
  ProductFilterMode,
  ProductFilterUpdate,
  RecentSale,
  SaleByProduct,
  SalesCounter,
} from "./types";

export type ConnectionStatus = "offline" | "connecting" | "online";

type LogWriter = (message: string, level?: MeseroLogLevel) => void;

interface ExecuteOptions {
  body?: unknown;
  method?: "GET" | "POST" | "PUT";
  quiet?: boolean;
  trackBusy?: boolean;
  updateConnection?: boolean;
  timeoutMs?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function finiteNumber(value: unknown, fallback = 0): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function optionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const number = finiteNumber(value, Number.NaN);
  return Number.isFinite(number) ? number : undefined;
}

function normalizePositiveIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) => Math.trunc(finiteNumber(item, Number.NaN)))
        .filter((item) => Number.isFinite(item) && item > 0),
    ),
  );
}

function unwrapData(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {};
  if (isRecord(value.data)) return value.data;
  return value;
}

function normalizeConfig(value: unknown): MeseroConfig {
  const source = unwrapData(value);
  return {
    baseUrl: typeof source.baseUrl === "string" ? source.baseUrl : undefined,
    bearerToken: typeof source.bearerToken === "string" ? source.bearerToken : undefined,
    merchantIds: normalizePositiveIds(source.merchantIds),
    productId: optionalNumber(source.productId),
  };
}

function normalizeProduct(value: unknown): MeseroProduct | null {
  if (!isRecord(value)) return null;
  const id = optionalNumber(value.id);
  if (id === undefined) return null;
  return {
    id,
    name: typeof value.name === "string" && value.name.trim() ? value.name : `Producto ${id}`,
    price: finiteNumber(value.price),
    visible: value.visible !== false,
    pinned: value.pinned === true,
  };
}

function normalizeMerchant(value: unknown): MeseroMerchant | null {
  if (!isRecord(value)) return null;
  const merchantId = optionalNumber(value.merchantId);
  if (merchantId === undefined) return null;
  const products = Array.isArray(value.products)
    ? value.products.map(normalizeProduct).filter((item): item is MeseroProduct => item !== null)
    : [];
  return {
    merchantId,
    merchantName:
      typeof value.merchantName === "string" && value.merchantName.trim()
        ? value.merchantName
        : `Merchant ${merchantId}`,
    enabled: value.enabled !== false,
    visibleCount: finiteNumber(
      value.visibleCount,
      products.filter((product) => product.visible).length,
    ),
    productCount: finiteNumber(value.productCount, products.length),
    products,
  };
}

function normalizeFilterMode(value: unknown): ProductFilterMode {
  return value === "blacklist" || value === "whitelist" ? value : "all";
}

function normalizeProductState(value: unknown): MeseroProductState | null {
  if (!isRecord(value)) return null;
  if (value.cacheLoaded === false) return null;
  const source = isRecord(value.data) ? value.data : value;
  const merchants = Array.isArray(source.merchants)
    ? source.merchants
        .map(normalizeMerchant)
        .filter((item): item is MeseroMerchant => item !== null)
    : [];
  const allProducts = merchants.flatMap((merchant) => merchant.products);
  return {
    filterMode: normalizeFilterMode(source.filterMode),
    totalProducts: finiteNumber(source.totalProducts, allProducts.length),
    visibleProducts: finiteNumber(
      source.visibleProducts,
      allProducts.filter((product) => product.visible).length,
    ),
    merchants,
  };
}

function normalizeSalesCounter(value: unknown): SalesCounter {
  const source = isRecord(value) ? value : {};
  const byProduct: SaleByProduct[] = Array.isArray(source.byProduct)
    ? source.byProduct.flatMap((item): SaleByProduct[] => {
        if (!isRecord(item)) return [];
        const name = typeof item.name === "string" ? item.name : "Producto";
        return [{ name, count: finiteNumber(item.count) }];
      })
    : [];
  const recent: RecentSale[] = Array.isArray(source.recent)
    ? source.recent.flatMap((item): RecentSale[] => {
        if (!isRecord(item) || typeof item.time !== "string") return [];
        return [{ time: item.time }];
      })
    : [];
  return {
    totalSales: finiteNumber(source.totalSales),
    totalAmount: finiteNumber(source.totalAmount),
    byProduct,
    recent,
  };
}

function normalizePollingStatus(value: unknown): PaymentPollingStatus {
  const source = unwrapData(value);
  const isPolling = source.isPolling === true;
  return {
    phase:
      typeof source.phase === "string" ? source.phase : isPolling ? "polling" : "idle",
    isPolling,
    label:
      typeof source.label === "string"
        ? source.label
        : isPolling
          ? "Polling activo"
          : "Polling detenido",
    productName: typeof source.productName === "string" ? source.productName : undefined,
    productId: optionalNumber(source.productId),
    merchantId: optionalNumber(source.merchantId),
    orderId: optionalNumber(source.orderId),
    amount: optionalNumber(source.amount),
    counter: normalizeSalesCounter(source.counter),
  };
}

function getInitialUrl(): string {
  try {
    const saved = window.localStorage.getItem(MESERO_URL_STORAGE_KEY);
    if (saved && MESERO_OPTIONS.some((option) => option.url === saved)) return saved;
  } catch {
    // localStorage puede estar deshabilitado; se conserva el valor por defecto.
  }
  return MESERO_OPTIONS[0]?.url ?? "http://localhost:5050";
}

export function useMeseroController(writeLog: LogWriter) {
  const writeLogRef = useRef(writeLog);
  const mountedRef = useRef(true);
  const requestControllersRef = useRef(new Set<AbortController>());
  const pollingControllerRef = useRef<AbortController | null>(null);
  const delayResolversRef = useRef(new Map<number, (completed: boolean) => void>());
  const connectionAttemptRef = useRef(0);
  const [selectedUrl, setSelectedUrl] = useState(getInitialUrl);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("offline");
  const [configuration, setConfiguration] = useState<MeseroConfig | null>(null);
  const [productState, setProductState] = useState<MeseroProductState | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentPollingStatus>(EMPTY_PAYMENT_STATUS);
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const [busyCount, setBusyCount] = useState(0);

  useEffect(() => {
    writeLogRef.current = writeLog;
  }, [writeLog]);

  const abortRequests = useCallback(() => {
    for (const controller of requestControllersRef.current) controller.abort();
    requestControllersRef.current.clear();
    pollingControllerRef.current?.abort();
    pollingControllerRef.current = null;
    for (const [timer, resolve] of delayResolversRef.current) {
      window.clearTimeout(timer);
      resolve(false);
    }
    delayResolversRef.current.clear();
  }, []);

  const waitForBackendReload = useCallback((milliseconds: number): Promise<boolean> => {
    if (!mountedRef.current) return Promise.resolve(false);
    return new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        delayResolversRef.current.delete(timer);
        resolve(true);
      }, milliseconds);
      delayResolversRef.current.set(timer, resolve);
    });
  }, []);

  const execute = useCallback(
    async <T,>(path: string, options: ExecuteOptions = {}): Promise<ApiResult<T>> => {
      const controller = new AbortController();
      requestControllersRef.current.add(controller);
      const shouldTrack = options.trackBusy !== false;
      if (shouldTrack && mountedRef.current) setBusyCount((count) => count + 1);
      if (!options.quiet) writeLogRef.current(`${options.method ?? "GET"} ${path}…`, "info");

      try {
        const result = await meseroRequest<T>(selectedUrl, path, {
          method: options.method,
          body: options.body,
          signal: controller.signal,
          timeoutMs: options.timeoutMs,
        });
        if (result.aborted && controller.signal.aborted) return result;

        if (options.updateConnection !== false && mountedRef.current) {
          setConnectionStatus(result.ok ? "online" : "offline");
        }
        if (!options.quiet) {
          if (result.ok) {
            writeLogRef.current(`OK ${result.status ?? ""} · ${path}`, "success");
          } else {
            writeLogRef.current(`${path}: ${result.error ?? "Error"}`, "error");
          }
        }
        return result;
      } finally {
        requestControllersRef.current.delete(controller);
        if (shouldTrack && mountedRef.current) setBusyCount((count) => Math.max(0, count - 1));
      }
    },
    [selectedUrl],
  );

  const loadProducts = useCallback(async (): Promise<boolean> => {
    const result = await execute<unknown>("/products", { quiet: true });
    if (!result.ok) {
      if (!result.aborted) writeLogRef.current(`Productos: ${result.error ?? "No disponibles"}`, "warning");
      return false;
    }
    const normalized = normalizeProductState(result.data);
    if (mountedRef.current) setProductState(normalized);
    if (!normalized) {
      writeLogRef.current("El robot todavía no cargó productos", "warning");
      return false;
    }
    writeLogRef.current(
      `${normalized.visibleProducts}/${normalized.totalProducts} productos visibles`,
      "success",
    );
    return true;
  }, [execute]);

  const loadProductsAfterDelay = useCallback(
    async (milliseconds: number): Promise<boolean> => {
      if (mountedRef.current) setBusyCount((count) => count + 1);
      try {
        const ready = await waitForBackendReload(milliseconds);
        if (!ready) return false;
        return await loadProducts();
      } finally {
        if (mountedRef.current) setBusyCount((count) => Math.max(0, count - 1));
      }
    },
    [loadProducts, waitForBackendReload],
  );

  const connect = useCallback(async (): Promise<boolean> => {
    const attempt = ++connectionAttemptRef.current;
    abortRequests();
    if (mountedRef.current) setConnectionStatus("connecting");
    writeLogRef.current(`Conectando con ${selectedUrl}…`, "info");
    const result = await execute<unknown>("/config", { quiet: true });
    if (!mountedRef.current || attempt !== connectionAttemptRef.current) return false;
    if (!result.ok) {
      if (mountedRef.current) {
        setConnectionStatus("offline");
        setPollingEnabled(false);
      }
      if (!result.aborted) writeLogRef.current(`Sin conexión: ${result.error ?? "Error de red"}`, "error");
      return false;
    }
    const config = normalizeConfig(result.data);
    if (mountedRef.current) {
      setConfiguration(config);
      setConnectionStatus("online");
      setPollingEnabled(true);
    }
    writeLogRef.current("Robot conectado", "success");
    await loadProducts();
    return mountedRef.current && attempt === connectionAttemptRef.current;
  }, [abortRequests, execute, loadProducts, selectedUrl]);

  const selectUrl = useCallback(
    (url: string) => {
      if (!MESERO_OPTIONS.some((option) => option.url === url)) return;
      connectionAttemptRef.current += 1;
      abortRequests();
      setSelectedUrl(url);
      setConnectionStatus("offline");
      setConfiguration(null);
      setProductState(null);
      setPaymentStatus(EMPTY_PAYMENT_STATUS);
      setPollingEnabled(false);
      try {
        window.localStorage.setItem(MESERO_URL_STORAGE_KEY, url);
      } catch {
        writeLogRef.current("No fue posible guardar el robot seleccionado", "warning");
      }
    },
    [abortRequests],
  );

  const sendCommand = useCallback(
    (path: string, body?: unknown): Promise<ApiResult<unknown>> =>
      execute<unknown>(path, { method: "POST", body }),
    [execute],
  );

  const saveConfig = useCallback(
    async (update: Partial<MeseroConfig>): Promise<boolean> => {
      const body: Record<string, unknown> = {};
      const normalizedUpdate: Partial<MeseroConfig> = {};
      if (typeof update.baseUrl === "string" && update.baseUrl.trim()) {
        normalizedUpdate.baseUrl = update.baseUrl.trim();
        body.baseUrl = normalizedUpdate.baseUrl;
      }
      if (typeof update.bearerToken === "string" && update.bearerToken.trim()) {
        normalizedUpdate.bearerToken = update.bearerToken.trim();
        body.bearerToken = normalizedUpdate.bearerToken;
      }
      if (Array.isArray(update.merchantIds)) {
        normalizedUpdate.merchantIds = normalizePositiveIds(update.merchantIds);
        body.merchantIds = normalizedUpdate.merchantIds;
      }
      if (update.productId !== undefined && Number.isFinite(update.productId)) {
        normalizedUpdate.productId = Math.trunc(update.productId);
        body.productId = normalizedUpdate.productId;
      }
      if (Object.keys(body).length === 0) {
        writeLogRef.current("No hay cambios de configuración válidos", "warning");
        return false;
      }

      const result = await execute<unknown>("/config", { method: "POST", body });
      if (!result.ok) return false;
      const response = isRecord(result.data) ? result.data : {};
      const responseData = isRecord(response.data) ? response.data : response;
      const message = typeof response.message === "string"
        ? response.message
        : typeof responseData.message === "string"
          ? responseData.message
          : null;
      const needsRestart = response.needsRestart === true || responseData.needsRestart === true;
      const needsReload =
        response.needsReload === true ||
        responseData.needsReload === true ||
        normalizedUpdate.merchantIds !== undefined ||
        normalizedUpdate.productId !== undefined;
      if (message) writeLogRef.current(message, needsRestart ? "warning" : "success");
      if (needsRestart && !message) {
        writeLogRef.current("Reinicia la app del robot para aplicar URL o token", "warning");
      }
      if (mountedRef.current) {
        setConfiguration((current) => ({
          merchantIds: [],
          ...(current ?? {}),
          ...normalizedUpdate,
        }));
      }
      if (needsReload) await loadProductsAfterDelay(800);
      return true;
    },
    [execute, loadProductsAfterDelay],
  );

  const updateProductFilter = useCallback(
    async (update: ProductFilterUpdate): Promise<boolean> => {
      const result = await execute<unknown>("/products/filter", {
        method: "POST",
        body: { ...update, reload: update.reload ?? true },
      });
      if (!result.ok) return false;
      return loadProductsAfterDelay(800);
    },
    [execute, loadProductsAfterDelay],
  );

  const reloadProducts = useCallback(async (): Promise<boolean> => {
    const result = await execute<unknown>("/products/reload", { method: "POST" });
    if (!result.ok) return false;
    return loadProductsAfterDelay(1_500);
  }, [execute, loadProductsAfterDelay]);

  const refreshPaymentStatus = useCallback(async (force = false): Promise<void> => {
    if (pollingControllerRef.current) {
      if (!force) return;
      pollingControllerRef.current.abort();
    }
    const controller = new AbortController();
    pollingControllerRef.current = controller;
    const result = await meseroRequest<unknown>(selectedUrl, "/payment/polling-status", {
      signal: controller.signal,
      timeoutMs: 4_500,
    });
    if (pollingControllerRef.current === controller) pollingControllerRef.current = null;
    if (controller.signal.aborted || !mountedRef.current) return;
    if (!result.ok) {
      setPaymentStatus((current) => ({
        ...current,
        phase: "unavailable",
        label: "Estado no disponible",
      }));
      return;
    }
    setPaymentStatus(normalizePollingStatus(result.data));
  }, [selectedUrl]);

  const startPaymentPolling = useCallback(async (): Promise<boolean> => {
    const result = await sendCommand("/payment/start-polling");
    if (result.ok) await refreshPaymentStatus(true);
    return result.ok;
  }, [refreshPaymentStatus, sendCommand]);

  const stopPaymentPolling = useCallback(async (): Promise<boolean> => {
    const result = await sendCommand("/payment/stop-polling");
    if (result.ok) await refreshPaymentStatus(true);
    return result.ok;
  }, [refreshPaymentStatus, sendCommand]);

  useEffect(() => {
    if (!pollingEnabled) return;
    const initialTimer = window.setTimeout(() => void refreshPaymentStatus(), 0);
    const interval = window.setInterval(() => void refreshPaymentStatus(), PAYMENT_POLL_INTERVAL_MS);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
      pollingControllerRef.current?.abort();
      pollingControllerRef.current = null;
    };
  }, [pollingEnabled, refreshPaymentStatus]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      connectionAttemptRef.current += 1;
      abortRequests();
    };
  }, [abortRequests]);

  return {
    selectedUrl,
    selectUrl,
    connectionStatus,
    configuration,
    productState,
    paymentStatus,
    isBusy: busyCount > 0,
    connect,
    sendCommand,
    saveConfig,
    loadProducts,
    updateProductFilter,
    reloadProducts,
    refreshPaymentStatus,
    startPaymentPolling,
    stopPaymentPolling,
  };
}
