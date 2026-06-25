"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface BankDetails {
  bankName: string;
  accountNo: string;
  ifscCode: string;
  accountHolderName: string;
}

interface BusinessProfile {
  legalName: string;
  tradeName: string;
  gstin: string;
  address: string;
  state: string;
  stateCode: string;
  city: string;
  pinCode: string;
  logoUrl: string;
}

interface InvoicePreferences {
  defaultGstRate: number;
  reminderDays: number;
}

type TabType = "bank" | "profile" | "preferences";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("bank");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // States
  const [bank, setBank] = useState<BankDetails>({
    bankName: "",
    accountNo: "",
    ifscCode: "",
    accountHolderName: "",
  });

  const [profile, setProfile] = useState<BusinessProfile>({
    legalName: "",
    tradeName: "",
    gstin: "",
    address: "",
    state: "",
    stateCode: "",
    city: "",
    pinCode: "",
    logoUrl: "",
  });

  const [preferences, setPreferences] = useState<InvoicePreferences>({
    defaultGstRate: 18,
    reminderDays: 7,
  });

  // Fetch data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/business/profile");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.status === 404) {
          router.push("/setup");
          return;
        }

        const data = await res.json();
        if (data.business) {
          const b = data.business;
          setProfile({
            legalName: b.legalName ?? "",
            tradeName: b.tradeName ?? b.trade_name ?? "",
            gstin: b.gstin ?? "",
            address: b.address ?? "",
            state: b.state ?? "",
            stateCode: b.stateCode ?? b.StateCode ?? "",
            city: b.city ?? "",
            pinCode: b.pinCode ?? "",
            logoUrl: b.logoUrl ?? "",
          });

          if (b.settings) {
            setBank({
              bankName: b.settings.bankName ?? "",
              accountNo: b.settings.accountNo ?? "",
              ifscCode: b.settings.ifscCode ?? "",
              accountHolderName: b.settings.accountHolderName ?? "",
            });

            setPreferences({
              defaultGstRate: b.settings.defaultGstRate ?? 18,
              reminderDays: b.settings.reminderDays ?? 7,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
        setMessage({ type: "error", text: "Failed to load settings data." });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  // Handle updates
  async function handleSaveBank(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/business/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bank,
          defaultGstRate: Number(preferences.defaultGstRate),
          reminderDays: Number(preferences.reminderDays),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update bank details");

      setMessage({ type: "success", text: "Bank details updated successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Something went wrong" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/business/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update business profile");

      setMessage({ type: "success", text: "Business profile updated successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Something went wrong" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePreferences(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/business/remainder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultGstRate: Number(preferences.defaultGstRate),
          reminderDays: Number(preferences.reminderDays),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update preferences");

      setMessage({ type: "success", text: "Invoice preferences updated successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Something went wrong" });
    } finally {
      setSaving(false);
    }
  }

  // Format account number for card display
  const formatCardNumber = (num: string) => {
    if (!num) return "•••• •••• •••• ••••";
    const cleaned = num.replace(/\s+/g, "");
    const chunks = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      chunks.push(cleaned.substring(i, i + 4));
    }
    return chunks.join(" ");
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 animate-pulse text-sm">Loading your preferences...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full pt-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your business details, bank details, and app preferences.
        </p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-sm mb-6 transition-all animate-[slideIn_0.2s_ease-out] ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
          }`}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {message.type === "success" ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          <p className="font-medium">{message.text}</p>
          <button onClick={() => setMessage(null)} className="ml-auto hover:opacity-75">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation / Tabs */}
        <div className="space-y-2">
          {[
            { id: "bank", label: "Bank Account", desc: "Settlements & payouts details", icon: "🏦" },
            { id: "profile", label: "Business Profile", desc: "Tax details & address", icon: "🏢" },
            { id: "preferences", label: "Preferences", desc: "Invoicing options & GST", icon: "⚙️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as TabType);
                setMessage(null);
              }}
              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                activeTab === tab.id
                  ? "bg-white dark:bg-gray-800 border-[var(--accent)] shadow-sm ring-1 ring-[var(--accent)]"
                  : "bg-white/50 dark:bg-gray-900/50 border-[var(--border)] hover:bg-white hover:shadow-sm"
              }`}
            >
              <span className="text-2xl">{tab.icon}</span>
              <div>
                <h3 className="font-semibold text-sm text-[var(--foreground)]">{tab.label}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{tab.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Form Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "bank" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Virtual Bank Card preview */}
              <div className="flex flex-col justify-center">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4 px-1">
                  Card Preview
                </h3>
                <div className="relative aspect-[1.58/1] w-full max-w-[360px] rounded-3xl p-6 text-white shadow-2xl overflow-hidden bg-gradient-to-tr from-indigo-700 via-purple-600 to-indigo-900 border border-white/10 flex flex-col justify-between">
                  {/* Glowing background shapes */}
                  <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-pink-500/20 blur-2xl" />
                  <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-blue-500/20 blur-2xl" />

                  {/* Card Top */}
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-xs opacity-60 font-medium tracking-wide uppercase">Primary Bank Account</p>
                      <h4 className="text-lg font-bold tracking-tight mt-0.5 min-h-[28px] truncate">
                        {bank.bankName || "Your Bank Name"}
                      </h4>
                    </div>
                    {/* Chip Graphic */}
                    <div className="w-11 h-9 rounded-lg bg-yellow-400/80 backdrop-blur-sm border border-yellow-300/30 relative flex flex-col justify-center p-1.5 gap-1 overflow-hidden shadow-inner">
                      <div className="w-full h-px bg-yellow-600/30" />
                      <div className="w-full h-px bg-yellow-600/30" />
                      <div className="w-full h-px bg-yellow-600/30" />
                      <div className="absolute left-1/3 top-0 bottom-0 w-px bg-yellow-600/30" />
                      <div className="absolute right-1/3 top-0 bottom-0 w-px bg-yellow-600/30" />
                    </div>
                  </div>

                  {/* Card Middle (Account Number) */}
                  <div className="relative z-10 my-4">
                    <p className="text-xs opacity-40 font-mono tracking-wider">ACCOUNT NUMBER</p>
                    <p className="text-xl font-mono tracking-widest font-bold mt-1">
                      {formatCardNumber(bank.accountNo)}
                    </p>
                  </div>

                  {/* Card Bottom */}
                  <div className="flex justify-between items-end relative z-10">
                    <div className="max-w-[70%]">
                      <p className="text-[10px] opacity-40 uppercase tracking-wider">Account Holder</p>
                      <p className="text-sm font-semibold tracking-wide truncate mt-0.5 min-h-[20px]">
                        {bank.accountHolderName || "HOLDER NAME"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] opacity-40 uppercase tracking-wider text-right">IFSC Code</p>
                      <p className="text-sm font-mono font-bold tracking-wider mt-0.5 min-h-[20px] text-right">
                        {bank.ifscCode || "IFSC0000000"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank details form */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-[var(--border)] shadow-sm">
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">Bank Details</h3>
                <form onSubmit={handleSaveBank} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      required
                      value={bank.bankName}
                      onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
                      placeholder="e.g. HDFC Bank, ICICI Bank"
                      className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      required
                      value={bank.accountHolderName}
                      onChange={(e) => setBank({ ...bank, accountHolderName: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      required
                      value={bank.accountNo}
                      onChange={(e) => setBank({ ...bank, accountNo: e.target.value.replace(/[^0-9]/g, "") })}
                      placeholder="Digits only"
                      className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      required
                      value={bank.ifscCode}
                      onChange={(e) => setBank({ ...bank, ifscCode: e.target.value.toUpperCase() })}
                      placeholder="e.g. HDFC0001234"
                      maxLength={11}
                      className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-xl transition-all shadow-md disabled:opacity-50 mt-2"
                  >
                    {saving ? "Saving..." : "Update Bank Details"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-[var(--border)] shadow-sm">
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-6">Business Profile Details</h3>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
                      Legal Business Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profile.legalName}
                      onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
                      Trade Name / Brand Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profile.tradeName}
                      onChange={(e) => setProfile({ ...profile, tradeName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
                      Address
                    </label>
                    <input
                      type="text"
                      required
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={profile.city}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      value={profile.pinCode}
                      onChange={(e) => setProfile({ ...profile, pinCode: e.target.value })}
                      className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
                      State
                    </label>
                    <input
                      type="text"
                      required
                      value={profile.state}
                      onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                      className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
                      State Code
                    </label>
                    <input
                      type="text"
                      required
                      value={profile.stateCode}
                      onChange={(e) => setProfile({ ...profile, stateCode: e.target.value })}
                      className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      required
                      value={profile.gstin}
                      onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-mono"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
                      Logo URL
                    </label>
                    <input
                      type="text"
                      value={profile.logoUrl}
                      onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Update Business Profile"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-[var(--border)] shadow-sm">
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-6">Invoicing Preferences</h3>
              <form onSubmit={handleSavePreferences} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
                    Default GST Rate (%)
                  </label>
                  <input
                    type="number"
                    required
                    value={preferences.defaultGstRate}
                    onChange={(e) => setPreferences({ ...preferences, defaultGstRate: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-1">
                    Invoice Overdue Reminder Days
                  </label>
                  <input
                    type="number"
                    required
                    value={preferences.reminderDays}
                    onChange={(e) => setPreferences({ ...preferences, reminderDays: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1 px-1">
                    Number of days after the due date to send an automated payment reminder.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold rounded-xl transition-all shadow-md disabled:opacity-50 mt-2"
                >
                  {saving ? "Saving..." : "Update Preferences"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
