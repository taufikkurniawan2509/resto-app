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

    const win = window.open('', 'strukWindow', 'width=300,height=600');
    if (!win) return;
    win.document.write(`
      <html><head><title>Struk - Karis Jaya Shop</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          padding: 10px;
          color: #000;
          background: #fff;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .item { margin-bottom: 6px; }
        .right { text-align: right; }
        .line { text-align: center; }
      </style></head>
      <body onload="window.print()">
        <script>window.onafterprint = () => window.close();</script>
        ${el.innerHTML.replaceAll('<hr />', '<div class="line">----------------------------------------</div>')}
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
    const newWindow = window.open('', 'strukWindow', 'width=300,height=600');
    if (!newWindow) return;

    newWindow.document.write(`
      <html><head><title>Struk - Karis Jaya Shop</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 10px;
          padding: 10px;
          color: #000;
          background: #fff;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .item { margin-bottom: 6px; }
        .right { text-align: right; }
        .line { text-align: center; }
      </style></head>
      <body onload="window.print()">
        <script>window.onafterprint = () => window.close();</script>
        ${strukHTML.replaceAll('<hr />', '<div class="line">----------------------------------------</div>')}
      </body></html>
    `);
    newWindow.document.close();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-rose-600 text-center">🧾 Admin - Daftar Order</h1>

      {orders.map((order) => {
        const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
        return (
          <div key={order.id} className="border rounded-xl p-4 mb-6 bg-white shadow">
            <div id={`struk-${order.id}`} className="printable">
              <div className="center bold">Karis Jaya Shop</div>
              <div className="center">Jl. Dr. Ir. H. Soekarno No.19, Medokan Semampir</div>
              <div className="center">Surabaya</div>
              <div className="center">No. Telp 0812345678</div>
              <hr />
              <div className="flex justify-between text-xs">
                <div>
                  {new Date(order.created_at).toLocaleDateString()}<br />
                  {new Date(order.created_at).toLocaleTimeString()}
                </div>
                <div>
                  kasir<br />
                  Sheila
                </div>
              </div>
              <div className="text-xs mt-1">No. Nota: ORD-{order.id.slice(0, 8).toUpperCase()}</div>
              {order.table_number && (
                <div className="text-xs">No. Meja: {order.table_number}</div>
              )}
              <hr />
              <div className="text-sm mt-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="item">
                    <div className="bold">{idx + 1}. {item.name}</div>
                    <div className="flex justify-between">
                      <div>{item.quantity} x Rp {item.price.toLocaleString()}</div>
                      <div>Rp {(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
              <hr />
              <div className="text-sm">
                Total QTY : {totalQty}<br />
                Sub Total : Rp {order.total.toLocaleString()}<br />
                <span className="bold">Total : Rp {order.total.toLocaleString()}</span><br />
              </div>
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
        );
      })}
    </div>
  );
}
