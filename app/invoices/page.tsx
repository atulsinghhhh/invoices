import InvoicesList from "../components/InvoicesList";

export const metadata = {
  title: "Invoices",
};

export default function InvoicesPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
      </div>

      <InvoicesList />
    </div>
  );
}
