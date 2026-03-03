import React, { useState, useCallback, useEffect } from 'react';
import { Copy, RefreshCw, Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
interface GeneratorToolProps {
  onUse?: (password: string) => void;
}
export function GeneratorTool({ onUse }: GeneratorToolProps) {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    numbers: true,
    symbols: true,
  });
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const generate = useCallback(() => {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    let chars = lower;
    if (options.uppercase) chars += upper;
    if (options.numbers) chars += numbers;
    if (options.symbols) chars += symbols;
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    setPassword(result);
  }, [length, options]);
  useEffect(() => {
    generate();
  }, [generate]);
  const copy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success('Password copied');
    setTimeout(() => setCopied(false), 2000);
  };
  const calculateStrength = () => {
    let strength = 0;
    if (password.length > 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };
  const strength = calculateStrength();
  return (
    <div className="space-y-6 p-4">
      <div className="relative group">
        <div className="bg-secondary/50 p-4 rounded-xl font-mono text-xl break-all min-h-[4rem] flex items-center justify-center text-center border border-border group-hover:border-primary/30 transition-colors">
          {password}
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          <Button size="icon" variant="ghost" onClick={generate}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={copy}>
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Label>Length: {length}</Label>
          </div>
          <Slider 
            value={[length]} 
            min={8} 
            max={64} 
            step={1} 
            onValueChange={([v]) => setLength(v)} 
          />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {Object.entries(options).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="capitalize">{key}</Label>
              <Switch 
                checked={value} 
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, [key]: checked }))} 
              />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>Security Strength</span>
          <span className={cn(
            "font-bold",
            strength <= 1 ? "text-destructive" : strength <= 3 ? "text-orange-500" : "text-green-500"
          )}>
            {strength <= 1 ? 'Weak' : strength <= 3 ? 'Good' : 'Exceptional'}
          </span>
        </div>
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden flex gap-1">
          {[1, 2, 3, 4].map((step) => (
            <div 
              key={step}
              className={cn(
                "h-full flex-1 transition-colors",
                step <= strength 
                  ? (strength <= 1 ? "bg-destructive" : strength <= 3 ? "bg-orange-500" : "bg-green-500")
                  : "bg-border"
              )}
            />
          ))}
        </div>
      </div>
      {onUse && (
        <Button className="w-full btn-gradient" onClick={() => onUse(password)}>
          Use This Password
        </Button>
      )}
    </div>
  );
}