import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Printer } from 'lucide-react';

export function getAutoPrint(): boolean {
  return localStorage.getItem('kasirku_autoprint') !== 'false';
}

export function setAutoPrint(val: boolean) {
  localStorage.setItem('kasirku_autoprint', val ? 'true' : 'false');
}

export default function Settings() {
  const [autoPrint, setAutoPrintState] = useState(getAutoPrint);

  function handleToggle(checked: boolean) {
    setAutoPrintState(checked);
    setAutoPrint(checked);
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h2 className="text-xl font-bold">Pengaturan</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Cetak Struk
          </CardTitle>
          <CardDescription>Atur perilaku pencetakan struk setelah transaksi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="autoprint" className="flex-1 cursor-pointer">
              <p className="text-sm font-medium">Auto-print struk</p>
              <p className="text-xs text-muted-foreground">Struk otomatis dicetak setelah transaksi selesai</p>
            </Label>
            <Switch id="autoprint" checked={autoPrint} onCheckedChange={handleToggle} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
