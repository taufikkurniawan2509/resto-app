import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { order_id, amount } = await req.json();
    const XENDIT_API_KEY = process.env.XENDIT_API_KEY;

    if (!XENDIT_API_KEY) {
      console.error("❌ XENDIT_API_KEY not found");
      return NextResponse.json({ error: "API key not set" }, { status: 500 });
    }

    const authHeader = `Basic ${Buffer.from(XENDIT_API_KEY + ":").toString("base64")}`;

    const response = await fetch("https://api.xendit.co/qr_codes", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_id: order_id,
        type: "DYNAMIC",
        amount: amount,
        currency: "IDR",
        callback_url: process.env.XENDIT_CALLBACK_URL, // ✅ ini WAJIB!
        }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Xendit error:", result);
      return NextResponse.json({ error: result }, { status: 500 });
    }

    return NextResponse.json({
      qr_string: result.qr_string,
      qr_code_id: result.id,
    });
  } catch (err: any) {
    console.error("❌ Unexpected Error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
