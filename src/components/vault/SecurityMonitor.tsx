import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, Zap, Activity,
  RefreshCw, Lock, Fingerprint, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { SecurityStats } from '@shared/types';
import { cn } from '@/lib/utils';
export function SecurityMonitor() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading, isError, refetch } = useQuery<SecurityStats>({
    queryKey: ['security-stats'],
    queryFn: () => api<SecurityStats>('/api/monitor/summary')
  });
  const handleAudit = () => {
    queryClient.invalidateQueries({ queryKey: ['security-stats'] });
    refetch();
  };
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background/50">
        <div className="text-center space-y-4">
          <div className="relative">
            <RefreshCw className="w-12 h-12 animate-spin text-primary mx-auto" />
            <ShieldCheck className="w-5 h-5 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground font-bold tracking-tight animate-pulse">Running Vault Diagnostics...</p>
        </div>
      </div>
    );
  }
  if (isError || !stats) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <Card className="max-w-md border-destructive/20 bg-destructive/5 text-center p-6">
          <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">Audit Failed</h3>
          <p className="text-sm text-muted-foreground mb-6">Sentinel was unable to analyze your vault. Ensure your session is still active.</p>
          <Button onClick={() => handleAudit()} variant="destructive">Retry Audit</Button>
        </Card>
      </div>
    );
  }
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Security Monitor</h1>
          <p className="text-muted-foreground font-medium">Real-time health audit of your encrypted digital life.</p>
        </div>
        <Button onClick={handleAudit} variant="outline" className="gap-2 font-bold shadow-sm">
          <RefreshCw className="w-4 h-4" /> Refresh Audit
        </Button>
      </div>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
      >
        <motion.div variants={item}>
          <Card className="bg-primary/5 border-primary/20 shadow-none hover:bg-primary/10 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Health Score</p>
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold text-foreground">{stats.healthScore}</span>
                <span className="text-muted-foreground text-sm font-bold">/100</span>
              </div>
              <Progress value={stats.healthScore} className="h-2 mt-4 bg-primary/20" />
            </CardContent>
          </Card>
        </motion.div>
        {[
          { label: 'Weak Secrets', val: stats.weakCount, icon: ShieldAlert, color: 'text-destructive', bg: 'bg-destructive/10' },
          { label: 'Reused Passwords', val: stats.reusedCount, icon: RefreshCw, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Breach Alerts', val: stats.breachedCount, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-500/10' },
          { label: '2FA Enrollment', val: `${stats.twoFactorPercentage}%`, icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
        ].map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card className="shadow-none border-border/50 hover:border-primary/20 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                  <div className={cn("p-1 rounded-md", stat.bg)}>
                    <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                  </div>
                </div>
                <div className={cn("text-4xl font-extrabold tracking-tight", stat.color)}>{stat.val}</div>
                <p className="text-[9px] font-bold text-muted-foreground mt-3 uppercase">Status: Action Required</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none bg-secondary/20 shadow-none overflow-hidden ring-1 ring-border/50">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">AI Security Advisor</CardTitle>
                  <CardDescription className="font-medium">Intelligent mitigations for detected vulnerabilities.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-5">
              {[
                { icon: Lock, color: "text-orange-500", bg: "bg-orange-500/10", title: "Credential Stuffing Risk", desc: `We found ${stats.reusedCount} items sharing passwords. Attackers often test leaked credentials across multiple services. AI suggests unique AES-256 generated keys.` },
                { icon: Fingerprint, color: "text-indigo-600", bg: "bg-indigo-500/10", title: "Modern Auth Upgrade", desc: "12 of your service providers now support WebAuthn Passkeys. Transitioning away from passwords will decrease your account hijacking risk by 99%." }
              ].map((insight, idx) => (
                <div key={idx} className="flex gap-5 items-start p-5 rounded-2xl bg-card border border-border/40 shadow-sm hover:shadow-md transition-shadow">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner", insight.bg)}>
                    <insight.icon className={cn("w-6 h-6", insight.color)} />
                  </div>
                  <div>
                    <h4 className="font-bold text-base mb-1.5">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{insight.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="shadow-2xl border-none bg-slate-950 text-slate-50 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
            <CardHeader className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <CardTitle className="text-lg flex items-center gap-2 font-bold">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  Live Monitoring
                </CardTitle>
                <Switch defaultChecked />
              </div>
              <CardDescription className="text-slate-400 font-medium">Dark web & breach detection.</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-red-500 mb-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest">Active Threat Detected</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                  Data matching your vault was found in a recent collection. We recommend rotating sensitive financial keys immediately.
                </p>
                <Button variant="link" className="p-0 h-auto text-indigo-400 text-[10px] mt-3 font-bold">
                  View Source Details <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="border-dashed border-2 hover:border-primary/40 transition-colors">
            <CardContent className="pt-8 text-center px-6">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5 shadow-inner">
                <ShieldCheck className="w-7 h-7 text-emerald-600" />
              </div>
              <h4 className="font-bold text-base">Vault Hardening</h4>
              <p className="text-sm text-muted-foreground mt-2 mb-6 leading-relaxed">
                Add an extra layer of protection by requiring a hardware security key for all vault exports.
              </p>
              <Button variant="secondary" size="sm" className="w-full font-bold">Enable Export Guard</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}