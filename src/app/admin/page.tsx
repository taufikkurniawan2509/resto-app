// 🧾 Halaman Admin - Daftar Order & Tombol Print Thermal / PDF
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface CartItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: string;
  created_at: string;
  table_number?: number;
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setOrders(data);
      });
  }, []);

  // 🖨️ Cetak PDF
  const handlePrintPDF = (order: Order) => {
    console.log('🖨️ (PDF) Mencetak:', order.id);
    const el = document.getElementById(`struk-${order.id}`);
    if (!el) return;

    const win = window.open('', '', 'width=300,height=600');
    if (!win) return;
    win.document.write(`
      <html><head><title>Struk</title>
      <style>
        body { font-size: 10px; padding: 10px; }
      </style></head>
      <body onload="window.print(); window.close();">
      ${el.innerHTML}
      </body></html>
    `);
    win.document.close();
  };

  // 🧾 Cetak langsung ke printer thermal (58mm)
  const handlePrintThermal = (order: Order) => {
    console.log('🧾 (Thermal) Mencetak struk ke printer thermal:', order.id);
    const el = document.getElementById(`struk-${order.id}`);
    if (!el) return;

    const strukHTML = el.innerHTML;
    const newWindow = window.open('', '', 'width=300,height=600');
    if (!newWindow) return;

    newWindow.document.write(`
      <html><head><title>Struk</title>
      <style>
        body { font-size: 10px; padding: 5px; }
      </style></head>
      <body onload="window.print(); window.close()">
        ${strukHTML}
      </body></html>
    `);
    newWindow.document.close();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-rose-600 text-center">🧾 Admin - Daftar Order</h1>

      {orders.map((order) => (
        <div key={order.id} className="border rounded-xl p-4 mb-6 bg-white shadow">
          <div id={`struk-${order.id}`} className="printable">
            <p className="text-xs text-gray-500 mb-1">
              ID: {order.id.slice(0, 8).toUpperCase()} | Waktu: {new Date(order.created_at).toLocaleString()}
            </p>
            {order.table_number && (
              <p className="text-xs text-gray-500">🪑 Meja: {order.table_number}</p>
            )}
            <ul className="text-sm mt-2 mb-2">
              {order.items.map((item, idx) => (
                <li key={idx}>
                  {item.name} x{item.quantity} – Rp {(item.price * item.quantity).toLocaleString()}
                </li>
              ))}
            </ul>
            <p className="font-semibold text-sm">Total: Rp {order.total.toLocaleString()}</p>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => handlePrintPDF(order)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              🖨️ Cetak PDF
            </button>

            <button
              onClick={() => handlePrintThermal(order)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              🧾 Cetak Thermal
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
