'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Order {
  id: string;
  items: { name: string; price: number; quantity: number }[];
  total: number;
  created_at: string;
  status: string;
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastPrintedId, setLastPrintedId] = useState<string | null>(null);

  // 🔄 Fetch orders dari Supabase
  const fetchOrders = async () => {
    console.log("📥 Fetching all orders from Supabase...");
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Gagal ambil orders:", error);
    } else {
      console.log("✅ Orders loaded:", data.length);
      setOrders(data);
    }
  };

  // 🔧 Update status order
  const updateStatus = async (orderId: string, newStatus: string) => {
    console.log(`🔁 Update status order ${orderId} ke "${newStatus}"`);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (!error) {
      console.log("✅ Status berhasil diubah");
    } else {
      console.error("❌ Gagal update status:", error.message);
    }
  };

  // 🖨️ Cetak PDF pakai html2pdf.js
  const handlePrintPDF = async (order: Order) => {
    console.log("🖨️ (PDF) Mencetak struk ke PDF:", order.id);
    const html2pdf = (await import("html2pdf.js")).default;
    const el = document.getElementById(`struk-${order.id}`);
    if (el) {
      html2pdf()
        .set({
          margin: 5,
          filename: `struk-${order.id}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a7", orientation: "portrait" },
        })
        .from(el)
        .save();
    }
  };

  // 🧾 Cetak langsung ke printer thermal (58mm)
const handlePrintThermal = (order: Order) => {
  console.log("🧾 (Thermal) Mencetak struk ke printer thermal:", order.id);
  const el = document.getElementById(`struk-${order.id}`);
  if (!el) {
    console.error("❌ Element struk tidak ditemukan:", order.id);
    return;
  }

  // 🪟 Buka jendela cetak baru
  const printWindow = window.open("", "PRINT", "width=400,height=600");
  if (!printWindow) {
    console.error("❌ Gagal buka jendela print");
    return;
  }

  // 🧠 Inject konten dan stylesheet khusus print
  printWindow.document.write(`
    <html>
      <head>
        <title>Struk - ${order.id}</title>
        <link rel="stylesheet" href="/print.css" media="print">
      </head>
      <body>${el.innerHTML}</body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  // ⏱️ Tunggu render, lalu print
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
    console.log("✅ Thermal print selesai untuk order:", order.id);
  };
};


  // 🧠 Supabase realtime listener
  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        async (payload) => {
          console.log("📡 Perubahan realtime:", payload);
          await fetchOrders();

          const newOrder = payload.new as Order;
          if (newOrder.status === "Sudah Bayar" && newOrder.id !== lastPrintedId) {
            console.log("🖨️ Auto cetak struk:", newOrder.id);
            setLastPrintedId(newOrder.id);
            handlePrintThermal(newOrder); // ✅ default auto-print ke thermal
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lastPrintedId]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 font-mono">
      <h1 className="text-3xl font-bold text-center text-rose-600 mb-6">
        🧾 Dashboard Admin - Daftar Order
      </h1>

      {orders.map((order) => (
        <div
          key={order.id}
          className="border p-4 rounded-xl shadow-sm bg-white space-y-2"
        >
          <p className="text-sm text-gray-500">
            ⏰ {new Date(order.created_at).toLocaleString()}
          </p>

          <ul className="list-disc pl-5">
            {order.items.map((item, idx) => (
              <li key={idx}>
                {item.name} x{item.quantity} – Rp {(item.price * item.quantity).toLocaleString()}
              </li>
            ))}
          </ul>

          <p className="font-semibold text-rose-600">
            Total: Rp {order.total.toLocaleString()}
          </p>
          <p className="text-sm">Status: {order.status}</p>

          <div className="flex flex-wrap gap-2 mt-2">
            {["Pending", "Proses", "Sudah Bayar"].map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(order.id, s)}
                className={`px-3 py-1 text-sm text-white rounded ${
                  order.status === s
                    ? "bg-rose-600"
                    : "bg-gray-400 hover:bg-gray-500"
                }`}
              >
                {s}
              </button>
            ))}

            {/* Tombol Cetak */}
            <button
              onClick={() => handlePrintPDF(order)}
              className="ml-auto bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded"
            >
              🖨️ PDF
            </button>
            <button
              onClick={() => handlePrintThermal(order)}
              className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded"
            >
              🧾 Thermal
            </button>
          </div>

          {/* 🧾 Template Struk */}
          <div
            id={`struk-${order.id}`}
            style={{
              width: "220px",
              padding: "10px",
              background: "white",
              color: "black",
              fontFamily: "monospace",
              fontSize: "10px",
              lineHeight: "1.4",
              marginTop: "20px",
              border: "1px solid gray",
            }}
          >
            <div style={{ textAlign: "center", fontWeight: "bold" }}>☕ Resto Cinta</div>
            <div style={{ textAlign: "center" }}>Jl. Mawar No. 99</div>
            <div style={{ textAlign: "center" }}>0812-xxxx-xxxx</div>
            <hr />
            <div>Order #: {order.id.slice(0, 6).toUpperCase()}</div>
            <div>{new Date(order.created_at).toLocaleString()}</div>
            <hr />
            {order.items.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{item.name} x{item.quantity}</span>
                <span>Rp {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <hr />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
              <span>Total</span>
              <span>Rp {order.total.toLocaleString()}</span>
            </div>
            <hr />
            <div style={{ textAlign: "center" }}>-- Terima Kasih --</div>
          </div>
        </div>
      ))}
    </div>
  );
}
