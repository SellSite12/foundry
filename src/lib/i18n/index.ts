export type Locale = "en" | "es" | "fr" | "de" | "ja";

export const DEFAULT_LOCALE: Locale = "en";
export const SUPPORTED_LOCALES: Locale[] = ["en", "es", "fr", "de", "ja"];

type Messages = Record<string, string>;

const catalogs: Record<Locale, Messages> = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.marketplace": "Marketplace",
    "nav.settings": "Settings",
    "auth.login": "Sign in",
    "auth.signup": "Create account",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.loading": "Loading…",
    "common.error": "Something went wrong",
    "checkout.title": "Checkout",
    "orders.title": "Orders",
  },
  es: {
    "nav.dashboard": "Panel",
    "nav.marketplace": "Mercado",
    "nav.settings": "Configuración",
    "auth.login": "Iniciar sesión",
    "auth.signup": "Crear cuenta",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.loading": "Cargando…",
    "common.error": "Algo salió mal",
    "checkout.title": "Pago",
    "orders.title": "Pedidos",
  },
  fr: {
    "nav.dashboard": "Tableau de bord",
    "nav.marketplace": "Marché",
    "nav.settings": "Paramètres",
    "auth.login": "Se connecter",
    "auth.signup": "Créer un compte",
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.loading": "Chargement…",
    "common.error": "Une erreur est survenue",
    "checkout.title": "Paiement",
    "orders.title": "Commandes",
  },
  de: {
    "nav.dashboard": "Dashboard",
    "nav.marketplace": "Marktplatz",
    "nav.settings": "Einstellungen",
    "auth.login": "Anmelden",
    "auth.signup": "Konto erstellen",
    "common.save": "Speichern",
    "common.cancel": "Abbrechen",
    "common.loading": "Laden…",
    "common.error": "Etwas ist schiefgelaufen",
    "checkout.title": "Kasse",
    "orders.title": "Bestellungen",
  },
  ja: {
    "nav.dashboard": "ダッシュボード",
    "nav.marketplace": "マーケットプレイス",
    "nav.settings": "設定",
    "auth.login": "ログイン",
    "auth.signup": "アカウント作成",
    "common.save": "保存",
    "common.cancel": "キャンセル",
    "common.loading": "読み込み中…",
    "common.error": "エラーが発生しました",
    "checkout.title": "チェックアウト",
    "orders.title": "注文",
  },
};

export function t(locale: Locale, key: string): string {
  return catalogs[locale]?.[key] ?? catalogs.en[key] ?? key;
}

export function formatLocalizedDate(
  date: Date | string,
  locale: Locale,
  timeZone?: string
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timeZone ?? "UTC",
  }).format(d);
}

export function formatLocalizedNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function isRtlLocale(_locale: Locale): boolean {
  return false;
}
