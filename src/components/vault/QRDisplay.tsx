import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, Copy, Check, Download } from 'lucide-react';
import { toast } from 'sonner';
interface QRDisplayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  username?: string;
  secret: string;
}
export function QRDisplay({ isOpen, onClose, title, username, secret }: QRDisplayProps) {
  const [copied, setCopied] = React.useState(false);
  // Construct standard otpauth:// URI
  const issuer = encodeURIComponent("Sentinel:" + title);
  const account = encodeURIComponent(username || "User");
  const otpauthUri = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}`;
  const handleCopy = () => {
    navigator.clipboard.writeText(otpauthUri);
    setCopied(true);
    toast.success("URI copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <DialogTitle>2FA Portability QR</DialogTitle>
          <DialogDescription>
            Scan this with another authenticator app to sync this 2FA token.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-6 gap-6">
          <div className="p-4 bg-white rounded-2xl shadow-inner border">
            <QRCodeSVG 
              value={otpauthUri} 
              size={220} 
              level="H" 
              includeMargin={true}
              imageSettings={{
                src: "https://raw.githubusercontent.com/lucide-react/lucide/main/icons/shield.svg",
                x: undefined,
                y: undefined,
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>
          <div className="w-full space-y-3">
            <div className="text-center">
              <p className="text-sm font-bold">{title}</p>
              <p className="text-xs text-muted-foreground">{username || 'No Account'}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="w-full gap-2" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                Copy otpauth URI
              </Button>
              <p className="text-[10px] text-center text-muted-foreground px-4">
                This QR code contains your plaintext 2FA secret. Keep it private.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}