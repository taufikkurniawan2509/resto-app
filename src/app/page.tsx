'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  image_url: string;
}

interface Order {
  id: string;
  items: MenuItem[];
  total: number;
  status: string;
  created_at: string;
  invoice_url?: string;
}

export default function Home() {
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<MenuItem[]>([]);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // 1. Cek apakah ada paid_order di URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paidOrderId = params.get('paid_order');
    console.log('🔍 URL Parameter: paid_order =', paidOrderId);

    if (paidOrderId) {
      // 2. Jika ada, cek ke Supabase statusnya
      console.log('🔁 Mengecek status order ke Supabase...');
      supabase
        .from('orders')
        .select('*')
        .eq('id', paidOrderId)
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            console.error('❌ Gagal mengambil order:', error);
            return;
          }

          console.log('📦 Order ditemukan:', data);
          if (data.status === 'Sudah Bayar') {
            console.log('✅ Order sudah dibayar, menampilkan notifikasi dan struk');
            setLastOrder(data);
            setPaymentSuccess(true);
            setSuccessMessage('✅ Pembayaran kamu berhasil!');
          } else {
            console.log('⏳ Order belum dibayar');
          }
        });
    }
  }, []);

  useEffect(() => {
    console.log('📥 Mengambil daftar menu dari Supabase...');
    supabase
      .from('menu')
      .select('*')
      .then(({ data, error }) => {
        if (!error && data) {
          setMenuList(data);
          console.log('✅ Menu berhasil dimuat:', data);
        } else {
          console.error('❌ Gagal mengambil menu:', error);
        }
      });
  }, []);

  const addToCart = (item: MenuItem) => {
    console.log('➕ Menu ditambahkan ke keranjang:', item.name);
    setCart([...cart, item]);
  };

  const handleRemoveItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
    console.log('🗑️ Item dihapus dari keranjang, index:', index);
  };

  const handleCheckout = async () => {
    const total = cart.reduce((sum, item) => sum + item.price, 0);

    console.log('🧾 Memulai proses checkout...');

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          items: cart,
          total,
          status: 'Pending',
        },
      ])
      .select();

    if (error || !data?.[0]) {
      alert('❌ Gagal simpan order: ' + error?.message);
      return;
    }

    const insertedOrder = data[0];
    console.log('✅ Order berhasil disimpan:', insertedOrder.id);

    const { error: updateError } = await supabase
      .from('orders')
      .update({ external_id: insertedOrder.id })
      .eq('id', insertedOrder.id);

    if (updateError) {
      alert('⚠️ Gagal update external_id: ' + updateError.message);
      return;
    }

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
    setLastOrder(insertedOrder);
    setSuccessMessage('🎉 Pesanan kamu berhasil dan sudah tersimpan!');
    console.log('🧾 Struk ditampilkan dan keranjang dikosongkan');
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-rose-600 mb-6">
        Daftar Menu Resto 🍽️
      </h1>

      {successMessage && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          {successMessage}
        </div>
      )}

      {lastOrder && (
        <div className="mt-6 mb-6 border rounded-lg p-4 bg-white shadow">
          <h3 className="text-xl font-bold text-rose-600 mb-2">🧾 Struk Pesanan</h3>
          <p className="text-sm text-gray-500 mb-3">
            ID: {lastOrder.id} | Waktu: {new Date(lastOrder.created_at).toLocaleString()}
          </p>
          <ul className="list-disc pl-5 space-y-1 mb-2">
            {lastOrder.items.map((item: any, idx: number) => (
              <li key={idx}>
                {item.name} – Rp {item.price.toLocaleString()}
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
              <p className="text-xs mt-2 text-gray-500">
                Klik untuk bayar via OVO, DANA, ShopeePay, dll
              </p>
            </div>
          )}
        </div>
      )}

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
                    {item.name} – Rp {item.price.toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleRemoveItem(idx)}
                    className="ml-2 text-sm text-red-500 hover:underline"
                  >
                    Hapus
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

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {menuList.map((menu) => (
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
}
