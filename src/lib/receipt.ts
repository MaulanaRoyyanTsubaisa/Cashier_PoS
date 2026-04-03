import { formatRupiah } from '@/lib/store';

export interface ReceiptData {
  created_at: string;
  total: number;
  paid: number;
  change: number;
  details: { product_name: string; quantity: number; price: number }[];
}

export function generateReceiptHTML(data: ReceiptData) {
  return `<html><head><title>Struk</title><style>
    body{font-family:monospace;font-size:12px;width:280px;margin:0 auto;padding:16px}
    h2{text-align:center;margin:0 0 8px}
    hr{border:none;border-top:1px dashed #000;margin:8px 0}
    .row{display:flex;justify-content:space-between}
  </style></head><body>
    <h2>KasirKu</h2>
    <p style="text-align:center;font-size:10px">${new Date(data.created_at).toLocaleString('id-ID')}</p>
    <hr/>
    ${data.details.map(d => `<div><div>${d.product_name}</div><div class="row"><span>${d.quantity} x ${formatRupiah(Number(d.price))}</span><span>${formatRupiah(d.quantity * Number(d.price))}</span></div></div>`).join('')}
    <hr/>
    <div class="row"><strong>Total</strong><strong>${formatRupiah(Number(data.total))}</strong></div>
    <div class="row"><span>Bayar</span><span>${formatRupiah(Number(data.paid))}</span></div>
    <div class="row"><span>Kembalian</span><span>${formatRupiah(Number(data.change))}</span></div>
    <hr/>
    <p style="text-align:center">Terima kasih!</p>
  </body></html>`;
}

export function printReceipt(data: ReceiptData) {
  if ((window as any).electronAPI?.silentPrint) {
    (window as any).electronAPI.silentPrint(generateReceiptHTML(data));
  } else {
    const html = generateReceiptHTML(data);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0;border:none';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 200);
    };
  }
}
