import { useState, useMemo, useEffect } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct, formatRupiah, type Product } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refresh = () => getProducts().then(setProducts);

  useEffect(() => { getProducts().then(p => { setProducts(p); setLoading(false); }); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q));
  }, [products, search]);

  function openAdd() { setEditing(null); setModalOpen(true); }
  function openEdit(p: Product) { setEditing(p); setModalOpen(true); }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get('name') as string,
      price: Number(fd.get('price')),
      stock: Number(fd.get('stock')),
      category: (fd.get('category') as string) || '',
    };
    try {
      if (editing) {
        await updateProduct(editing.id, data);
        toast({ title: 'Produk diperbarui' });
      } else {
        await addProduct(data);
        toast({ title: 'Produk ditambahkan' });
      }
      setModalOpen(false);
      await refresh();
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus produk ini?')) return;
    try {
      await deleteProduct(id);
      toast({ title: 'Produk dihapus' });
      await refresh();
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Memuat...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari produk..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Tambah Produk</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Nama</th>
                  <th className="text-left p-3 font-medium">Kategori</th>
                  <th className="text-right p-3 font-medium">Harga</th>
                  <th className="text-right p-3 font-medium">Stok</th>
                  <th className="text-right p-3 font-medium w-24">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-muted-foreground">{p.category || '-'}</td>
                    <td className="p-3 text-right">{formatRupiah(Number(p.price))}</td>
                    <td className={`p-3 text-right font-medium ${p.stock < 5 ? 'text-destructive' : ''}`}>{p.stock}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Tidak ada produk ditemukan</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Nama Produk</Label><Input name="name" required defaultValue={editing?.name ?? ''} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Harga (Rp)</Label><Input name="price" type="number" required min={0} defaultValue={editing?.price ?? ''} /></div>
              <div><Label>Stok</Label><Input name="stock" type="number" required min={0} defaultValue={editing?.stock ?? ''} /></div>
            </div>
            <div><Label>Kategori</Label><Input name="category" defaultValue={editing?.category ?? ''} placeholder="Opsional" /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
              <Button type="submit">{editing ? 'Simpan' : 'Tambah'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
