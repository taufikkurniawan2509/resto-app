'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Order {
  id: string;
  items: { name: string; price: number }[];
  total: number;
  created_at: string;
  status: string;
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setOrders(data);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (!error) {
      console.log("✅ Status berhasil diubah ke", newStatus);
    }
  };

  const handlePrint = async (order: Order) => {
    const html2pdf = (await import("html2pdf.js")).default;
    const element = document.getElementById(`struk-${order.id}`);

    if (element) {
      console.log("📦 Isi Element:", element.innerHTML);

      // Delay supaya elemen terdeteksi sempurna
      setTimeout(() => {
        html2pdf()
          .set({
            margin: 5,
            filename: `struk-${order.id}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: "mm", format: "a7", orientation: "portrait" },
          })
          .from(element)
          .save();
      }, 100);
    }
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
                {item.name} – Rp {item.price.toLocaleString()}
              </li>
            ))}
          </ul>
          <p className="font-semibold text-rose-600">
            Total: Rp {order.total.toLocaleString()}
          </p>
          <p className="text-sm">Status: {order.status}</p>

          <div className="flex gap-2 mt-2">
            {["Pending", "Proses", "Selesai"].map((s) => (
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

          {/* STRUK TEMPLATE */}
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
              border: "1px solid gray",
              marginTop: "20px", // ⬅️ tampilkan dulu, nanti bisa disembunyikan pakai CSS
            }}
          >
            <div style={{ textAlign: "center", fontWeight: "bold" }}>☕ Resto Cinta</div>
            <div style={{ textAlign: "center" }}>Jl. Mawar No. 99</div>
            <div style={{ textAlign: "center" }}>0812-xxxx-xxxx</div>
            <hr style={{ border: "none", borderTop: "1px dashed black", margin: "4px 0" }} />
            <div>Order #: {order.id.slice(0, 6).toUpperCase()}</div>
            <div>{new Date(order.created_at).toLocaleString()}</div>
            <hr style={{ border: "none", borderTop: "1px dashed black", margin: "4px 0" }} />
            {order.items.map((item, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{item.name}</span>
                <span>Rp {item.price.toLocaleString()}</span>
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
