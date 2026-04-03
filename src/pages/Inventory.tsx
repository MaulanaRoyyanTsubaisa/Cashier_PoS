import { useState, useEffect } from 'react';
import { getProducts, getStockMovements, addStockIn, adjustStock, formatRupiah, type Product, type StockMovement } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PackagePlus, ClipboardCheck } from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stockInOpen, setStockInOpen] = useState(false);
  const [soOpen, setSoOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refresh = async () => {
    const [p, m] = await Promise.all([getProducts(), getStockMovements()]);
    setProducts(p);
    setMovements(m);
  };

  useEffect(() => { refresh().then(() => setLoading(false)); }, []);

  async function handleStockIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await addStockIn(fd.get('productId') as string, Number(fd.get('quantity')), (fd.get('note') as string) || '');
      setStockInOpen(false);
      toast({ title: 'Stok masuk berhasil' });
      await refresh();
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    }
  }

  async function handleSO(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await adjustStock(fd.get('productId') as string, Number(fd.get('actualStock')), (fd.get('note') as string) || '');
      setSoOpen(false);
      toast({ title: 'Stock opname berhasil' });
      await refresh();
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Memuat...</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={() => setStockInOpen(true)}><PackagePlus className="h-4 w-4 mr-1" />Barang Masuk</Button>
        <Button variant="outline" onClick={() => setSoOpen(true)}><ClipboardCheck className="h-4 w-4 mr-1" />Stock Opname</Button>
      </div>

      <Tabs defaultValue="stock">
        <TabsList><TabsTrigger value="stock">Stok Produk</TabsTrigger><TabsTrigger value="history">Riwayat Pergerakan</TabsTrigger></TabsList>

        <TabsContent value="stock">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Produk</th>
                    <th className="text-left p-3 font-medium">Kategori</th>
                    <th className="text-right p-3 font-medium">Stok</th>
                    <th className="text-right p-3 font-medium">Nilai</th>
                  </tr></thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3 text-muted-foreground">{p.category || '-'}</td>
                        <td className={`p-3 text-right font-medium ${p.stock < 5 ? 'text-destructive' : ''}`}>{p.stock}</td>
                        <td className="p-3 text-right">{formatRupiah(p.stock * Number(p.price))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Tanggal</th>
                    <th className="text-left p-3 font-medium">Produk</th>
                    <th className="text-center p-3 font-medium">Tipe</th>
                    <th className="text-right p-3 font-medium">Qty</th>
                    <th className="text-left p-3 font-medium">Catatan</th>
                  </tr></thead>
                  <tbody>
                    {movements.slice(0, 50).map(m => (
                      <tr key={m.id} className="border-b last:border-0">
                        <td className="p-3 text-muted-foreground">{new Date(m.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="p-3 font-medium">{m.product_name}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.type === 'IN' ? 'bg-primary/10 text-primary' : m.type === 'OUT' ? 'bg-destructive/10 text-destructive' : 'bg-accent text-accent-foreground'}`}>
                            {m.type}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium">{m.type === 'IN' ? '+' : ''}{m.quantity}</td>
                        <td className="p-3 text-muted-foreground truncate max-w-[200px]">{m.note}</td>
                      </tr>
                    ))}
                    {movements.length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Belum ada pergerakan stok</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={stockInOpen} onOpenChange={setStockInOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Barang Masuk</DialogTitle></DialogHeader>
          <form onSubmit={handleStockIn} className="space-y-4">
            <div>
              <Label>Produk</Label>
              <Select name="productId" required>
                <SelectTrigger><SelectValue placeholder="Pilih produk" /></SelectTrigger>
                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Jumlah</Label><Input name="quantity" type="number" required min={1} /></div>
            <div><Label>Catatan (Supplier, dll)</Label><Input name="note" placeholder="Opsional" /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setStockInOpen(false)}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={soOpen} onOpenChange={setSoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Stock Opname</DialogTitle></DialogHeader>
          <form onSubmit={handleSO} className="space-y-4">
            <div>
              <Label>Produk</Label>
              <Select name="productId" required>
                <SelectTrigger><SelectValue placeholder="Pilih produk" /></SelectTrigger>
                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (Sistem: {p.stock})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Stok Aktual</Label><Input name="actualStock" type="number" required min={0} /></div>
            <div><Label>Catatan</Label><Input name="note" placeholder="Opsional" /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSoOpen(false)}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
