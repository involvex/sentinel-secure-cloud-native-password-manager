import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Zap, Globe, Github, ArrowRight, User, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/auth-store';
import { deriveMasterKey } from '@/lib/crypto-utils';
export function HomePage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [step, setStep] = useState<'hero' | 'auth'>('hero');
  const [profileName, setProfileName] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const handleEnterVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    setIsUnlocking(true);
    try {
      // For the demo landing page, we derive a mock key to satisfy the AuthGuard
      const salt = "demo-salt-sentinel";
      const masterKey = await deriveMasterKey("demo-password", salt);
      setAuth({ 
        id: crypto.randomUUID(), 
        name: profileName.trim(), 
        salt 
      }, masterKey);
      // Simulate UI delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } catch (err) {
      console.error("Auth derivation failed", err);
    } finally {
      setIsUnlocking(false);
    }
  };
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-primary/30 selection:text-primary">
      <ThemeToggle />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-500/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: '1s' }} />
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col justify-center py-16 md:py-24">
          <AnimatePresence mode="wait">
            {step === 'hero' ? (
              <motion.div
                key="hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
                  <Shield className="w-4 h-4" />
                  <span>Military-Grade Zero Knowledge Encryption</span>
                </div>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight mb-8 text-balance leading-tight">
                  Secure your <span className="text-gradient">digital life</span> with Sentinel.
                </h1>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    size="lg"
                    className="h-14 px-8 text-lg btn-gradient group"
                    onClick={() => setStep('auth')}
                  >
                    Open Vault <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2" onClick={() => window.open('https://github.com', '_blank')}>
                    <Github className="mr-2 w-5 h-5" /> View Source
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="auth"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="max-w-md mx-auto w-full"
              >
                <div className="p-8 rounded-3xl bg-secondary/30 backdrop-blur-xl border border-border/50 shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 mx-auto shadow-lg shadow-primary/30">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-center mb-2">Welcome Back</h2>
                    <p className="text-muted-foreground text-center mb-8 text-sm">Enter your profile to unlock your encrypted vault.</p>
                    <form onSubmit={handleEnterVault} className="space-y-4">
                      <div className="space-y-2">
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Profile Name (e.g. Master)"
                            className="h-12 pl-10 bg-background/50"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            required
                            disabled={isUnlocking}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="Master Password"
                            className="h-12 pl-10 bg-background/50"
                            defaultValue="demo-mode"
                            disabled={isUnlocking}
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-12 btn-gradient font-bold"
                        disabled={!profileName || isUnlocking}
                      >
                        {isUnlocking ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Decrypting Vault...
                          </>
                        ) : (
                          'Unlock Vault'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={() => setStep('hero')}
                        disabled={isUnlocking}
                      >
                        Back
                      </Button>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {step === 'hero' && (
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 py-20"
            >
              {[
                { icon: Lock, title: "Zero Knowledge", desc: "Data is encrypted locally before it leaves your device. We never see your keys." },
                { icon: Zap, title: "Edge Performance", desc: "Sub-millisecond access via Cloudflare Workers and Durable Objects globally." },
                { icon: Globe, title: "Unified Sync", desc: "Seamless synchronization across all devices with distributed consistency." }
              ].map((feature, i) => (
                <motion.div key={i} variants={item} className="p-8 rounded-3xl bg-secondary/30 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all group">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}