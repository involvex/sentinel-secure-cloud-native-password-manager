import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, KeyRound, Loader2, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { deriveMasterKey, encryptData, generateSalt, hashPassword } from '@/lib/crypto-utils';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const handleAuth = async (mode: 'login' | 'signup') => {
    if (!formData.username || !formData.password) return;
    setIsLoading(true);
    try {
      if (mode === 'signup') {
        const salt = generateSalt();
        const masterKey = await deriveMasterKey(formData.password, salt);
        const passwordHash = await hashPassword(formData.password, salt);
        const user = await api<any>('/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ username: formData.username, passwordHash, salt })
        });
        setAuth(user, masterKey);
        toast.success('Account created! Your vault is ready.');
      } else {
        // First get the user salt
        const users = await api<any[]>('/api/users');
        const userMatch = users.find(u => u.name === formData.username);
        if (!userMatch) throw new Error('User not found');
        const masterKey = await deriveMasterKey(formData.password, userMatch.salt);
        const passwordHash = await hashPassword(formData.password, userMatch.salt);
        const user = await api<any>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username: formData.username, passwordHash })
        });
        setAuth(user, masterKey);
        toast.success('Vault unlocked');
      }
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-12 md:py-20 lg:py-24 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/80">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold tracking-tight">Sentinel Vault</CardTitle>
              <CardDescription>Military-grade zero-knowledge encryption</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Signup</TabsTrigger>
                </TabsList>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="username"
                        placeholder="john_doe"
                        className="pl-10"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Master Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <TabsContent value="login" className="mt-6">
                  <Button 
                    className="w-full h-11 btn-gradient font-bold" 
                    onClick={() => handleAuth('login')}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
                    Unlock Vault
                  </Button>
                </TabsContent>
                <TabsContent value="signup" className="mt-6">
                  <Alert className="mb-4 bg-primary/5 border-primary/20">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-xs font-bold">Important</AlertTitle>
                    <AlertDescription className="text-[10px]">
                      Sentinel is zero-knowledge. If you lose your Master Password, your data cannot be recovered. We do not store your password.
                    </AlertDescription>
                  </Alert>
                  <Button 
                    className="w-full h-11 btn-gradient font-bold" 
                    onClick={() => handleAuth('signup')}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                    Create Encrypted Vault
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center border-t py-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                AES-256-GCM + PBKDF2 Enabled
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}