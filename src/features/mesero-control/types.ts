export interface MeseroOption {
  id: string;
  label: string;
  url: string;
}

export interface MeseroConfig {
  baseUrl?: string;
  bearerToken?: string;
  merchantIds: number[];
  productId?: number;
}

export interface MeseroProduct {
  id: number;
  name: string;
  price: number;
  visible: boolean;
  pinned: boolean;
}

export interface MeseroMerchant {
  merchantId: number;
  merchantName: string;
  enabled: boolean;
  visibleCount: number;
  productCount: number;
  products: MeseroProduct[];
}

export type ProductFilterMode = "all" | "blacklist" | "whitelist";

export interface MeseroProductState {
  filterMode: ProductFilterMode;
  totalProducts: number;
  visibleProducts: number;
  merchants: MeseroMerchant[];
}

export interface SaleByProduct {
  name: string;
  count: number;
}

export interface RecentSale {
  time: string;
}

export interface SalesCounter {
  totalSales: number;
  totalAmount: number;
  byProduct: SaleByProduct[];
  recent: RecentSale[];
}

export interface PaymentPollingStatus {
  phase: string;
  isPolling: boolean;
  label: string;
  productName?: string;
  productId?: number;
  merchantId?: number;
  orderId?: number;
  amount?: number;
  counter: SalesCounter;
}

export interface ApiResult<T> {
  ok: boolean;
  status?: number;
  data?: T;
  error?: string;
  aborted?: boolean;
}

export interface ProductFilterUpdate {
  filterMode?: ProductFilterMode;
  merchants?: Record<string, { enabled: boolean }>;
  products?: Record<string, { visible?: boolean; pinned?: boolean }>;
  reload?: boolean;
}
