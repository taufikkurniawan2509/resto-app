'use client';
import { useRef } from 'react';

export default function PrintDemo() {
  const strukRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const el = strukRef.current;

    console.log("🎯 Found struk element kah?", !!el);
    console.log("HTML:", el?.innerHTML);


    if (el) {
      html2pdf()
        .set({
          margin: 5,
          filename: 'struk-demo.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a7', orientation: 'portrait' },
        })
        .from(el)
        .save();
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h2>🧾 Cetak Struk Demo</h2>
      <button onClick={handlePrint}>Cetak Struk</button>

      {/* STRUK */}
      <div
        ref={strukRef}
        style={{
          width: '220px',
          padding: '10px',
          background: 'white',
          color: 'black',
          fontFamily: 'monospace',
          fontSize: '10px',
          lineHeight: '1.4',
          border: '1px solid gray',  // biar kelihatan
        }}
      >
        <div style={{ textAlign: 'center', fontWeight: 'bold' }}>☕ Resto Cinta</div>
        <div style={{ textAlign: 'center' }}>Jl. Mawar No. 99</div>
        <div style={{ textAlign: 'center' }}>0812-xxxx-xxxx</div>
        <hr />
        <div>Order #: ABC123</div>
        <div>04 Juli 2025, 17:45</div>
        <hr />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Kopi</span>
          <span>Rp 15.000</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Teh</span>
          <span>Rp 10.000</span>
        </div>
        <hr />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
          <span>Total</span>
          <span>Rp 25.000</span>
        </div>
        <hr />
        <div style={{ textAlign: 'center' }}>-- Terima Kasih --</div>
      </div>
    </div>
  );
}
