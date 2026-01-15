"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Shield, MapPin, Fingerprint, Zap, Lock, ChevronRight, ArrowRight } from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/6 rounded-full blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/60 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-9 h-9 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <MapPin className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-xl tracking-tight">ZK GPS</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link href="#features" className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              Features
            </Link>
            <Link href="#how-it-works" className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              How it Works
            </Link>
            <div className="w-px h-6 bg-white/10 mx-2" />
            <Link href="/dashboard">
              <Button className="bg-white text-black hover:bg-neutral-100 rounded-full px-5 h-9 text-sm font-medium">
                Launch App
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-6 pt-16">
        <motion.div
          className="max-w-4xl mx-auto text-center relative z-10"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          {/* Badge */}
          <motion.div variants={fadeIn} className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-neutral-300">Zero-Knowledge Identity Verification</span>
            </div>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            variants={fadeIn}
            className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-8"
          >
            <span className="block bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
              Prove identity.
            </span>
            <span className="block bg-gradient-to-b from-neutral-400 to-neutral-600 bg-clip-text text-transparent mt-2">
              Protect privacy.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={fadeIn}
            className="text-lg md:text-xl text-neutral-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Verify your age, location, or credentials without exposing personal data.
            Cryptographic proofs that work in seconds.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeIn}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:opacity-90 rounded-full px-8 h-14 text-base font-semibold shadow-2xl shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-[1.02]"
              >
                Create Your Credential
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <Link href="/provider">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/5 text-white hover:bg-white/10 rounded-full px-8 h-14 text-base font-medium"
              >
                Provider Portal
              </Button>
            </Link>
          </motion.div>

          {/* Built on Mantle - RIGHT UNDER HERO */}
          <motion.div
            variants={fadeIn}
            className="mt-16 flex flex-col items-center gap-4"
          >
            <span className="text-xs font-semibold tracking-[0.2em] text-neutral-500 uppercase">
              Built on
            </span>
            <div className="relative h-8 opacity-70 hover:opacity-100 transition-opacity">
              <Image
                src="/logos/mantle.png"
                alt="Mantle Network"
                width={140}
                height={32}
                className="h-8 w-auto object-contain"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-32 px-6 relative" id="features">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Privacy by design
            </h2>
            <p className="text-neutral-400 text-lg max-w-xl mx-auto">
              Built from the ground up to protect your data while enabling seamless verification.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Lock,
                title: "Zero Data Exposure",
                description: "Your personal information never leaves your device. Only cryptographic proofs are shared.",
                iconColor: "text-emerald-400",
                bgColor: "bg-emerald-500/10"
              },
              {
                icon: Zap,
                title: "Mantle L2 Speed",
                description: "Instant verification at a fraction of mainnet costs. Powered by Mantle's modular architecture.",
                iconColor: "text-cyan-400",
                bgColor: "bg-cyan-500/10"
              },
              {
                icon: Fingerprint,
                title: "W3C Standards",
                description: "Interoperable credentials that work across the decentralized identity ecosystem.",
                iconColor: "text-violet-400",
                bgColor: "bg-violet-500/10"
              }
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-white/[0.02] border-white/5 hover:border-white/10 transition-all h-full group">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${feature.bgColor}`}>
                      <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                    </div>
                    <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-neutral-400 text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Three simple steps
            </h2>
            <p className="text-neutral-400 text-lg max-w-xl mx-auto">
              From credential creation to verified proof in under a minute.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-emerald-500/50 via-cyan-500/50 to-violet-500/50" />

            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  step: "01",
                  title: "Create Credential",
                  description: "Connect wallet, enter your details, sign with your wallet. Your data is encrypted and stored on IPFS.",
                  color: "from-emerald-500 to-emerald-600"
                },
                {
                  step: "02",
                  title: "Receive Request",
                  description: "Providers request specific verifications. You choose what to approve — always in control.",
                  color: "from-cyan-500 to-cyan-600"
                },
                {
                  step: "03",
                  title: "Generate Proof",
                  description: "Accept the request, generate a ZK proof, and verify on-chain. No personal data exposed.",
                  color: "from-violet-500 to-violet-600"
                }
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  className="text-center relative"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                >
                  <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-8 shadow-xl relative z-10`}>
                    <span className="text-3xl font-bold text-black">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{item.title}</h3>
                  <p className="text-neutral-400 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">
              Ready to own your identity?
            </h2>
            <p className="text-neutral-400 text-lg mb-12 max-w-xl mx-auto">
              Join thousands using zero-knowledge proofs for privacy-preserving verification.
            </p>
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-neutral-100 rounded-full px-10 h-14 text-base font-semibold transition-all hover:scale-[1.02]"
              >
                Get Started — It's Free
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-neutral-500">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="font-medium text-neutral-400">ZK GPS</span>
          </div>
          <p>© 2026 ZK GPS. Built for Mantle Network.</p>
          <div className="flex gap-6">
            <Link href="https://github.com" className="hover:text-white transition-colors">GitHub</Link>
            <Link href="#" className="hover:text-white transition-colors">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
