import { useState, useEffect, useCallback } from "react";
import Layout from "../components/Layout";
import { useLang } from "../utils/lang";
import { apiFetch } from "../utils/api";
import InvoiceModal from "../components/InvoiceModal";

function toDateString(d) {
  return d.toISOString().split("T")[0];
}

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: toDateString(from), to: toDateString(to) };
}

const texts = {
  ar: {
    title: "سجل النظام",
    tabInventory: "تغييرات المخزون",
    tabSales: "المبيعات",
    tabReturns: "المرتجعات",
    from: "من",
    to: "إلى",
    apply: "تطبيق",
    print: "طباعة",
    loading: "جاري التحميل...",
    noData: "لا توجد سجلات",
    close: "إغلاق",
    details: "التفاصيل",

    // inventory columns
    action: "الإجراء",
    part: "القطعة",
    serial: "الرقم التسلسلي",
    performedBy: "بواسطة",
    date: "التاريخ",
    add: "إضافة",
    edit: "تعديل",
    delete: "حذف",
    changes: "التغييرات",
    field: "الحقل",
    from_val: "من",
    to_val: "إلى",
    value: "القيمة",
    noChanges: "لا توجد تفاصيل",

    // sales columns
    invoice: "رقم الفاتورة",
    type: "النوع",
    customer: "العميل",
    total: "الإجمالي",
    tax: "الضريبة",
    discount: "الخصم",
    seller: "البائع",
    cash: "نقدي",
    credit: "آجل",
    partiallyReturned: "مرتجع جزئياً",
    fullyReturned: "مرتجع بالكامل",
    items: "المنتجات",
    itemName: "الاسم",
    itemQty: "الكمية",
    itemPrice: "سعر الوحدة",

    // returns columns
    returnId: "رقم المرتجع",
    orderId: "رقم الطلب",
    qty: "الكمية",
    refund: "المبلغ المسترد",
    approver: "المسؤول",
  },
  en: {
    title: "Audit Log",
    tabInventory: "Inventory Changes",
    tabSales: "Sales",
    tabReturns: "Returns",
    from: "From",
    to: "To",
    apply: "Apply",
    print: "Print",
    loading: "Loading...",
    noData: "No records found",
    close: "Close",
    details: "Details",

    action: "Action",
    part: "Part",
    serial: "Serial",
    performedBy: "Performed By",
    date: "Date",
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    changes: "Changes",
    field: "Field",
    from_val: "From",
    to_val: "To",
    value: "Value",
    noChanges: "No details",

    invoice: "Invoice #",
    type: "Type",
    customer: "Customer",
    total: "Total",
    tax: "Tax",
    discount: "Discount",
    seller: "Seller",
    cash: "Cash",
    credit: "Credit",
    partiallyReturned: "Partially Returned",
    fullyReturned: "Fully Returned",
    items: "Items",
    itemName: "Name",
    itemQty: "Qty",
    itemPrice: "Unit Price",

    returnId: "Return #",
    orderId: "Order #",
    qty: "Qty",
    refund: "Refund",
    approver: "Approver",
  },
};

const TABS = ["inventory", "sales", "returns"];

function actionStyle(action) {
  if (action === "add") return { backgroundColor: "#e6f9e6", color: "#166534" };
  if (action === "edit")
    return { backgroundColor: "#fff3e6", color: "#9a3412" };
  if (action === "delete")
    return { backgroundColor: "#fde2e2", color: "#9b2626" };
  return {};
}

function DetailModal({ row, t, lang, onClose }) {
  if (!row) return null;
  const isRTL = lang === "ar";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold" style={{ color: "#18160f" }}>
            {t.details}
          </h3>
          <button onClick={onClose} style={{ color: "#90887a" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex gap-2 flex-wrap">
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={actionStyle(row.action_type)}
            >
              {t[row.action_type]}
            </span>
          </div>
          <div
            className="grid grid-cols-2 gap-x-4 gap-y-1"
            style={{ color: "#18160f" }}
          >
            <span style={{ color: "#90887a" }}>{t.part}:</span>
            <span>{row.part_name}</span>
            <span style={{ color: "#90887a" }}>{t.serial}:</span>
            <span className="font-mono text-xs">{row.serial_number}</span>
            <span style={{ color: "#90887a" }}>{t.performedBy}:</span>
            <span>{row.performed_by_name}</span>
            <span style={{ color: "#90887a" }}>{t.date}:</span>
            <span>
              {row.performed_at
                ? new Date(row.performed_at).toLocaleString()
                : "—"}
            </span>
          </div>

          {row.action_type === "edit" &&
            (() => {
              const ch = row.changes || {};
              const keys = Object.keys(ch);
              if (keys.length === 0)
                return <p style={{ color: "#90887a" }}>{t.noChanges}</p>;
              return (
                <div>
                  <p
                    className="font-semibold mb-1"
                    style={{ color: "#18160f" }}
                  >
                    {t.changes}
                  </p>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr style={{ backgroundColor: "#f9f8f4" }}>
                        <th
                          className="px-2 py-1 text-start border"
                          style={{ borderColor: "#ede9e0", color: "#18160f" }}
                        >
                          {t.field}
                        </th>
                        <th
                          className="px-2 py-1 text-start border"
                          style={{ borderColor: "#ede9e0", color: "#18160f" }}
                        >
                          {t.from_val}
                        </th>
                        <th
                          className="px-2 py-1 text-start border"
                          style={{ borderColor: "#ede9e0", color: "#18160f" }}
                        >
                          {t.to_val}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {keys.map((k) => (
                        <tr
                          key={k}
                          className="border-b"
                          style={{ borderColor: "#ede9e0" }}
                        >
                          <td
                            className="px-2 py-1 border font-mono"
                            style={{ borderColor: "#ede9e0" }}
                          >
                            {k}
                          </td>
                          <td
                            className="px-2 py-1 border"
                            style={{ borderColor: "#ede9e0", color: "#9b2626" }}
                          >
                            {String(ch[k].from)}
                          </td>
                          <td
                            className="px-2 py-1 border"
                            style={{ borderColor: "#ede9e0", color: "#166534" }}
                          >
                            {String(ch[k].to)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}

          {(row.action_type === "add" || row.action_type === "delete") &&
            (() => {
              const ch = row.changes || {};
              const keys = Object.keys(ch);
              if (keys.length === 0) return null;
              return (
                <div>
                  <p
                    className="font-semibold mb-1"
                    style={{ color: "#18160f" }}
                  >
                    {t.value}
                  </p>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr style={{ backgroundColor: "#f9f8f4" }}>
                        <th
                          className="px-2 py-1 text-start border"
                          style={{ borderColor: "#ede9e0", color: "#18160f" }}
                        >
                          {t.field}
                        </th>
                        <th
                          className="px-2 py-1 text-start border"
                          style={{ borderColor: "#ede9e0", color: "#18160f" }}
                        >
                          {t.value}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {keys.map((k) => (
                        <tr
                          key={k}
                          className="border-b"
                          style={{ borderColor: "#ede9e0" }}
                        >
                          <td
                            className="px-2 py-1 border font-mono"
                            style={{ borderColor: "#ede9e0" }}
                          >
                            {k}
                          </td>
                          <td
                            className="px-2 py-1 border"
                            style={{ borderColor: "#ede9e0" }}
                          >
                            {String(ch[k])}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
        </div>

        <button
          onClick={onClose}
          className="mt-5 px-5 py-2 rounded-lg text-white text-sm font-semibold"
          style={{ backgroundColor: "#9b2626" }}
        >
          {t.close}
        </button>
      </div>
    </div>
  );
}

function AuditLog() {
  const { lang } = useLang();
  const t = texts[lang];
  const isRTL = lang === "ar";

  const initialRange = defaultRange();
  const [activeTab, setActiveTab] = useState("inventory");
  const [dateFrom, setDateFrom] = useState(initialRange.from);
  const [dateTo, setDateTo] = useState(initialRange.to);
  const [data, setData] = useState({ inventory: [], sales: [], returns: [] });
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const inputStyle = {
    border: "1.5px solid #d8d4c8",
    backgroundColor: "#f9f8f4",
  };
  const handleInputFocus = (e) => {
    e.target.style.borderColor = "#9b2626";
    e.target.style.boxShadow = "0 0 0 3px rgba(155,38,38,0.1)";
  };
  const handleInputBlur = (e) => {
    e.target.style.borderColor = "#d8d4c8";
    e.target.style.boxShadow = "none";
  };

  const fetchTab = useCallback(async (tab, from, to) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const raw = await apiFetch(`/audit/${tab}?${params.toString()}`);
      const rows = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : [];
      setData((prev) => ({ ...prev, [tab]: rows }));
    } catch {
      setData((prev) => ({ ...prev, [tab]: [] }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTab(activeTab, dateFrom, dateTo);
  }, [activeTab, fetchTab]);

  const handleApply = () => {
    fetchTab(activeTab, dateFrom, dateTo);
  };

  const rows = data[activeTab] || [];

  return (
    <Layout titleKey="audit">
      <div
        className="bg-white rounded-xl shadow-sm border p-4 mb-4 print:hidden"
        style={{ borderColor: "#dedad0" }}
      >
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs mb-1" style={{ color: "#90887a" }}>
              {t.from}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "#90887a" }}>
              {t.to}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>
          <button
            onClick={handleApply}
            className="px-5 py-2 rounded-lg text-white text-sm font-semibold"
            style={{ backgroundColor: "#9b2626" }}
          >
            {t.apply}
          </button>
          <button
            onClick={() => window.print()}
            className="px-5 py-2 rounded-lg text-sm font-semibold border"
            style={{ borderColor: "#dedad0", color: "#18160f" }}
          >
            {t.print}
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-3 print:hidden">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            style={{
              backgroundColor: activeTab === tab ? "#9b2626" : "white",
              color: activeTab === tab ? "white" : "#18160f",
              border: activeTab === tab ? "none" : "1.5px solid #dedad0",
            }}
          >
            {t[`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`]}
          </button>
        ))}
      </div>

      <div
        className="bg-white rounded-xl shadow-sm border print:shadow-none"
        style={{ borderColor: "#dedad0" }}
      >
        {loading ? (
          <div className="p-8 text-center" style={{ color: "#90887a" }}>
            {t.loading}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: "#90887a" }}>
            {t.noData}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === "inventory" && (
              <table dir={isRTL ? "rtl" : "ltr"} className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#f9f8f4" }}>
                    <th
                      className="px-3 py-2 text-start font-semibold"
                      style={{ color: "#18160f" }}
                    >
                      {t.action}
                    </th>
                    <th
                      className="px-3 py-2 text-start font-semibold"
                      style={{ color: "#18160f" }}
                    >
                      {t.part}
                    </th>
                    <th
                      className="px-3 py-2 text-start font-semibold"
                      style={{ color: "#18160f" }}
                    >
                      {t.serial}
                    </th>
                    <th
                      className="px-3 py-2 text-start font-semibold"
                      style={{ color: "#18160f" }}
                    >
                      {t.performedBy}
                    </th>
                    <th
                      className="px-3 py-2 text-start font-semibold"
                      style={{ color: "#18160f" }}
                    >
                      {t.date}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.log_id}
                      className="border-b hover:bg-[#fdf9f9] cursor-pointer"
                      style={{ borderColor: "#ede9e0" }}
                      onClick={() => setSelectedRow(row)}
                    >
                      <td className="px-3 py-2">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={actionStyle(row.action_type)}
                        >
                          {t[row.action_type]}
                        </span>
                      </td>
                      <td className="px-3 py-2">{row.part_name}</td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {row.serial_number}
                      </td>
                      <td className="px-3 py-2">{row.performed_by_name}</td>
                      <td className="px-3 py-2">
                        {row.performed_at
                          ? new Date(row.performed_at).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "sales" && (
              <table dir={isRTL ? "rtl" : "ltr"} className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#f9f8f4" }}>
                    <th
                      className="px-3 py-2 text-start font-semibold"
                      style={{ color: "#18160f" }}
                    >
                      {t.invoice}
                    </th>
                    <th
                      className="px-3 py-2 text-start font-semibold"
                      style={{ color: "#18160f" }}
                    >
                      {t.type}
                    </th>
                    <th
                      className="px-3 py-2 text-start font-semibold"
                      style={{ color: "#18160f" }}
                    >
                      {t.customer}
                    </th>
                    <th
                      className="px-3 py-2 text-start font-semibold"
                      style={{ color: "#18160f" }}
                    >
                      {t.total}
                    </th>
                    <th
                      className="px-3 py-2 text-start font-semibold"
                      style={{ color: "#18160f" }}
                    >
                      {t.tax}
                    </th>
                    <th
                      className="px-3 py-2 text-start font-semibold"
                      style={{ color: "#18160f" }}
                    >
                      {t.seller}
                    </th>
                    <th
                      className="px-3 py-2 text-start font-semibold"
                      style={{ color: "#18160f" }}
                    >
                      {t.date}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.order_id}
                      className="border-b hover:bg-[#fdf9f9] cursor-pointer"
                      style={{ borderColor: "#ede9e0" }}
                      onClick={() => setSelectedOrderId(row.order_id)}
                    >
                      <td className="px-3 py-2 font-mono text-xs">{row.invoice_number || row.order_id}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-1">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor:
                                row.invoice_type === "cash"
                                  ? "#e6f9e6"
                                  : "#fff3e6",
                              color:
                                row.invoice_type === "cash"
                                  ? "#166534"
                                  : "#9a3412",
                            }}
                          >
                            {row.invoice_type === "cash" ? t.cash : t.credit}
                          </span>
                          {row.returns_status === "full" && (
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: "#fde2e2",
                                color: "#9b2626",
                              }}
                            >
                              {t.fullyReturned}
                            </span>
                          )}
                          {row.returns_status === "partial" && (
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: "#fff3e6",
                                color: "#9a3412",
                              }}
                            >
                              {t.partiallyReturned}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">{row.customer_name || "—"}</td>
                      <td className="px-3 py-2 font-medium">
                        {parseFloat(row.total_amount || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        {parseFloat(row.tax || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2">{row.worker_name || "—"}</td>
                      <td className="px-3 py-2">
                        {row.created_at
                          ? new Date(row.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "returns" && (
              <table dir={isRTL ? "rtl" : "ltr"} className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#f9f8f4" }}>
                    <th
                      className="px-3 py-2 text-start font-semibold"
                      style={{ color: "#18160f" }}
                    >
                      {t.returnId}
                    </th>
                    <th
                      className="px-3 py-2 text-start font-semibold"
                      style={{ color: "#18160f" }}
                    >
                      {t.orderId}
                    </th>
                    <th
                      className="px-3 py-2 text-start font-semibold"
                      style={{ color: "#18160f" }}
                    >
                      {t.part}
                    </th>
                    <th
                      className="px-3 py-2 text-start font-semibold"
                      style={{ color: "#18160f" }}
                    >
                      {t.qty}
                    </th>
                    <th
                      className="px-3 py-2 text-start font-semibold"
                      style={{ color: "#18160f" }}
                    >
                      {t.refund}
                    </th>
                    <th
                      className="px-3 py-2 text-start font-semibold"
                      style={{ color: "#18160f" }}
                    >
                      {t.approver}
                    </th>
                    <th
                      className="px-3 py-2 text-start font-semibold"
                      style={{ color: "#18160f" }}
                    >
                      {t.date}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.return_id}
                      className="border-b hover:bg-[#fdf9f9] cursor-pointer"
                      style={{ borderColor: "#ede9e0" }}
                      onClick={() => setSelectedOrderId(row.order_id)}
                    >
                      <td className="px-3 py-2">{row.return_id}</td>
                      <td className="px-3 py-2 font-mono text-xs">{row.invoice_number || row.order_id}</td>
                      <td className="px-3 py-2">{row.part_name || "—"}</td>
                      <td className="px-3 py-2">{row.quantity}</td>
                      <td className="px-3 py-2 text-red-600 font-medium">
                        {parseFloat(row.refund_amount || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2">{row.admin_name || "—"}</td>
                      <td className="px-3 py-2">
                        {row.return_date
                          ? new Date(row.return_date).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {selectedRow && (
        <DetailModal
          row={selectedRow}
          t={t}
          lang={lang}
          onClose={() => setSelectedRow(null)}
        />
      )}

      <InvoiceModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        lang={lang}
      />
    </Layout>
  );
}

export default AuditLog;
