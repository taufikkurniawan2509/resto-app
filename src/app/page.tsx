'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category: string; // ✅ tambahkan kategori di interface
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: string;
  created_at: string;
  invoice_url?: string;
  table_number?: number;
}

export default function Home() {
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paidOrderMode, setPaidOrderMode] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | ''>('');

  // Cek apakah ada parameter ?paid_order untuk mode struk
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paidOrderId = params.get('paid_order');
    if (paidOrderId) {
      setPaidOrderMode(true);
      supabase
        .from('orders')
        .select('*')
        .eq('id', paidOrderId)
        .single()
        .then(({ data, error }) => {
          if (error || !data) return;
          if (data.status === 'Sudah Bayar') {
            setPaymentSuccess(true);
            setLastOrder(data);
            setSuccessMessage('✅ Pembayaran kamu berhasil!');
          }
        });
    }
  }, []);

  // Load data menu dari Supabase
  useEffect(() => {
    if (paidOrderMode) return;
    supabase
      .from('menu')
      .select('*')
      .then(({ data }) => {
        if (data) {
          console.log('📦 Menu loaded:', data);
          setMenuList(data);
        }
      });
  }, [paidOrderMode]);

  // Tambah item ke keranjang
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const found = prev.find(ci => ci.id === item.id);
      if (found) {
        return prev.map(ci =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  // Kurangi jumlah item dari keranjang
  const removeFromCart = (itemId: number) => {
    setCart(prev =>
      prev
        .map(ci =>
          ci.id === itemId ? { ...ci, quantity: ci.quantity - 1 } : ci
        )
        .filter(ci => ci.quantity > 0)
    );
  };

  // Proses checkout dan simpan order ke Supabase
  const handleCheckout = async () => {
    if (!selectedTable) {
      alert('⚠️ Mohon pilih nomor meja terlebih dahulu.');
      return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    console.log('🛒 Checkout initiated. Total:', total);
    console.log('📦 Items:', cart);
    console.log('🪑 Meja:', selectedTable);

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        items: cart,
        total,
        status: 'Pending',
        table_number: selectedTable
      }])
      .select();

    if (error || !data?.[0]) {
      alert('❌ Gagal simpan order: ' + error?.message);
      return;
    }

    const insertedOrder = data[0];

    await supabase
      .from('orders')
      .update({ external_id: insertedOrder.id })
      .eq('id', insertedOrder.id);

    const invoiceRes = await fetch('/api/create-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: insertedOrder.id,
        amount: insertedOrder.total,
      }),
    });

    const invoiceData = await invoiceRes.json();

    if (invoiceData.invoice_url) {
      await supabase
        .from('orders')
        .update({ invoice_url: invoiceData.invoice_url })
        .eq('id', insertedOrder.id);

      insertedOrder.invoice_url = invoiceData.invoice_url;
    }

    setCart([]);
    setSelectedTable('');
    setLastOrder(insertedOrder);
    setSuccessMessage('🎉 Pesanan kamu berhasil dan sudah tersimpan!');
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-rose-600 mb-6">
        Daftar Menu Resto 🍽️
      </h1>

      {/* Notifikasi sukses */}
      {successMessage && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          {successMessage}
        </div>
      )}

      {/* STRUK ORDER */}
      {lastOrder && (
        <div className="mt-6 mb-6 border rounded-lg p-4 bg-white shadow">
          <h3 className="text-xl font-bold text-rose-600 mb-2">🧾 Struk Pesanan</h3>
          <p className="text-sm text-gray-500 mb-2">
            ID: {lastOrder.id} | Waktu: {new Date(lastOrder.created_at).toLocaleString()}
          </p>
          {lastOrder.table_number && (
            <p className="text-sm text-gray-600 mb-3">🪑 Meja: {lastOrder.table_number}</p>
          )}
          <ul className="list-disc pl-5 space-y-1 mb-2">
            {[...lastOrder.items]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((item, idx) => (
                <li key={idx}>
                  {item.name} x{item.quantity} – Rp {(item.price * item.quantity).toLocaleString()}
                </li>
              ))}
          </ul>
          <p className="font-semibold">Total: Rp {lastOrder.total.toLocaleString()}</p>

          {!paymentSuccess && lastOrder.invoice_url && (
            <div className="mt-4 text-center">
              <a
                href={lastOrder.invoice_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                💳 Bayar Sekarang
              </a>
            </div>
          )}
        </div>
      )}

      {/* TOMBOL KEMBALI */}
      {paidOrderMode && (
        <div className="text-center mt-6">
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            🔙 Kembali ke Menu
          </button>
        </div>
      )}

      {/* FORM ORDER */}
      {!paidOrderMode && (
        <>
          {/* PILIH MEJA */}
          <div className="mb-6 border rounded-xl p-4 bg-gray-50">
            <label className="block mb-2 font-semibold">🪑 Pilih Nomor Meja</label>
            <select
              className="border px-3 py-2 rounded w-full"
              value={selectedTable}
              onChange={(e) => setSelectedTable(Number(e.target.value))}
            >
              <option value="">-- Pilih Meja --</option>
              {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>Meja {num}</option>
              ))}
            </select>
          </div>

          {/* KERANJANG */}
          <div className="mb-6 border rounded-xl p-4 bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">🛒 Keranjang</h2>
            {cart.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada pesanan</p>
            ) : (
              <>
                <ul className="list-disc pl-5 space-y-1">
                  {cart.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center">
                      <span>
                        {item.name} x{item.quantity} – Rp {(item.price * item.quantity).toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-2 text-sm text-red-500 hover:underline"
                      >
                        Kurangi
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 font-semibold">Total: Rp {total.toLocaleString()}</p>
                <button
                  onClick={handleCheckout}
                  className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Checkout
                </button>
              </>
            )}
          </div>

          {/* MENU PER KATEGORI */}
          {['Makanan', 'Minuman', 'Snack'].map((kategori) => {
            const menuPerKategori = menuList
              .filter((item) => item.category === kategori)
              .sort((a, b) => a.name.localeCompare(b.name));

            if (menuPerKategori.length === 0) return null;

            return (
              <div key={kategori} className="mb-8">
                <h2 className="text-xl font-bold text-rose-600 mb-3">{kategori}</h2>
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {menuPerKategori.map((menu) => (
                    <div
                      key={menu.id}
                      className="border rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition"
                    >
                      <img
                        src={menu.image_url}
                        alt={menu.name}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-4">
                        <h2 className="text-lg font-semibold">{menu.name}</h2>
                        <p className="text-sm text-gray-500">
                          Rp {menu.price.toLocaleString()}
                        </p>
                        <button
                          onClick={() => addToCart(menu)}
                          className="mt-3 bg-rose-500 text-white px-4 py-1 rounded hover:bg-rose-600"
                        >
                          Pesan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
