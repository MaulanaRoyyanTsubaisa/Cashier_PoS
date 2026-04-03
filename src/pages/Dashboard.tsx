import { useEffect, useState } from 'react';
import { getProducts, getTransactions, formatRupiah, getTodayISO, type Product, type Transaction } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, AlertTriangle, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProducts(), getTransactions()]).then(([p, t]) => {
      setProducts(p);
      setTransactions(t);
      setLoading(false);
    });
  }, []);

  const today = getTodayISO();
  const todayTxs = transactions.filter(t => t.created_at.slice(0, 10) === today);
  const totalSalesToday = todayTxs.reduce((s, t) => s + Number(t.total), 0);
  const txCountToday = todayTxs.length;
  const lowStock = products.filter(p => p.stock < 5);

  // Top 5 products
  const soldMap: Record<string, { name: string; qty: number }> = {};
  transactions.forEach(t => t.details.forEach(d => {
    if (!soldMap[d.product_id]) soldMap[d.product_id] = { name: d.product_name, qty: 0 };
    soldMap[d.product_id].qty += d.quantity;
  }));
  const topProducts = Object.values(soldMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Last 7 days chart
  const chartData: { date: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    const dayTotal = transactions.filter(t => t.created_at.slice(0, 10) === iso).reduce((s, t) => s + Number(t.total), 0);
    chartData.push({ date: dayLabel, total: dayTotal });
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Memuat...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Penjualan Hari Ini" value={formatRupiah(totalSalesToday)} />
        <StatCard icon={ShoppingCart} label="Transaksi Hari Ini" value={String(txCountToday)} />
        <StatCard icon={AlertTriangle} label="Stok Rendah" value={`${lowStock.length} produk`} accent />
        <StatCard icon={TrendingUp} label="Total Produk" value={String(products.length)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm font-medium">Penjualan 7 Hari Terakhir</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatRupiah(v)} />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Produk Terlaris</CardTitle></CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data penjualan</p>
            ) : (
              <ul className="space-y-3">
                {topProducts.map((p, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold">{i + 1}</span>
                      {p.name}
                    </span>
                    <span className="font-medium">{p.qty} terjual</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {lowStock.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-destructive">⚠ Stok Rendah</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStock.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 rounded-md bg-destructive/5 border border-destructive/20 text-sm">
                  <span>{p.name}</span>
                  <span className="font-semibold text-destructive">Sisa: {p.stock}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accent ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
