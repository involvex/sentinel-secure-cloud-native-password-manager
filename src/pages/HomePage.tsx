import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Zap, Globe, Github, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
export function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ThemeToggle />
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-background to-background pointer-events-none" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-20 md:py-32 lg:py-40 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 animate-fade-in">
            <Shield className="w-4 h-4" />
            <span>Military-Grade Zero Knowledge Encryption</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight mb-6 text-balance leading-[1.1]">
            Secure your <span className="text-gradient">digital life</span> with Sentinel.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty">
            The world's first edge-native password manager. Fast, secure, and always in sync. Built on Cloudflare's global infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-14 px-8 text-lg btn-gradient" onClick={() => navigate('/dashboard')}>
              Launch Vault <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
              <Github className="mr-2 w-5 h-5" /> View Source
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-16">
          {[
            { icon: Lock, title: "End-to-End Encryption", desc: "Your data is encrypted locally before it ever leaves your device. We can't see anything." },
            { icon: Zap, title: "Edge Performance", desc: "Sub-millisecond access via Cloudflare Workers and Durable Objects across the globe." },
            { icon: Globe, title: "Real-time Sync", desc: "Seamless synchronization across all your devices with distributed state consistency." }
          ].map((feature, i) => (
            <div key={i} className="p-8 rounded-3xl bg-secondary/50 border border-border hover:border-primary/50 transition-colors group">
              <feature.icon className="w-12 h-12 text-primary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
      <footer className="py-12 border-t border-border/50 text-center text-muted-foreground">
        <p>© 2024 Sentinel Vault. All rights reserved.</p>
      </footer>
    </div>
  );
}