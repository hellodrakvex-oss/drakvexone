export type Language = "en" | "ta";

export type AppSettings = {
  ownerName: string;
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  businessType: string;
  gstNumber: string;
  language: Language;
  pushNotifications: boolean;
  dueReminders: boolean;
  dailySummary: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  ownerName: "",
  shopName: "",
  shopPhone: "",
  shopAddress: "",
  businessType: "retail",
  gstNumber: "",
  language: "en",
  pushNotifications: false,
  dueReminders: true,
  dailySummary: true,
};
