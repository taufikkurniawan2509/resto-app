'use client';

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const paidOrderId = searchParams.get("paid_order");

  useEffect(() => {
    console.log("🚀 useEffect start");
    async function fetchMenu() {
      console.log("📦 Fetching menu...");
      const { data, error } = await supabase.from("menu").select("*");
      if (!error && data) {
        console.log("✅ Menu fetched:", data);
        setMenuList(data);
      } else {
        console.error("❌ Error fetching menu:", error);
      }
    }

    async function fetchPaidOrder() {
      if (paidOrderId) {
        console.log("🔎 paid_order param found:", paidOrderId);
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", paidOrderId)
          .single();

        if (!error && data) {
          console.log("✅ Fetched paid order:", data);
          setSuccessMessage("✅ Pembayaran kamu berhasil!");
          setLastOrder(data);
        } else {
          console.error("❌ Error fetching paid order:", error);
        }
      }
    }

    fetchMenu();
    fetchPaidOrder();
  }, [paidOrderId]);

  const addToCart = (item: MenuItem) => {
    console.log("➕ Adding to cart:", item);
    setCart([...cart, item]);
  };

  const handleRemoveItem = (index: number) => {
    console.log("🗑️ Removing item from cart index:", index);
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const handleCheckout = async () => {
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    console.log("💰 Total checkout:", total);

    const { data, error } = await supabase
      .from("orders")
      .insert([{ items: cart, total, status: "Pending" }])
      .select();

    if (error || !data?.[0]) {
      alert("❌ Gagal simpan order: " + error?.message);
      console.error("❌ Error inserting order:", error);
      return;
    }

    const insertedOrder = data[0];
    console.log("📝 Order inserted:", insertedOrder);

    const { error: updateError } = await supabase
      .from("orders")
      .update({ external_id: insertedOrder.id })
      .eq("id", insertedOrder.id);

    if (updateError) {
      alert("⚠️ Gagal update external_id: " + updateError.message);
      console.error("⚠️ Error updating external_id:", updateError);
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
    console.log("🧾 Invoice response:", invoiceData);

    if (invoiceData.invoice_url) {
      await supabase
        .from("orders")
        .update({ invoice_url: invoiceData.invoice_url })
        .eq("id", insertedOrder.id);

      console.log("➡️ Redirecting to invoice...");
      window.location.href = invoiceData.invoice_url;
    } else {
      alert("❌ Gagal membuat invoice.");
      console.error("❌ Invoice creation failed:", invoiceData);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-rose-600 mb-6">
        Daftar Menu Resto 🍽️
      </h1>

      {/* ✅ Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          {successMessage}
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
        </div>
      )}

      {/* ✅ Keranjang */}
      {!paidOrderId && (
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
              {!paidOrderId && (
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
