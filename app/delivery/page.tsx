"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type DeliveryTab = "insight" | "whatsapp" | "email" | "pdf" | "code";

export default function DeliveryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DeliveryTab>("insight");
  const [highlightGstFields, setHighlightGstFields] = useState(false);

  // Dynamic Data States
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("mock");
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [activeBusiness, setActiveBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fallback Mock Data in case database has no items
  const mockInvoice = {
    invoiceNumber: "INV-2026-0001",
    invoiceDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    business: {
      legalName: "Acme Technologies Private Limited",
      tradeName: "Acme Tech",
      gstin: "27AAAAA0000A1Z0",
      address: "123 Technology Park, BKC",
      state: "Maharashtra",
      stateCode: "27",
    },
    customer: {
      name: "Global Solutions Inc",
      gstin: "27BBBBB1111B2Z1",
      state: "Maharashtra",
      stateCode: "27",
      address: "456 Corporate Avenue, BKC, Mumbai",
    },
    items: [
      {
        id: 1,
        itemName: "Software Development Consulting",
        quantity: 1,
        unitPrice: 50000,
        gstRate: 18,
        amount: 50000,
        cgst: 4500,
        sgst: 4500,
        igst: 0,
        totalAmount: 59000,
      }
    ],
    subtotal: 50000,
    totalGst: 9000,
    discount: 0,
    grandTotal: 59000,
    isInterstate: false,
  };

  // Fetch initial profile & invoices list
  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, invoicesRes] = await Promise.all([
          fetch("/api/business/profile"),
          fetch("/api/invoices")
        ]);

        if (profileRes.status === 401) {
          router.push("/login");
          return;
        }

        const profileData = await profileRes.json();
        if (profileData.business) {
          setActiveBusiness(profileData.business);
        }

        const invoicesData = await invoicesRes.json();
        if (invoicesData.invoices) {
          setInvoices(invoicesData.invoices);
          if (invoicesData.invoices.length > 0) {
            const firstId = invoicesData.invoices[0].id;
            setSelectedInvoiceId(String(firstId));
          }
        }
      } catch (err) {
        console.error("Failed to load delivery page data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  // Fetch full details when selected invoice ID changes
  useEffect(() => {
    if (selectedInvoiceId === "mock") {
      setActiveInvoice(null);
      return;
    }

    async function loadInvoiceDetails() {
      try {
        const res = await fetch(`/api/invoices/${selectedInvoiceId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.invoice) {
            setActiveInvoice(data.invoice);
          }
        }
      } catch (err) {
        console.error("Failed to load invoice details:", err);
      }
    }
    loadInvoiceDetails();
  }, [selectedInvoiceId]);

  // Determine current active preview model
  const previewInvoice = activeInvoice || {
    ...mockInvoice,
    business: activeBusiness 
      ? {
          legalName: activeBusiness.legalName || mockInvoice.business.legalName,
          tradeName: activeBusiness.tradeName || mockInvoice.business.tradeName,
          gstin: activeBusiness.gstin || mockInvoice.business.gstin,
          address: activeBusiness.address || mockInvoice.business.address,
          state: activeBusiness.state || mockInvoice.business.state,
          stateCode: activeBusiness.stateCode || mockInvoice.business.stateCode,
        }
      : mockInvoice.business
  };

  const fmt = (n: number) => `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 animate-pulse text-sm">Loading delivery dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 max-w-7xl mx-auto w-full pt-4 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Delivery & Integrations</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Explore and simulate the invoice delivery pipeline dynamically using your real database entries.
          </p>
        </div>

        {/* Invoice Selector */}
        <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] px-4 py-2.5 rounded-2xl shadow-xs shrink-0">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Preview Invoice:</label>
          <select
            value={selectedInvoiceId}
            onChange={(e) => setSelectedInvoiceId(e.target.value)}
            className="bg-transparent border-0 text-sm font-semibold text-[var(--foreground)] focus:outline-none cursor-pointer"
          >
            {invoices.length > 0 ? (
              invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} ({inv.customer?.name || "Draft"})
                </option>
              ))
            ) : (
              <option value="mock">INV-2026-0001 (Mock Sample)</option>
            )}
            {invoices.length > 0 && <option value="mock">Show Mock Sample</option>}
          </select>
        </div>
      </div>

      {/* Mock data notification */}
      {selectedInvoiceId === "mock" && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-2xl flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            {invoices.length === 0 
              ? "You haven't created any invoices yet. Showing simulated mock data below. Create an invoice to view it here dynamically!"
              : "Showing simulated mock sample. Switch to a database entry in the dropdown above to load your actual invoice data."}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-3 mb-8">
        {[
          { id: "insight", label: "Core Insight", icon: "💡" },
          { id: "whatsapp", label: "WhatsApp (Twilio)", icon: "💬" },
          { id: "email", label: "Email (SendGrid)", icon: "✉️" },
          { id: "pdf", label: "PDF Generation", icon: "📄" },
          { id: "code", label: "Backend Code", icon: "💻" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as DeliveryTab)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? "bg-[var(--accent)] text-white shadow-md shadow-indigo-600/10"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[var(--foreground)]"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-sm backdrop-blur">
        
        {/* TAB 1: CORE INSIGHT */}
        {activeTab === "insight" && (
          <div className="space-y-8">
            <div className="max-w-3xl">
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">The "Generate Once, Fan Out" Architecture</h2>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
                Efficiency and consistency are key. Instead of rendering a PDF multiple times, our backend generates the legally compliant PDF buffer **exactly once** in memory. This buffer is then distributed to multiple delivery channels:
              </p>
            </div>

            {/* Pipeline Flowchart Visual */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-gray-50/50 dark:bg-gray-800/20 p-6 md:p-8 rounded-2xl border border-[var(--border)]">
              {/* Box 1: PDF Generation */}
              <div className="lg:col-span-3 bg-white dark:bg-gray-900 border border-[var(--border)] rounded-2xl p-5 shadow-xs relative flex flex-col justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center mx-auto text-indigo-600 mb-3 font-bold text-lg">
                  1
                </div>
                <h3 className="font-bold text-sm text-[var(--foreground)]">Prisma & Puppeteer</h3>
                <p className="text-xs text-gray-400 mt-1">Generates single PDF buffer with GST compliance.</p>
              </div>

              {/* Arrow 1 */}
              <div className="lg:col-span-1 text-center font-bold text-gray-300 dark:text-gray-700 text-2xl rotate-90 lg:rotate-0">➔</div>

              {/* Box 2: Central PDF Buffer */}
              <div className="lg:col-span-4 bg-indigo-600 rounded-2xl p-6 shadow-md text-white text-center relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-white/5 rounded-full -mr-6 -mb-6" />
                <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Storage Node</span>
                <h3 className="font-extrabold text-base mt-2.5">Central Invoice PDF</h3>
                <p className="text-xs opacity-75 mt-1">One single binary source of truth.</p>
              </div>

              {/* Arrow 2 */}
              <div className="lg:col-span-1 text-center font-bold text-gray-300 dark:text-gray-700 text-2xl rotate-90 lg:rotate-0">➔</div>

              {/* Box 3: Fan Out */}
              <div className="lg:col-span-3 space-y-3">
                {/* Channel A: WhatsApp */}
                <div className="bg-white dark:bg-gray-900 border border-[var(--border)] rounded-xl p-3.5 shadow-xs flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 text-sm font-semibold">S3</div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--foreground)]">WhatsApp (S3 Public Link)</h4>
                    <p className="text-[10px] text-gray-400">Twilio requires a public PDF link.</p>
                  </div>
                </div>

                {/* Channel B: Email */}
                <div className="bg-white dark:bg-gray-900 border border-[var(--border)] rounded-xl p-3.5 shadow-xs flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 text-sm font-semibold">Direct</div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--foreground)]">Email (Direct Attachment)</h4>
                    <p className="text-[10px] text-gray-400">SendGrid attaches PDF buffer directly.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Explanation grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                  <span className="text-emerald-500">■</span> WhatsApp delivery needs S3
                </h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  The Twilio / WhatsApp Business API is designed to transfer simple JSON data and media references. It does not accept direct multi-megabyte binary uploads within message payloads. Therefore, the PDF buffer must be uploaded to an S3 bucket (or similar public storage) and sent as a secure, public HTTPS link.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                  <span className="text-blue-500">■</span> Email delivery attaches directly
                </h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  Unlike WhatsApp, SendGrid (and generic SMTP servers) natively supports RFC-compliant MIME multi-part attachments. We can stream the in-memory PDF buffer directly into SendGrid's attachment payload as a Base64-encoded string, keeping execution fast and avoiding unnecessary cloud storage costs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WHATSAPP (TWILIO) */}
        {activeTab === "whatsapp" && (
          <div className="space-y-6">
            <div className="max-w-3xl">
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">WhatsApp Integration Guide (Twilio API)</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Deliver bills directly to your customers' WhatsApp numbers. Below is the 4-step workflow to configure Twilio in our workspace.
              </p>
            </div>

            {/* TWILIO STEPS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
              {[
                {
                  step: "Step 1",
                  title: "Obtain Twilio Credentials",
                  desc: "Create a Twilio account and fetch your TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and your dedicated WhatsApp phone number from the Console.",
                },
                {
                  step: "Step 2",
                  title: "Configure Twilio Sandbox (Development)",
                  desc: 'In development, use the Twilio Sandbox. To receive messages, customers must explicitly opt-in by texting "join <sandbox-code-word>" to your sandbox number.',
                },
                {
                  step: "Step 3",
                  title: "Create Approved Message Templates",
                  desc: "WhatsApp requires pre-approved templates for business-initiated chats. Create a template on your console: e.g. 'Hi {{1}}, here is your invoice {{2}} from {{3}} for amount {{4}}: {{5}}'.",
                },
                {
                  step: "Step 4",
                  title: "Apply for Production Access",
                  desc: "Submit your business details and use cases to Meta via Twilio. Approval takes 2-5 days, unlocking direct delivery without opt-in code-word constraints.",
                },
              ].map((s, idx) => (
                <div key={idx} className="bg-gray-50/50 dark:bg-gray-800/10 p-5 rounded-2xl border border-[var(--border)] flex items-start gap-4">
                  <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg shrink-0">
                    {s.step}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--foreground)] mb-1">{s.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Twilio Warning Alert */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="font-bold text-sm text-amber-800 dark:text-amber-300">WhatsApp Sandbox Constraints</h4>
                <p className="text-xs text-amber-700 dark:text-amber-400/80 leading-relaxed mt-0.5">
                  Remember: Customers must register their number with your Sandbox first before you send them an invoice. Unregistered numbers will result in silent Twilio errors (Error `21610` / opt-out status). Always provide a fallback email delivery option!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EMAIL (SENDGRID) */}
        {activeTab === "email" && (
          <div className="space-y-8">
            <div className="max-w-3xl">
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">Email Integration Guide (SendGrid API)</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Deliver rich transactional notifications using SendGrid. The free tier gives 100 emails/day which is perfect for development.
              </p>
            </div>

            {/* Email Summary Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4 px-1">HTML Email body preview (Dynamic Data)</h3>
                {/* Simulated Email Client */}
                <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-white shadow-sm text-gray-800">
                  {/* Email header details */}
                  <div className="bg-gray-50 border-b border-gray-100 p-4 text-xs space-y-1">
                    <p><span className="font-medium text-gray-400">From:</span> Billing Service &lt;noreply@yourcompany.com&gt;</p>
                    <p><span className="font-medium text-gray-400">To:</span> {previewInvoice.customer?.email || 'billing@customer.com'}</p>
                    <p><span className="font-medium text-gray-400">Subject:</span> Invoice {previewInvoice.invoiceNumber} from {previewInvoice.business?.legalName || previewInvoice.business?.tradeName}</p>
                  </div>
                  {/* Email content */}
                  <div className="p-6 space-y-6 font-sans">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{previewInvoice.business?.legalName || previewInvoice.business?.tradeName}</h4>
                        {previewInvoice.business?.gstin && <p className="text-[10px] text-gray-400">GSTIN: {previewInvoice.business?.gstin}</p>}
                      </div>
                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                        previewInvoice.status === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {previewInvoice.status || "Unpaid"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm">Hi <strong>{previewInvoice.customer?.name}</strong>,</p>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        An invoice has been raised for services rendered. A PDF version is attached to this email. Here is a summary of your outstanding payment due on <strong>{formatDate(previewInvoice.dueDate)}</strong>:
                      </p>
                    </div>

                    {/* Mini invoice summary table */}
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400">
                            <th className="p-3">Description</th>
                            <th className="p-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-50">
                            <td className="p-3 text-gray-700">Subtotal</td>
                            <td className="p-3 text-right text-gray-700">{fmt(previewInvoice.subtotal)}</td>
                          </tr>
                          <tr className="border-b border-gray-50">
                            <td className="p-3 text-gray-700">GST</td>
                            <td className="p-3 text-right text-gray-700">{fmt(previewInvoice.totalGst)}</td>
                          </tr>
                          {previewInvoice.discount > 0 && (
                            <tr className="border-b border-gray-50">
                              <td className="p-3 text-gray-700">Discount</td>
                              <td className="p-3 text-right text-rose-600">- {fmt(previewInvoice.discount)}</td>
                            </tr>
                          )}
                          <tr className="bg-indigo-50/30">
                            <td className="p-3 font-bold text-indigo-950">Grand Total Due</td>
                            <td className="p-3 text-right font-bold text-indigo-950">{fmt(previewInvoice.grandTotal)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-col gap-4 text-center">
                      <a href="#" className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors">
                        Download Invoice PDF
                      </a>
                      <p className="text-[10px] text-gray-400">
                        If you have questions, please reach out to us. Thank you!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SendGrid Instructions */}
              <div className="space-y-4 flex flex-col justify-center">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 px-1">How it Works</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  When the customer receives the email notification, they get a direct preview of the outstanding due amount and breakdown inside their client. They do not need to download the PDF to see the primary figures.
                </p>
                <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900 rounded-2xl space-y-2">
                  <h4 className="font-bold text-sm text-[var(--accent)]">No S3 storage required for emails!</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400/80 leading-relaxed">
                    We use SendGrid's attachment API to send the PDF file. The PDF buffer generated in memory is encoded in `base64` and passed inside the `attachments` array parameter, eliminating the need to upload it to S3 first.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PDF GENERATION (GST COMPLIANCE) */}
        {activeTab === "pdf" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div className="max-w-2xl">
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">GST-Compliant HTML Invoice (Dynamic Preview)</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Legally valid invoices in India must have specific fields to ensure your client can claim Input Tax Credit (ITC).
                </p>
              </div>

              {/* Highlight Controls */}
              <button
                onClick={() => setHighlightGstFields(!highlightGstFields)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all border cursor-pointer ${
                  highlightGstFields 
                    ? "bg-amber-100 border-amber-300 text-amber-800" 
                    : "bg-white dark:bg-gray-800 border-[var(--border)] text-gray-500 hover:text-[var(--foreground)]"
                }`}
              >
                {highlightGstFields ? "Hide Legal Highlights" : "Highlight Required GST Fields"}
              </button>
            </div>

            {/* GST Invoice Preview Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-[var(--border)] p-6 md:p-10 shadow-sm relative overflow-hidden text-gray-800 dark:text-gray-100">
              
              {/* Document Header */}
              <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-6 mb-6">
                <div>
                  <h3 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">TAX INVOICE</h3>
                  <p className="text-xs text-gray-400 mt-1">Invoice Number: {previewInvoice.invoiceNumber}</p>
                </div>
                <div className={`text-right p-2 rounded-xl transition-all duration-300 ${
                  highlightGstFields ? "bg-amber-100/80 dark:bg-amber-950/40 border border-dashed border-amber-400 text-amber-900 dark:text-amber-200" : ""
                }`}>
                  <p className="font-bold text-xs">Supplier GSTIN</p>
                  <p className="text-sm font-mono tracking-wide">{previewInvoice.business?.gstin || "—"}</p>
                  {highlightGstFields && <span className="text-[9px] font-bold block text-amber-600 mt-0.5">Supplier's Registered GSTIN</span>}
                </div>
              </div>

              {/* Billing Meta */}
              <div className="grid grid-cols-2 gap-8 bg-gray-50 dark:bg-gray-800/40 p-5 rounded-2xl border border-[var(--border)] mb-6 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Details of Receiver (Billed To)</p>
                  <p className="font-bold text-sm">{previewInvoice.customer?.name}</p>
                  <p className="text-gray-500 mt-1">{previewInvoice.customer?.address || "No address specified."}</p>
                  
                  <div className={`mt-3 p-1.5 rounded transition-all duration-300 ${
                    highlightGstFields ? "bg-amber-100/80 dark:bg-amber-950/40 border border-dashed border-amber-400 text-amber-900 dark:text-amber-200" : ""
                  }`}>
                    <p className="font-semibold text-[10px]">Recipient GSTIN</p>
                    <p className="font-mono">{previewInvoice.customer?.gstin || "URD (Unregistered Customer)"}</p>
                    {highlightGstFields && <span className="text-[9px] font-bold block text-amber-600 mt-0.5">Customer's GSTIN (Required for ITC)</span>}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Invoice Details</p>
                  <p className="text-gray-500">Date: <span className="font-medium text-gray-900 dark:text-white">{formatDate(previewInvoice.invoiceDate)}</span></p>
                  <p className="text-gray-500">Due Date: <span className="font-medium text-gray-900 dark:text-white">{formatDate(previewInvoice.dueDate)}</span></p>
                  <p className="text-gray-500">Place of Supply: <span className="font-semibold text-gray-900 dark:text-white">{previewInvoice.customer?.state || "Maharashtra"} ({previewInvoice.customer?.stateCode || "27"})</span></p>
                  <p className="text-gray-500 mt-2">State of Supplier: <span className="font-semibold text-gray-900 dark:text-white">{previewInvoice.business?.state || "Maharashtra"} ({previewInvoice.business?.stateCode || "27"})</span></p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden text-xs mb-6">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 font-semibold text-[10px] uppercase tracking-wider text-gray-500">
                      <th className="px-4 py-3">Description</th>
                      <th className={`px-3 py-3 text-center transition-all ${highlightGstFields ? "bg-amber-100/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300" : ""}`}>SAC Code</th>
                      <th className="px-3 py-3 text-right">Qty</th>
                      <th className="px-3 py-3 text-right">Price</th>
                      <th className={`px-3 py-3 text-right transition-all ${highlightGstFields ? "bg-amber-100/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300" : ""}`}>CGST ({previewInvoice.isInterstate ? "0" : "9"}%)</th>
                      <th className={`px-3 py-3 text-right transition-all ${highlightGstFields ? "bg-amber-100/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300" : ""}`}>SGST ({previewInvoice.isInterstate ? "0" : "9"}%)</th>
                      <th className={`px-3 py-3 text-right transition-all ${highlightGstFields ? "bg-amber-100/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300" : ""}`}>IGST ({previewInvoice.isInterstate ? "18" : "0"}%)</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {previewInvoice.items.map((item: any, index: number) => {
                      const sacCode = 998313 + index; // Mock SAC code for display
                      return (
                        <tr key={item.id || index} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                          <td className="px-4 py-3.5 font-medium">{item.itemName}</td>
                          <td className={`px-3 py-3.5 text-center font-mono transition-all ${highlightGstFields ? "bg-amber-100/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300" : ""}`}>{sacCode}</td>
                          <td className="px-3 py-3.5 text-right">{item.quantity}</td>
                          <td className="px-3 py-3.5 text-right">{fmt(item.unitPrice)}</td>
                          <td className={`px-3 py-3.5 text-right font-mono transition-all ${highlightGstFields ? "bg-amber-100/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300" : ""}`}>{fmt(item.cgst ?? 0)}</td>
                          <td className={`px-3 py-3.5 text-right font-mono transition-all ${highlightGstFields ? "bg-amber-100/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300" : ""}`}>{fmt(item.sgst ?? 0)}</td>
                          <td className={`px-3 py-3.5 text-right font-mono transition-all ${highlightGstFields ? "bg-amber-100/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300" : ""}`}>{fmt(item.igst ?? 0)}</td>
                          <td className="px-4 py-3.5 text-right font-bold">{fmt(item.totalAmount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {highlightGstFields && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-dashed border-amber-300 text-amber-950 dark:text-amber-200 text-xs rounded-xl space-y-2.5">
                  <p><strong>💡 Why these fields are mandatory for business clients:</strong></p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>HSN/SAC Code:</strong> Harmonized System of Nomenclature / Services Accounting Code classifies the type of product/service under the tax schedules. Without it, tax rates cannot be audited.</li>
                    <li><strong>Separated CGST / SGST columns:</strong> For intra-state transactions, Central and State tax amounts must be specified independently. For interstate transactions, CGST/SGST columns are set to zero, and the combined <strong>IGST</strong> column is loaded instead.</li>
                  </ul>
                </div>
              )}

              {/* Total calculations */}
              <div className="flex justify-end text-xs font-semibold">
                <div className="w-72 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-[var(--border)] space-y-2">
                  <div className="flex justify-between text-gray-500">
                    <span>Taxable Value</span>
                    <span>{fmt(previewInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>GST Tax Total</span>
                    <span>{fmt(previewInvoice.totalGst)}</span>
                  </div>
                  {previewInvoice.discount > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Discount</span>
                      <span className="text-rose-600">- {fmt(previewInvoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t border-gray-150 dark:border-gray-800 pt-2 mt-2">
                    <span>Grand Total</span>
                    <span>{fmt(previewInvoice.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BACKEND CODE */}
        {activeTab === "code" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">Production Send Handler Endpoint</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Below is the standard clean Node/Next.js implementation handler code for sending an invoice dynamically. It performs S3 PDF upload, SendGrid Email send, and Twilio WhatsApp delivery.
              </p>
            </div>

            {/* Dark Mode Code Editor */}
            <div className="rounded-2xl border border-gray-800 overflow-hidden bg-gray-950 font-mono text-xs text-gray-300 shadow-2xl">
              {/* Editor Header tab bar */}
              <div className="bg-gray-900 px-4 py-2.5 flex items-center justify-between border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-gray-400 font-bold ml-2">app/api/invoices/[id]/send/route.ts</span>
                </div>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">typescript</span>
              </div>

              {/* Code blocks */}
              <pre className="p-5 overflow-x-auto leading-relaxed max-h-[500px]">
{`import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import sgMail from "@sendgrid/mail";
import twilio from "twilio";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Configure APIs
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const business = await prisma.business.findUnique({ where: { userId } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const invoice = await prisma.invoice.findFirst({
      where: { id: Number(id), businessId: business.id },
      include: { customer: true, items: true }
    });
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    // Step 1: Generate PDF Buffer (e.g. using Puppeteer HTML generation)
    const pdfBuffer = await generateInvoicePdfBuffer(invoice, business);

    // Step 2: S3 Upload (For WhatsApp deliveries)
    const s3Key = \`invoices/inv-\${invoice.id}-\${Date.now()}.pdf\`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: "application/pdf"
    }));
    const s3PublicUrl = \`https://\${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/\${s3Key}\`;

    // Step 3: Transactional Database Updates & Reminders Scheduling
    const d1 = new Date(invoice.dueDate); d1.setDate(d1.getDate() + 7);
    const d2 = new Date(invoice.dueDate); d2.setDate(d2.getDate() + 14);

    await prisma.$transaction([
      prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "SENT", sentAt: new Date() }
      }),
      prisma.reminderLog.deleteMany({
        where: { invoiceId: invoice.id, sent: false }
      }),
      prisma.reminderLog.createMany({
        data: [
          { invoiceId: invoice.id, scheduledAt: d1 },
          { invoiceId: invoice.id, scheduledAt: d2 }
        ]
      })
    ]);

    // Step 4: Fan out to Email (SendGrid with attachment buffer)
    await sgMail.send({
      to: invoice.customer.email!,
      from: "billing@yourcompany.com",
      subject: \`Invoice \${invoice.invoiceNumber} from \${business.legalName}\`,
      html: getEmailHtmlSummaryTable(invoice, business),
      attachments: [{
        content: pdfBuffer.toString("base64"),
        filename: \`\${invoice.invoiceNumber}.pdf\`,
        type: "application/pdf",
        disposition: "attachment"
      }]
    });

    // Step 5: Fan out to WhatsApp (Twilio with S3 Public URL link reference)
    await twilioClient.messages.create({
      from: \`whatsapp:\${process.env.TWILIO_WHATSAPP_NUMBER}\`,
      to: \`whatsapp:\${invoice.customer.phone}\`,
      body: \`Hi \${invoice.customer.name}, your invoice \${invoice.invoiceNumber} is ready. Download it here: \${s3PublicUrl}\`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delivery pipeline error:", error);
    return NextResponse.json({ error: "Failed to dispatch invoice" }, { status: 500 });
  }
}`}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
