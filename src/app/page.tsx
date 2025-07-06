'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface MenuItem {
  id: number;
  name: string;
  price: number;
  image_url: string;
}

export default function Home() {
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<MenuItem[]>([]);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isPaid, setIsPaid] = useState(false);

  // ✅ Flow 1: Cek apakah URL mengandung ?paid_order
  useEffect(() => {
    const query = window.location.search;
    console.log("🔍 Query param:", query);

    if (query.includes("paid_order=")) {
      const orderId = query.split("paid_order=")[1];
      console.log("✅ Ditemukan paid_order:", orderId);
      setIsPaid(true);
      fetchPaidOrder(orderId);
    } else {
      console.log("ℹ️ Tidak ada paid_order di URL. Menampilkan menu normal");
      fetchMenu();
    }
  }, []);

  // ✅ Flow 2: Fetch menu dari supabase
  const fetchMenu = async () => {
    console.log("📦 Memuat daftar menu...");
    const { data, error } = await supabase.from("menu").select("*");
    if (!error && data) {
      setMenuList(data);
      console.log("✅ Menu berhasil dimuat:", data);
    } else {
      console.error("❌ Gagal load menu:", error);
    }
  };

  // ✅ Flow 3: Tambah ke keranjang
  const addToCart = (item: MenuItem) => {
    console.log("➕ Tambah ke keranjang:", item);
    setCart([...cart, item]);
  };

  // ✅ Flow 4: Hapus item dari keranjang
  const handleRemoveItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  // ✅ Flow 5: Checkout
  const handleCheckout = async () => {
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    console.log("💳 Checkout dengan total:", total);

    const { data, error } = await supabase
      .from("orders")
      .insert([{ items: cart, total: total, status: "Pending" }])
      .select();

    if (error || !data?.[0]) {
      alert("❌ Gagal simpan order: " + error?.message);
      return;
    }

    const insertedOrder = data[0];

    const { error: updateError } = await supabase
      .from("orders")
      .update({ external_id: insertedOrder.id })
      .eq("id", insertedOrder.id);

    if (updateError) {
      alert("⚠️ Gagal update external_id: " + updateError.message);
      return;
    }

    const invoiceRes = await fetch("/api/create-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: insertedOrder.id,
        amount: insertedOrder.total,
      }),
    });

    const invoiceData = await invoiceRes.json();

    if (invoiceData.invoice_url) {
      await supabase
        .from("orders")
        .update({ invoice_url: invoiceData.invoice_url })
        .eq("id", insertedOrder.id);

      insertedOrder.invoice_url = invoiceData.invoice_url;
      console.log("✅ Invoice berhasil dibuat:", invoiceData.invoice_url);
    } else {
      console.error("❌ Gagal membuat invoice:", invoiceData);
    }

    setCart([]);
    setSuccessMessage("🎉 Pesanan kamu berhasil dan sudah tersimpan!");
    setLastOrder(insertedOrder);
  };

  // ✅ Flow 6: Jika redirect setelah payment sukses
  const fetchPaidOrder = async (orderId: string) => {
    console.log("🔄 Mengambil data order berdasarkan paid_order:", orderId);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("❌ Gagal fetch order:", error.message);
    } else {
      setLastOrder(data);
      setSuccessMessage("✅ Pembayaran kamu berhasil!");
      console.log("✅ Order setelah pembayaran:", data);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-rose-600 mb-6">
        Daftar Menu Resto 🍽️
      </h1>

      {successMessage && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          ✅ {successMessage}
        </div>
      )}

      {/* ✅ Struk */}
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

          {!isPaid && lastOrder.invoice_url && (
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

      {/* ✅ Keranjang */}
      {!isPaid && (
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
            </>
          )}
          {cart.length > 0 && (
            <button
              onClick={handleCheckout}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Checkout
            </button>
          )}
        </div>
      )}

      {/* ✅ Daftar Menu */}
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
              {!isPaid && (
                <button
                  onClick={() => addToCart(menu)}
                  className="mt-3 bg-rose-500 text-white px-4 py-1 rounded hover:bg-rose-600"
                >
                  Pesan
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
