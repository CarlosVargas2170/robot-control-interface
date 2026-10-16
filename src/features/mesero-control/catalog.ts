export interface EmotionAction {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export interface AudioAction {
  id: string;
  label: string;
  description?: string;
  icon: string;
  localFile: string;
  endpoint?: string;
  remoteAsset?: string;
  displayText?: string;
}

export interface AlertOption {
  value: string;
  label: string;
  icon: string;
}

export const EMOTIONS: readonly EmotionAction[] = [
  { id: "normal", label: "Normal", description: "Cara normal", icon: "🙂" },
  { id: "happy", label: "Feliz", description: "Cara feliz", icon: "😊" },
  { id: "angry", label: "Enojado", description: "Cara enojada", icon: "😠" },
  { id: "cry", label: "Llorando", description: "Cara llorando", icon: "😢" },
  { id: "love", label: "Amor", description: "Cara de amor", icon: "😍" },
  { id: "money", label: "Dinero", description: "Cara de dinero", icon: "🤑" },
  { id: "sad", label: "Triste", description: "Cara triste", icon: "😔" },
  { id: "sleep", label: "Dormido", description: "Cara dormida", icon: "😴" },
  { id: "confused", label: "Confundido", description: "Cara confundida", icon: "😕" },
  { id: "six-seven", label: "Six Seven", description: "Animación 6-7", icon: "6-7" },
] as const;

export const GREETING_AUDIO: readonly AudioAction[] = [
  {
    id: "hello",
    label: "¿Hola, qué tal?",
    icon: "👋",
    localFile: "hello.wav",
    remoteAsset: "audio/hello.wav",
    displayText: "Hola. ¿Qué tal?",
  },
  {
    id: "introduce",
    label: "Presentarme",
    description: "¿Tú cómo te llamas?",
    icon: "🤖",
    localFile: "hello_and_question_name.wav",
    remoteAsset: "audio/hello_and_question_name.wav",
    displayText: "Hola, me llamo Robot Mesero. ¿Tú cómo te llamas?",
  },
  {
    id: "switch-product",
    label: "Cambiar producto",
    description: "Explicar el deslizamiento",
    icon: "↔️",
    localFile: "switch_product.wav",
    remoteAsset: "audio/switch_product.wav",
    displayText: "Desliza a la derecha o izquierda para cambiar de producto",
  },
] as const;

export const ALERT_AUDIO: readonly AudioAction[] = [
  {
    id: "attention",
    label: "Atención, con permiso",
    icon: "⚠️",
    localFile: "attention_excuse_me.wav",
    endpoint: "/play-attention",
  },
  {
    id: "in-service",
    label: "Robot en servicio",
    description: "Con permiso, por favor",
    icon: "🚦",
    localFile: "attention_with_service.wav",
    remoteAsset: "audio/attention_with_service.wav",
    displayText: "¡Con permiso por favor! Robot Mesero en servicio",
  },
  {
    id: "return-product",
    label: "Devolver producto",
    description: "Devolver a la bandeja",
    icon: "↩️",
    localFile: "please_return_prod.wav",
    remoteAsset: "audio/please_return_prod.wav",
    displayText: "Por favor, devuelve el producto a la bandeja",
  },
] as const;

export const GENERAL_AUDIO: readonly AudioAction[] = [
  {
    id: "question",
    label: "¿Deseas un café?",
    icon: "❓",
    localFile: "question_coffe.wav",
    endpoint: "/play-question",
  },
  {
    id: "thanks-shopping",
    label: "Gracias por tu compra",
    icon: "🙏",
    localFile: "thanks_shopping.wav",
    endpoint: "/play-thanks",
  },
  {
    id: "buy",
    label: "Invitación a comprar",
    icon: "🛒",
    localFile: "purchase_buy.wav",
    endpoint: "/play-buy",
  },
  {
    id: "order",
    label: "Revisar pedido",
    description: "Robot Mesero",
    icon: "🔔",
    localFile: "there_is_an_order.wav",
    endpoint: "/play-order",
  },
  {
    id: "order-mesero-2",
    label: "Revisar pedido",
    description: "Robot Mesero 2",
    icon: "🔔",
    localFile: "there_is_an_order_2.mp3",
    remoteAsset: "audio/there_is_an_order_2.mp3",
    displayText: "Tengo un pedido. ¿Puedes revisar los de Robot Mesero 2?",
  },
  {
    id: "collect-tray",
    label: "Recoger bandeja",
    icon: "🍽️",
    localFile: "collect_tray.wav",
    endpoint: "/play-collect-tray",
  },
  {
    id: "coffee-ready",
    label: "Aquí tienes tu café",
    icon: "☕",
    localFile: "here_is_coffee.wav",
    endpoint: "/play-coffee",
  },
  {
    id: "thanks",
    label: "Muchas gracias",
    icon: "🙌",
    localFile: "Muchas graacias.wav",
    remoteAsset: "audio/Muchas_graacias.wav",
    displayText: "Muchas gracias",
  },
  {
    id: "dance",
    label: "Baile por compra",
    icon: "💃",
    localFile: "dance_to_sell.wav",
    remoteAsset: "audio/dance_to_sell.wav",
    displayText: "Si me compras un café, te hago un baile",
  },
] as const;

export const KIKY_AUDIO: readonly AudioAction[] = [
  {
    id: "kiky-enjoy",
    label: "Aquí tienes",
    description: "¡Que lo disfrutes!",
    icon: "🎂",
    localFile: "Aqui_tienes_Que_lo_d.wav",
    remoteAsset: "audio/Aqui_tienes_Que_lo_d.wav",
    displayText: "Aquí tienes. ¡Que lo disfrutes!",
  },
  {
    id: "kiky-brownie",
    label: "¿Brownie?",
    description: "Brownie de Kíky",
    icon: "🍫",
    localFile: "Hola_deseas_un_Brown.wav",
    remoteAsset: "audio/Hola_deseas_un_Brown.wav",
    displayText: "Hola, ¿deseas un Brownie de Kíky?",
  },
  {
    id: "kiky-three-milks",
    label: "¿Tres leches?",
    description: "Cremoso de Kíky",
    icon: "🍰",
    localFile: "Hola_deseas_un_Cremo.wav",
    remoteAsset: "audio/Hola_deseas_un_Cremo.wav",
    displayText: "Hola, ¿deseas un Cremoso Tres Leches de Kíky?",
  },
] as const;

export const ALERT_OPTIONS: readonly AlertOption[] = [
  { value: "alert_siren.mp3", label: "Sirena de alerta", icon: "🚨" },
  { value: "bocina_car.mp3", label: "Bocina de carro", icon: "🚗" },
  { value: "policy_siren.mp3", label: "Sirena de policía", icon: "🚓" },
  { value: "six-seven.wav", label: "Six Seven", icon: "🎸" },
] as const;
