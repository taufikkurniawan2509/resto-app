'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Order {
  id: string;
  items: { name: string; price: number; quantity: number }[]; // ✅ ditambah quantity
  total: number;
  created_at: string;
  status: string;
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastPrintedId, setLastPrintedId] = useState<string | null>(null);

  // 🔄 Fetch order dari Supabase
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

  // 🔧 Update status order (misal: Proses → Selesai)
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

  // 🖨️ Cetak struk ke PDF
  const handlePrint = async (order: Order) => {
    console.log("🖨️ Mencetak struk:", order.id);
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

  // 🧠 Listen perubahan realtime dari Supabase
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
            console.log("🖨️ Auto cetak untuk order:", newOrder.id);
            setLastPrintedId(newOrder.id);
            handlePrint(newOrder);
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
          {/* ⏰ Info waktu order */}
          <p className="text-sm text-gray-500">
            ⏰ {new Date(order.created_at).toLocaleString()}
          </p>

          {/* 🧾 Daftar item dan jumlahnya */}
          <ul className="list-disc pl-5">
            {order.items.map((item, idx) => (
              <li key={idx}>
                {item.name} x{item.quantity} – Rp {(item.price * item.quantity).toLocaleString()}
              </li>
            ))}
          </ul>

          {/* 💰 Total dan status */}
          <p className="font-semibold text-rose-600">
            Total: Rp {order.total.toLocaleString()}
          </p>
          <p className="text-sm">Status: {order.status}</p>

          {/* 🔘 Tombol ubah status dan cetak */}
          <div className="flex gap-2 mt-2">
            {["Pending", "Proses", "Selesai", "Sudah Bayar"].map((s) => (
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
            <button
              onClick={() => handlePrint(order)}
              className="ml-auto bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded"
            >
              🖨️ Cetak Struk
            </button>
          </div>

          {/* 📄 Template untuk cetak PDF */}
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
            <hr style={{ border: "none", borderTop: "1px dashed black", margin: "4px 0" }} />
            <div>Order #: {order.id.slice(0, 6).toUpperCase()}</div>
            <div>{new Date(order.created_at).toLocaleString()}</div>
            <hr style={{ border: "none", borderTop: "1px dashed black", margin: "4px 0" }} />

            {/* 💡 Cetak item x jumlah dan harga total per item */}
            {order.items.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{item.name} x{item.quantity}</span>
                <span>Rp {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}

            <hr style={{ border: "none", borderTop: "1px dashed black", margin: "4px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
              <span>Total</span>
              <span>Rp {order.total.toLocaleString()}</span>
            </div>
            <hr style={{ border: "none", borderTop: "1px dashed black", margin: "4px 0" }} />
            <div style={{ textAlign: "center" }}>-- Terima Kasih --</div>
          </div>
        </div>
      ))}
    </div>
  );
}
