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
            className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight mb-8 text-balance leading-tight"
          >
            Secure your <span className="text-gradient">digital life</span> with Sentinel.
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="h-14 px-8 text-lg btn-gradient group"
              onClick={() => navigate('/dashboard')}
            >
              Launch Vault <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2">
              <Github className="mr-2 w-5 h-5" /> View Source
            </Button>
          </motion.div>
        </div>
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-8 py-20">
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
      </main>
    </div>
  );
}