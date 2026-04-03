import { useState, useEffect, useMemo } from 'react';
import { getTransactions, formatRupiah, getTodayISO, type Transaction } from '@/lib/store';
import { printReceipt } from '@/lib/receipt';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Printer } from 'lucide-react';

export default function Reports() {
  const [dateFrom, setDateFrom] = useState(getTodayISO());
  const [dateTo, setDateTo] = useState(getTodayISO());
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { getTransactions().then(t => { setAllTransactions(t); setLoading(false); }); }, []);

  const transactions = useMemo(() => {
    return allTransactions.filter(t => {
      const d = t.created_at.slice(0, 10);
      return d >= dateFrom && d <= dateTo;
    });
  }, [allTransactions, dateFrom, dateTo]);

  const totalRevenue = transactions.reduce((s, t) => s + Number(t.total), 0);
  const txCount = transactions.length;

  function exportCSV() {
    const rows = [['ID', 'Tanggal', 'Total', 'Bayar', 'Kembalian', 'Detail']];
    transactions.forEach(t => {
      const detail = t.details.map(d => `${d.product_name}x${d.quantity}`).join('; ');
      rows.push([t.id, new Date(t.created_at).toLocaleString('id-ID'), String(t.total), String(t.paid), String(t.change), detail]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-${dateFrom}-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Memuat...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div>
          <label className="text-xs text-muted-foreground">Dari</label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Sampai</label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Pendapatan</p>
            <p className="text-2xl font-bold">{formatRupiah(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Jumlah Transaksi</p>
            <p className="text-2xl font-bold">{txCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Riwayat Transaksi</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Tanggal</th>
                <th className="text-left p-3 font-medium">Item</th>
                <th className="text-right p-3 font-medium">Total</th>
                <th className="text-right p-3 font-medium">Bayar</th>
                <th className="text-right p-3 font-medium">Kembalian</th>
                <th className="p-3 font-medium w-10"></th>
              </tr></thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="p-3 text-muted-foreground whitespace-nowrap">{new Date(t.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="p-3">{t.details.map(d => `${d.product_name} x${d.quantity}`).join(', ')}</td>
                    <td className="p-3 text-right font-medium">{formatRupiah(Number(t.total))}</td>
                    <td className="p-3 text-right">{formatRupiah(Number(t.paid))}</td>
                    <td className="p-3 text-right">{formatRupiah(Number(t.change))}</td>
                    <td className="p-3 text-center">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Cetak ulang struk" onClick={() => printReceipt(t)}>
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Tidak ada transaksi pada periode ini</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
