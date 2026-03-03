import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Zap, Globe, Github, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';
export function HomePage() {
  const navigate = useNavigate();
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-primary/30 selection:text-primary">
      <ThemeToggle />
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-500/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] right-[10%] w-[20%] h-[20%] bg-emerald-500/10 rounded-full blur-[100px]" />
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="py-16 md:py-24 lg:py-32 xl:py-40 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
          >
            <Shield className="w-4 h-4" />
            <span>Military-Grade Zero Knowledge Encryption</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight mb-8 text-balance leading-[1.05]"
          >
            Secure your <span className="text-gradient">digital life</span> with Sentinel.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 text-pretty leading-relaxed"
          >
            The world's first edge-native password manager. Built on Cloudflare's global infrastructure for unparalleled speed and security.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button 
              size="lg" 
              className="h-14 px-8 text-lg btn-gradient relative overflow-hidden group hover:shadow-glow-lg transition-all duration-300" 
              onClick={() => navigate('/dashboard')}
            >
              <span className="relative z-10 flex items-center">
                Launch Vault <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2 hover:bg-secondary/50 transition-colors">
              <Github className="mr-2 w-5 h-5" /> View Source
            </Button>
          </motion.div>
        </div>
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 py-20"
        >
          {[
            { icon: Lock, title: "Zero Knowledge", desc: "Your data is encrypted locally before it ever leaves your device. We never see your master password." },
            { icon: Zap, title: "Edge Performance", desc: "Sub-millisecond access via Cloudflare Workers and Durable Objects deployed across 300+ cities." },
            { icon: Globe, title: "Unified Sync", desc: "Seamless synchronization across all your devices with globally distributed state consistency." }
          ].map((feature, i) => (
            <motion.div 
              key={i} 
              variants={item}
              className="p-8 rounded-3xl bg-secondary/30 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all group hover:shadow-soft hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>
      <footer className="py-12 border-t border-border/50 bg-secondary/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
             <Shield className="w-5 h-5 text-primary" />
             <span className="font-bold text-lg tracking-tight">Sentinel</span>
          </div>
          <p className="text-muted-foreground text-sm">© 2024 Sentinel Vault. Military-grade security for the modern web.</p>
        </div>
      </footer>
    </div>
  );
}