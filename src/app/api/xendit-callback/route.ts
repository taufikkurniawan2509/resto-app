import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📩 Webhook Masuk dari Xendit:", body);

    const { external_id, status } = body;
    console.log("🔍 Data untuk update:", { external_id, status });
    
    if (status === "PAID") {
      const { error } = await supabase
        .from("orders")
        .update({ status: "Sudah Bayar" })
        .eq("external_id", external_id)
        .eq("status", "Pending");

      if (error) {
        console.error("❌ Gagal update status:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ message: "✅ Status updated to Sudah Bayar" });
    }

    return NextResponse.json({ message: "⚠️ Status bukan PAID, diabaikan" });

  } catch (err: any) {
    console.error("🔥 Error Handler:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
