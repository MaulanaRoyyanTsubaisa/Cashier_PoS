import { useState, useMemo, useRef, useEffect } from 'react';
import { getProducts, saveTransaction, formatRupiah, type Product } from '@/lib/store';
import { printReceipt } from '@/lib/receipt';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Minus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paid, setPaid] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const paidRef = useRef<HTMLInputElement>(null);

  useEffect(() => { getProducts().then(setProducts); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) && p.stock > 0);
  }, [products, search]);

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const paidNum = Number(paid) || 0;
  const change = paidNum - total;

  function addToCart(p: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.productId === p.id);
      if (existing) {
        if (existing.quantity >= p.stock) return prev;
        return prev.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: p.id, productName: p.name, price: Number(p.price), quantity: 1, maxStock: p.stock }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart(prev => prev.map(i => {
      if (i.productId !== productId) return i;
      const newQty = Math.max(1, Math.min(i.maxStock, i.quantity + delta));
      return { ...i, quantity: newQty };
    }));
  }

  function removeItem(productId: string) {
    setCart(prev => prev.filter(i => i.productId !== productId));
  }

  async function handlePay() {
    if (cart.length === 0) { toast({ title: 'Keranjang kosong', variant: 'destructive' }); return; }
    if (paidNum < total) { toast({ title: 'Pembayaran kurang', variant: 'destructive' }); return; }

    setProcessing(true);
    try {
      const tx = await saveTransaction(
        cart.map(c => ({ productId: c.productId, productName: c.productName, quantity: c.quantity, price: c.price })),
        paidNum
      );
      setCart([]);
      setPaid('');
      toast({ title: 'Transaksi berhasil!' });
      // Auto print immediately — no dialog
      printReceipt(tx);
      // Refresh products
      const updated = await getProducts();
      setProducts(updated);
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-7rem)]">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari produk..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} autoFocus />
        </div>
        <div className="flex-1 overflow-y-auto pos-scrollbar grid grid-cols-2 sm:grid-cols-3 gap-2 content-start">
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="text-left p-3 rounded-lg border bg-card hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <p className="font-medium text-sm truncate">{p.name}</p>
              <p className="text-primary font-semibold text-sm mt-1">{formatRupiah(Number(p.price))}</p>
              <p className="text-xs text-muted-foreground">Stok: {p.stock}</p>
            </button>
          ))}
          {filtered.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">Tidak ada produk</p>}
        </div>
      </div>

      <Card className="w-full lg:w-96 flex flex-col shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Keranjang ({cart.length})</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 p-4 pt-0">
          <div className="flex-1 overflow-y-auto pos-scrollbar space-y-2">
            {cart.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Tambahkan produk</p>}
            {cart.map(item => (
              <div key={item.productId} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">{formatRupiah(item.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, -1)}><Minus className="h-3 w-3" /></Button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.productId, 1)}><Plus className="h-3 w-3" /></Button>
                </div>
                <span className="text-sm font-semibold w-20 text-right">{formatRupiah(item.price * item.quantity)}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeItem(item.productId)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 mt-3 space-y-3">
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatRupiah(total)}</span>
            </div>
            <div>
              <Input
                ref={paidRef}
                type="number"
                placeholder="Jumlah bayar..."
                value={paid}
                onChange={e => setPaid(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePay()}
              />
            </div>
            {paidNum > 0 && paidNum >= total && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kembalian</span>
                <span className="font-semibold text-primary">{formatRupiah(change)}</span>
              </div>
            )}
            <Button className="w-full" size="lg" onClick={handlePay} disabled={cart.length === 0 || paidNum < total || processing}>
              {processing ? 'Memproses...' : 'Bayar'}
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
