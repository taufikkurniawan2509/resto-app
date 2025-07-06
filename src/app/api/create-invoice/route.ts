import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { order_id, amount } = await req.json();
    console.log("📨 API Create Invoice dipanggil untuk Order:", order_id);

    const response = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(process.env.XENDIT_API_KEY + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_id: order_id,
        amount,
        currency: "IDR",
        invoice_duration: 3600,
        description: "Pembayaran Resto Cinta",
        success_redirect_url: `https://resto-app-three-roan.vercel.app/?paid_order=${order_id}`,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌  Xendit error:", result);
      return NextResponse.json({ error: result }, { status: 500 });
    }

    console.log("✅  Invoice berhasil dibuat:", result.id);

    return NextResponse.json({
      invoice_url: result.invoice_url,
      invoice_id: result.id,
    });
  } catch (err: any) {
    console.error("🔥  Server Error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
