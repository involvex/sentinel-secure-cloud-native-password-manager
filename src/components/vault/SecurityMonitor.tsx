import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Zap, Activity, 
  Search, RefreshCw, Info, Lock, Fingerprint, ExternalLink 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { SecurityStats } from '@shared/types';
export function SecurityMonitor() {
  const { data: stats, isLoading, refetch } = useQuery<SecurityStats>({
    queryKey: ['security-stats'],
    queryFn: () => api<SecurityStats>('/api/monitor/summary')
  });
  if (isLoading || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-medium">Analyzing Vault Health...</p>
        </div>
      </div>
    );
  }
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Security Monitor</h1>
          <p className="text-muted-foreground">Comprehensive health overview of your encrypted vault.</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Run Audit
        </Button>
      </div>
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <motion.div variants={item}>
          <Card className="bg-primary/5 border-primary/20 shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Health Score</p>
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold">{stats.healthScore}</span>
                <span className="text-muted-foreground text-sm">/100</span>
              </div>
              <Progress value={stats.healthScore} className="h-1.5 mt-4 bg-primary/20" />
            </CardContent>
          </Card>
        </motion.div>
        {[
          { label: 'Weak Passwords', val: stats.weakCount, icon: ShieldAlert, color: 'text-destructive', bg: 'bg-destructive/5' },
          { label: 'Reused Items', val: stats.reusedCount, icon: RefreshCw, color: 'text-orange-500', bg: 'bg-orange-500/5' },
          { label: 'Breach Alerts', val: stats.breachedCount, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-500/5' },
          { label: '2FA Coverage', val: `${stats.twoFactorPercentage}%`, icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/5' }
        ].map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card className="shadow-none border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className={`text-3xl font-extrabold ${stat.color}`}>{stat.val}</div>
                <p className="text-[10px] text-muted-foreground mt-2 font-medium">Auto-scanned 2m ago</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none bg-secondary/20 shadow-none overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <CardTitle>AI Security Insights</CardTitle>
              </div>
              <CardDescription>Intelligent recommendations based on your unique vault signature.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex gap-4 items-start p-4 rounded-2xl bg-background border border-border/50 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1">Rotate Finance Passwords</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We detected 3 reused passwords across banking institutions. AI recommends unique passphrases to prevent credential stuffing.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start p-4 rounded-2xl bg-background border border-border/50 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Fingerprint className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1">Enable Passkey Support</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    12 of your logins support hardware-based Passkeys. Upgrading will eliminate phishing risks entirely for these accounts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Security Event History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { event: 'New Login Detected', loc: 'San Francisco, US', date: '2 hours ago', icon: Activity },
                  { event: 'Vault Exported', loc: 'This Device', date: 'Yesterday', icon: Lock },
                  { event: '2FA Secret Added', loc: 'GitHub', date: '3 days ago', icon: Zap },
                ].map((ev, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                        <ev.icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{ev.event}</p>
                        <p className="text-[10px] text-muted-foreground">{ev.loc}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{ev.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="shadow-none border-border/50 bg-slate-950 text-slate-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Search className="w-5 h-5 text-indigo-400" />
                  Dark Web Watch
                </CardTitle>
                <Switch />
              </div>
              <CardDescription className="text-slate-400">Continuous monitoring for data breaches.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">High Risk Alert</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                  Your email <span className="text-white font-mono">user@example.com</span> was found in the "Canva 2019" leak.
                </p>
                <Button variant="link" className="p-0 h-auto text-indigo-400 text-[10px] mt-2">
                  View Breach Details <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none border-border/50 border-dashed">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-indigo-600" />
                </div>
                <h4 className="font-bold text-sm">Security Hardening</h4>
                <p className="text-xs text-muted-foreground mt-2 mb-4">
                  Implement military-grade security by adding a hardware YubiKey as your primary unlock method.
                </p>
                <Button variant="outline" size="sm" className="w-full">Enable WebAuthn</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}