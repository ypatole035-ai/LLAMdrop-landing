// 2features added/fixed major bugs
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Check, Copy, TerminalSquare, Smartphone, Laptop, Cpu, Globe,
  Shield, Zap, Database, Search, Download, MonitorSpeaker,
  Server, Brain, ChevronRight, Github, Star, ChevronDown,
  HelpCircle, Layers, AlertTriangle, Thermometer, Lock, X
} from "lucide-react";

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView();
  return (
    <section
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </section>
  );
}

function TerminalBlock({ command, label }: { command: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="w-full relative">
      <div className="text-xs text-muted-foreground font-mono mb-2 uppercase tracking-widest">{label}</div>
      <div className="bg-card border border-border p-4 pr-12 font-mono text-sm text-primary overflow-x-auto relative shadow-[4px_4px_0_0_hsl(var(--primary)/0.18)] transition-transform hover:-translate-y-0.5">
        <span className="text-muted-foreground select-none">$ </span>{command}
        <button
          onClick={() => { navigator.clipboard.writeText(command); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="absolute top-4 right-4 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
          title="Copy"
        >
          {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

const TIERS = [
  { name: "Micro",       badge: "T0", ram: "< 1 GB avail",   ramGb: 0.9,  color: "text-blue-400",   borderColor: "border-blue-400/40",   bg: "bg-blue-400/5",   device: "Old Android phones, tiny SBCs",        models: ["SmolLM2 135M", "Qwen2.5 0.5B", "TinyLlama", "Gemma 3 1B"],                        backend: "llama.cpp (CPU)" },
  { name: "Low",         badge: "T1", ram: "1–3 GB avail",   ramGb: 2.9,  color: "text-cyan-400",    borderColor: "border-cyan-400/40",    bg: "bg-cyan-400/5",   device: "Budget phones, Raspberry Pi 4",        models: ["Llama 3.2 1B", "DeepSeek R1 1.5B", "Gemma 2 2B", "Phi-4 Mini"],                  backend: "llama.cpp / Vulkan (mobile GPU)" },
  { name: "Low-Mid",     badge: "T2", ram: "3–6 GB avail",   ramGb: 5.9,  color: "text-teal-400",    borderColor: "border-teal-400/40",    bg: "bg-teal-400/5",   device: "Mid-range phones, old laptops, Pi 5",  models: ["Mistral 7B", "Llama 3.1 8B", "DeepSeek R1 7B", "Phi-3.5 Mini"],                  backend: "llama.cpp / Vulkan / Ollama" },
  { name: "Mid",         badge: "T3", ram: "6–12 GB avail",  ramGb: 11.9, color: "text-primary",     borderColor: "border-primary/40",     bg: "bg-primary/5",    device: "Gaming PCs, modern laptops",           models: ["Gemma 3 12B", "Qwen3 8B", "Phi-4 14B", "Mistral NeMo 12B"],                      backend: "CUDA / ROCm / Metal / Ollama" },
  { name: "High",        badge: "T4", ram: "12–24 GB avail", ramGb: 23.9, color: "text-yellow-400",  borderColor: "border-yellow-400/40",  bg: "bg-yellow-400/5", device: "High-end desktops, ML workstations",   models: ["Gemma 3 27B", "Qwen3 32B", "DeepSeek R1 32B"],                                   backend: "CUDA / ROCm / Metal" },
  { name: "Desktop",     badge: "T5", ram: "24 GB+ avail",   ramGb: 9999, color: "text-orange-400",  borderColor: "border-orange-400/40",  bg: "bg-orange-400/5", device: "Multi-GPU rigs, NAS servers",          models: ["Llama 3.3 70B", "Qwen2.5 72B", "DeepSeek R1 70B"],                               backend: "Multi-GPU CUDA / ROCm" },
];

interface DeviceSpecs {
  ram: number;
  ramLabel: string;
  cores: number;
  os: string;
  platform: string;
  screen: string;
  gpu: string;
  mobile: boolean;
  ramSupported: boolean;
}

interface ScanLine {
  label: string;
  value: string;
  status: 'ok' | 'warn' | 'info';
}

function detectSpecs(): DeviceSpecs {
  const ua = navigator.userAgent;

  const ram: number = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 0;
  const ramSupported = (navigator as Navigator & { deviceMemory?: number }).deviceMemory !== undefined;
  const cores: number = navigator.hardwareConcurrency ?? 0;

  let os = 'Unknown OS';
  let platform = 'Unknown';
  if (/Android/i.test(ua)) { os = 'Android'; platform = 'Mobile (ARM64)'; }
  else if (/iPhone|iPad|iPod/i.test(ua)) { os = 'iOS'; platform = 'Apple Silicon (ARM64)'; }
  else if (/Win/i.test(ua)) { os = 'Windows'; platform = 'x86_64'; }
  else if (/Mac/i.test(ua)) { os = 'macOS'; platform = 'Apple Silicon / x86_64'; }
  else if (/CrOS/i.test(ua)) { os = 'ChromeOS'; platform = 'x86_64 / ARM'; }
  else if (/Linux/i.test(ua)) { os = 'Linux'; platform = 'x86_64 / ARM64'; }

  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const screen = `${window.screen.width} × ${window.screen.height}`;

  let gpu = 'Not available';
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (gl) {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) {
        const raw = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) as string;
        gpu = raw.replace(/\s*\(.*?\)\s*/g, '').trim() || raw;
      } else {
        gpu = 'WebGL available (renderer hidden)';
      }
    }
  } catch { gpu = 'WebGL unavailable'; }

  const availGb = ram > 0 ? Math.round(ram * 0.5 * 10) / 10 : 0;
  let ramLabel = ram > 0
    ? `≈ ${ram} GB total · ≈ ${availGb} GB available (×0.5)`
    : 'Not reported by this browser';

  return { ram, ramLabel, cores, os, platform, screen, gpu, mobile, ramSupported };
}

function getTierFromRam(ram: number) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (ram > TIERS[i].ramGb) return TIERS[Math.min(i + 1, TIERS.length - 1)];
  }
  return TIERS[0];
}

interface BackendResult {
  backend: string;
  note: string;
}

function detectBackend(specs: DeviceSpecs): BackendResult {
  const gpuLow = specs.gpu.toLowerCase();
  const { os } = specs;

  if (os === 'Android') {
    return { backend: 'llama.cpp (CPU only)', note: 'GPU never used on Android — crashes or slower than CPU' };
  }
  if (os === 'iOS') {
    return { backend: 'llama.cpp (CPU only)', note: 'iOS — no native CLI backend' };
  }
  if (os === 'macOS') {
    const isAppleSilicon = /apple/i.test(gpuLow) || /arm/i.test(specs.platform.toLowerCase());
    if (isAppleSilicon) {
      return { backend: 'Ollama + Metal', note: 'Apple Silicon GPU acceleration' };
    }
    return { backend: 'llama.cpp (CPU only)', note: 'Intel Mac — Metal not used' };
  }
  if (/nvidia|geforce|quadro|rtx|gtx|tesla/i.test(gpuLow)) {
    return { backend: 'llama.cpp CUDA', note: 'NVIDIA GPU detected' };
  }
  if (/amd|radeon/i.test(gpuLow)) {
    return { backend: 'llama.cpp ROCm or Vulkan', note: 'ROCm if installed, otherwise Vulkan' };
  }
  if (/intel.*arc|arc.*a\d{3}[a-z]?/i.test(gpuLow)) {
    return { backend: 'IPEX-LLM', note: 'Intel Arc GPU detected' };
  }
  if (/intel/i.test(gpuLow)) {
    return { backend: 'llama.cpp Vulkan', note: 'Intel integrated GPU' };
  }
  return { backend: 'llama.cpp (CPU only)', note: 'No supported GPU detected' };
}

const MANUAL_RAM = [
  { label: "Under 1 GB",  value: 0.5 },
  { label: "1 – 2 GB",    value: 1.5 },
  { label: "2 – 4 GB",    value: 3 },
  { label: "4 – 8 GB",    value: 6 },
  { label: "8 – 16 GB",   value: 10 },
  { label: "16 – 32 GB",  value: 20 },
  { label: "32 – 64 GB",  value: 48 },
  { label: "64 GB+",      value: 100 },
];

// ─── Before / After Terminal ────────────────────────────────────────────────

const BEFORE_LINES = [
  { text: "$ pkg install clang cmake git python3", delay: 0 },
  { text: "$ git clone https://github.com/ggml-org/llama.cpp", delay: 60 },
  { text: "$ mkdir build && cd build", delay: 50 },
  { text: "$ cmake .. -DGGML_VULKAN=1 -DGGML_NEON=1", delay: 70 },
  { text: "# waiting for build... (~8 min)", delay: 0, dim: true },
  { text: "$ make -j4", delay: 50 },
  { text: "# done. now find a model...", delay: 0, dim: true },
  { text: "# huggingface.co → search → which one?", delay: 0, dim: true },
  { text: "# Q4_K_M? Q5_K_S? IQ2_M? IQ3_XS?", delay: 0, dim: true },
  { text: "# downloading 2.3GB... wrong quantization", delay: 0, dim: true },
  { text: "# downloading again...", delay: 0, dim: true },
  { text: "$ ./bin/llama-cli \\", delay: 60 },
  { text: "    -m ~/models/llama-7b-Q5_K_S.gguf \\", delay: 40 },
  { text: "    --threads 4 --ctx-size 2048 \\", delay: 40 },
  { text: "    --batch-size 64 --temp 0.7 \\", delay: 40 },
  { text: "    -p \"You are a helpful assistant.\" \\", delay: 40 },
  { text: "    -i --color", delay: 40 },
  { text: "Killed: OOM.", delay: 0, error: true },
  { text: "# start over.", delay: 0, dim: true },
];

const AFTER_LINES = [
  { text: "$ curl -sL .../install.sh | bash", delay: 0 },
  { text: "✓ llamdrop installed.", delay: 0, ok: true },
  { text: "", delay: 0 },
  { text: "$ llamdrop", delay: 80 },
  { text: "✓ Detected: Dimensity 800U · 2.5 GB free", delay: 0, ok: true },
  { text: "✓ Tier: Low-Mid (T2)", delay: 0, ok: true },
  { text: "✓ Backend: llama.cpp CPU", delay: 0, ok: true },
  { text: "✓ Showing 8 models that fit your device", delay: 0, ok: true },
  { text: "→ [Selected: Gemma 3 1B · Q4_K_M · 0.7GB]", delay: 0, info: true },
  { text: "✓ Downloading... done.", delay: 0, ok: true },
  { text: "✓ Launching...", delay: 0, ok: true },
  { text: "", delay: 0 },
  { text: "🦙 Hello! How can I help you today?", delay: 0, chat: true },
  { text: "You: _", delay: 0, cursor: true },
];

type AnyLine = { text: string; delay?: number; dim?: boolean; error?: boolean; ok?: boolean; info?: boolean; chat?: boolean; cursor?: boolean };

function useTypewriter(lines: AnyLine[], charDelay: number, active: boolean) {
  const [rendered, setRendered] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) return;
    setRendered([]);
    setDone(false);
    let cancelled = false;

    const run = async () => {
      for (let i = 0; i < lines.length; i++) {
        if (cancelled) return;
        const line = lines[i];
        const perChar = line.dim || line.error || line.ok || line.info || line.chat || line.cursor
          ? 0
          : charDelay + (line.delay ?? 0);

        if (perChar === 0) {
          await new Promise(r => setTimeout(r, line.dim ? 180 : line.error ? 400 : 120));
          if (cancelled) return;
          setRendered(prev => [...prev, line.text]);
        } else {
          for (let c = 1; c <= line.text.length; c++) {
            if (cancelled) return;
            await new Promise(r => setTimeout(r, perChar));
            setRendered(prev => {
              const next = [...prev];
              next[i] = line.text.slice(0, c);
              return next;
            });
          }
          await new Promise(r => setTimeout(r, 80));
        }
      }
      if (!cancelled) setDone(true);
    };

    run();
    return () => { cancelled = true; };
  }, [active]);

  return { rendered, done };
}

function BeforeAfterTerminal() {
  const { ref, inView } = useInView(0.2);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (inView && !started) setStarted(true);
  }, [inView]);

  const before = useTypewriter(BEFORE_LINES, 22, started);
  const after  = useTypewriter(AFTER_LINES,  10, started);

  const beforeContainerRef = useRef<HTMLDivElement>(null);
  const afterContainerRef  = useRef<HTMLDivElement>(null);
  const beforeEndRef = useRef<HTMLDivElement>(null);
  const afterEndRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = beforeContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [before.rendered]);
  useEffect(() => {
    const el = afterContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [after.rendered]);

  const renderLine = (text: string, meta: AnyLine, idx: number) => {
    const isOk     = (meta as any).ok;
    const isError  = (meta as any).error;
    const isInfo   = (meta as any).info;
    const isDim    = (meta as any).dim;
    const isChat   = (meta as any).chat;
    const isCursor = (meta as any).cursor;

    let cls = "text-foreground/85";
    if (isOk)     cls = "text-green-400";
    if (isError)  cls = "text-red-400 font-bold";
    if (isInfo)   cls = "text-cyan-400";
    if (isDim)    cls = "text-muted-foreground/35 italic";
    if (isChat)   cls = "text-primary";
    if (isCursor) cls = "text-muted-foreground/60";

    return (
      <div key={idx} className={`font-mono text-[10px] sm:text-xs leading-[1.7] whitespace-pre-wrap break-all ${cls}`}>
        {text || <span className="opacity-0">.</span>}
        {isCursor && <span className="animate-pulse text-primary ml-0.5">▋</span>}
      </div>
    );
  };

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-14 sm:py-24 px-4 sm:px-6 bg-background border-y border-border">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <p className="text-xs font-mono text-primary uppercase tracking-widest mb-3">Before vs After</p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 leading-tight">
            This is what running local AI<br className="hidden sm:block" /> used to look like.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Both terminals start at the same time. Watch what happens.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {/* BEFORE */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <X className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-mono text-red-400 uppercase tracking-widest">Without llamdrop</span>
            </div>
            <div className="border border-red-400/20 bg-[#0a0505] flex flex-col overflow-hidden" style={{ height: "clamp(320px, 45vw, 480px)" }}>
              <div className="flex items-center gap-2 px-3 py-2 border-b border-red-400/15 bg-black/40 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-red-500/60" />
                <span className="w-2 h-2 rounded-full bg-yellow-500/40" />
                <span className="w-2 h-2 rounded-full bg-green-500/20" />
                <span className="font-mono text-[9px] text-muted-foreground/30 ml-2">termux — manual setup</span>
              </div>
              <div ref={beforeContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-0.5">
                {before.rendered.map((text, idx) => renderLine(text, BEFORE_LINES[idx], idx))}
                {!before.done && started && (
                  <div className="font-mono text-[10px] text-red-400/40 animate-pulse">▋</div>
                )}
                <div ref={beforeEndRef} />
              </div>
            </div>
            {before.done && (
              <p className="mt-2 text-[10px] font-mono text-red-400/40 text-center">
                avg time: 2–4 hours. result: OOM crash.
              </p>
            )}
          </div>

          {/* AFTER */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-mono text-primary uppercase tracking-widest">With llamdrop</span>
            </div>
            <div className="border border-primary/25 bg-[#040a04] flex flex-col overflow-hidden" style={{ height: "clamp(320px, 45vw, 480px)" }}>
              <div className="flex items-center gap-2 px-3 py-2 border-b border-primary/15 bg-black/40 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-red-500/40" />
                <span className="w-2 h-2 rounded-full bg-yellow-500/40" />
                <span className="w-2 h-2 rounded-full bg-green-500/60" />
                <span className="font-mono text-[9px] text-muted-foreground/30 ml-2">termux — llamdrop</span>
              </div>
              <div ref={afterContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-0.5">
                {after.rendered.map((text, idx) => renderLine(text, AFTER_LINES[idx], idx))}
                {!after.done && started && (
                  <div className="font-mono text-[10px] text-primary/40 animate-pulse">▋</div>
                )}
                <div ref={afterEndRef} />
              </div>
            </div>
            {after.done && (
              <p className="mt-2 text-[10px] font-mono text-primary/40 text-center">
                two commands. running.
              </p>
            )}
          </div>
        </div>

        {!started && (
          <p className="mt-6 text-center text-xs font-mono text-muted-foreground/30">
            scroll down to start both terminals simultaneously →
          </p>
        )}
        {started && !before.done && (
          <p className="mt-6 text-center text-xs font-mono text-muted-foreground/30 animate-pulse">
            running...
          </p>
        )}
      </div>
    </section>
  );
}

const MANUAL_STEPS = [
  "Research which backend works for your chip (CUDA? ROCm? Vulkan? Metal?)",
  "Build llama.cpp from source with the right CMake flags",
  "Find a model on HuggingFace (hundreds of variants)",
  "Figure out which quantization fits your RAM (Q4? Q5? IQ2? IQ3?)",
  "Download the right GGUF file manually",
  "Calculate correct --threads, --ctx-size, --batch-size flags",
  "Run it and hope it doesn't OOM crash",
  "If it crashes, start over",
];

function WhatLlamdropPicks({ tier, specs }: { tier: ReturnType<typeof getTierFromRam>; specs: DeviceSpecs | null }) {
  const [rightChecked, setRightChecked] = useState<number>(-1);

  useEffect(() => {
    setRightChecked(-1);
    let i = 0;
    const items = [
      `Backend: ${specs ? detectBackend(specs).backend : tier.backend}`,
      `Your tier: ${tier.name} (${tier.badge}) — ${tier.ram} RAM`,
      `Filtered: showing only models that fit`,
      `Quantization auto-selected: Q4_K_M (best for your RAM)`,
      `Flags generated: --threads auto --ctx 4096 --batch 128`,
      `Ready to chat`,
    ];
    const iv = setInterval(() => {
      i++;
      setRightChecked(i - 1);
      if (i >= items.length) clearInterval(iv);
    }, 380);
    return () => clearInterval(iv);
  }, [tier, specs]);

  const rightItems = [
    `Backend: ${specs ? detectBackend(specs).backend : tier.backend}`,
    `Your tier: ${tier.name} (${tier.badge}) — ${tier.ram} RAM`,
    `Filtered: showing only models that fit`,
    `Quantization auto-selected: Q4_K_M (best for your RAM)`,
    `Flags generated: --threads auto --ctx 4096 --batch 128`,
    `Ready to chat`,
  ];

  return (
    <div className="mt-6 border border-border bg-background">
      <div className="px-4 sm:px-6 py-3 border-b border-border bg-card/40">
        <p className="text-xs font-mono text-primary uppercase tracking-widest">What llamdrop just did for you</p>
      </div>
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
        {/* Left — manual painful way */}
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <X className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs font-mono text-red-400 uppercase tracking-widest">Without llamdrop</p>
          </div>
          <ul className="space-y-2.5">
            {MANUAL_STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm font-mono text-muted-foreground/50">
                <span className="w-4 h-4 border border-muted-foreground/20 flex-shrink-0 mt-0.5 flex items-center justify-center text-[10px] text-muted-foreground/30">
                  {i + 1}
                </span>
                <span className={i === 6 ? "text-red-400/60" : ""}>{step}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[10px] font-mono text-red-400/50">avg: 2–4 hours. success rate: not great.</p>
        </div>

        {/* Right — llamdrop auto */}
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-xs font-mono text-primary uppercase tracking-widest">With llamdrop — auto</p>
          </div>
          <ul className="space-y-2.5">
            {rightItems.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-xs sm:text-sm font-mono"
                style={{
                  opacity: rightChecked >= i ? 1 : 0.15,
                  transition: "opacity 0.3s ease",
                }}
              >
                <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 transition-colors duration-300 ${rightChecked >= i ? "text-primary" : "text-muted-foreground/20"}`} />
                <span className={rightChecked >= i ? "text-foreground" : "text-muted-foreground/30"}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[10px] font-mono text-primary/50">
            {rightChecked >= rightItems.length - 1
              ? "done. this is what happened silently when you ran llamdrop."
              : "configuring..."}
          </p>
        </div>
      </div>
    </div>
  );
}

function FindMyTier() {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'done' | 'manual'>('idle');
  const [scanLines, setScanLines] = useState<ScanLine[]>([]);
  const [specs, setSpecs] = useState<DeviceSpecs | null>(null);
  const [manualRam, setManualRam] = useState<number | null>(null);
  const [manualDone, setManualDone] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const tier = specs
    ? (specs.ramSupported ? getTierFromRam(specs.ram * 0.5) : null)
    : (manualRam !== null ? getTierFromRam(manualRam * 0.5) : null);
  const displayTier = phase === 'done' ? tier : (manualDone ? tier : null);

  const runScan = useCallback(async () => {
    setPhase('scanning');
    setScanLines([]);

    const detected = detectSpecs();
    setSpecs(detected);

    const detectedBackend = detectBackend(detected);
    const lines: ScanLine[] = [
      { label: 'Platform',    value: detected.os,                                  status: 'ok' },
      { label: 'Device type', value: detected.mobile ? 'Mobile / Tablet' : 'Desktop / Laptop', status: 'ok' },
      { label: 'Architecture', value: detected.platform,                            status: 'ok' },
      { label: 'CPU cores',   value: detected.cores > 0 ? `${detected.cores} logical cores` : 'Could not detect', status: detected.cores > 0 ? 'ok' : 'warn' },
      { label: 'GPU',         value: detected.gpu,                                  status: 'info' },
      { label: 'RAM',         value: detected.ramLabel,                             status: detected.ramSupported ? 'ok' : 'warn' },
      { label: 'Backend est.', value: detectedBackend.backend,                      status: 'info' },
      { label: 'Tier result', value: detected.ramSupported
          ? `${getTierFromRam(detected.ram * 0.5).name} (${getTierFromRam(detected.ram * 0.5).badge})`
          : 'Manual input needed — browser hides RAM', status: detected.ramSupported ? 'ok' : 'warn' },
    ];

    for (let i = 0; i < lines.length; i++) {
      await new Promise(r => setTimeout(r, i < 3 ? 260 : 340));
      setScanLines(prev => [...prev, lines[i]]);
    }

    await new Promise(r => setTimeout(r, 400));
    setPhase('done');
  }, []);

  const reset = () => {
    setPhase('idle');
    setScanLines([]);
    setSpecs(null);
    setManualRam(null);
    setManualDone(false);
    setShowComparison(false);
  };

  return (
    <div className="border border-primary/30 bg-primary/5 p-4 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <HelpCircle className="w-5 h-5 text-primary" />
        <p className="text-xs font-mono text-primary uppercase tracking-widest">Live Device Detection</p>
      </div>
      <h3 className="text-2xl font-bold mb-2">See your actual device tier</h3>
      <p className="text-muted-foreground mb-8 leading-relaxed max-w-2xl">
        This is exactly what llamdrop does silently when it first launches — it reads your hardware and picks the right models, backend, and quantization without asking you anything.
      </p>

      {/* IDLE state */}
      {phase === 'idle' && (
        <div className="space-y-4">
          <button
            onClick={runScan}
            className="group flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 font-bold uppercase tracking-wider font-mono hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            <Cpu className="w-5 h-5 group-hover:animate-spin" />
            Analyze my device
          </button>
          <p className="text-xs font-mono text-muted-foreground">
            No permissions asked. Reads only what your browser already exposes — RAM hint, CPU cores, GPU, OS, screen.
          </p>
          <button
            onClick={() => setPhase('manual')}
            className="text-xs font-mono text-muted-foreground/50 hover:text-primary underline underline-offset-2 transition-colors"
          >
            Enter RAM manually instead →
          </button>
        </div>
      )}

      {/* SCANNING state */}
      {phase === 'scanning' && (
        <div className="font-mono text-xs sm:text-sm bg-black/60 border border-border/50 p-4 sm:p-6 space-y-1.5">
          <div className="text-primary/70 text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            llamdrop — device profile scan
          </div>
          {scanLines.map((line, i) => (
            <div
              key={i}
              className="flex gap-3 items-start"
              style={{ animation: 'fadeSlideIn 0.3s ease both' }}
            >
              <span className={`flex-shrink-0 font-bold ${line.status === 'ok' ? 'text-green-400' : line.status === 'warn' ? 'text-yellow-400' : 'text-cyan-400'}`}>
                {line.status === 'ok' ? '✓' : line.status === 'warn' ? '⚠' : '→'}
              </span>
              <span className="text-muted-foreground/70 w-28 flex-shrink-0">{line.label}</span>
              <span className={`${line.status === 'ok' ? 'text-foreground' : line.status === 'warn' ? 'text-yellow-300' : 'text-cyan-300'}`}>
                {line.value}
              </span>
            </div>
          ))}
          {scanLines.length < 8 && (
            <div className="flex gap-3 items-center pt-1">
              <span className="text-primary animate-pulse">▋</span>
              <span className="text-muted-foreground/40 text-[10px]">scanning...</span>
            </div>
          )}
        </div>
      )}

      {/* DONE state — show scan + tier result */}
      {phase === 'done' && specs && (
        <div className="space-y-4">
          {/* Compact scan summary */}
          <div className="font-mono text-[10px] sm:text-xs bg-black/60 border border-border/50 p-3 sm:p-4 space-y-1">
            <div className="text-primary/70 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
              scan complete
            </div>
            {[
              ['Platform',     specs.os + (specs.mobile ? ' · Mobile' : ' · Desktop'),  'ok'],
              ['Architecture', specs.platform,                                            'ok'],
              ['CPU cores',    specs.cores > 0 ? `${specs.cores} logical cores` : '—',   specs.cores > 0 ? 'ok' : 'warn'],
              ['GPU',          specs.gpu,                                                 'info'],
              ['Screen',       specs.screen,                                              'info'],
              ['RAM',          specs.ramLabel,                                            specs.ramSupported ? 'ok' : 'warn'],
            ].map(([label, value, status]) => (
              <div key={label as string} className="flex gap-3 items-start">
                <span className={`flex-shrink-0 font-bold ${status === 'ok' ? 'text-green-400' : status === 'warn' ? 'text-yellow-400' : 'text-cyan-400'}`}>
                  {status === 'ok' ? '✓' : status === 'warn' ? '⚠' : '→'}
                </span>
                <span className="text-muted-foreground/60 w-24 sm:w-28 flex-shrink-0">{label as string}</span>
                <span className={`break-all ${status === 'warn' ? 'text-yellow-300' : status === 'info' ? 'text-cyan-300/80' : 'text-foreground/85'}`}>
                  {value as string}
                </span>
              </div>
            ))}
          </div>

          {/* Tier result card — only if RAM was detected */}
          {specs.ramSupported && tier ? (
            <div className={`border p-5 sm:p-6 ${tier.borderColor} ${tier.bg}`}>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className={`font-mono text-xs font-bold px-2 py-1 border ${tier.borderColor} ${tier.color}`}>{tier.badge}</span>
                <span className={`text-2xl font-bold ${tier.color}`}>{tier.name} Tier</span>
                <span className="text-muted-foreground font-mono text-sm">{tier.ram} RAM</span>
                <span className="text-xs font-mono text-primary/70 bg-primary/10 px-2 py-0.5">detected from your device</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-2">Models that fit your device</p>
                  <ul className="space-y-1">
                    {tier.models.map(m => (
                      <li key={m} className="flex items-center gap-2 text-sm text-foreground font-mono">
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />{m}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-2">Backend llamdrop would pick</p>
                  <div className="flex items-start gap-2 mb-1">
                    <Server className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-mono text-foreground">{detectBackend(specs).backend}</span>
                  </div>
                  {detectBackend(specs).note && (
                    <p className="text-[10px] font-mono text-muted-foreground/60 pl-6 mb-3">{detectBackend(specs).note}</p>
                  )}
                  <div className="flex items-start gap-2 border border-yellow-400/25 bg-yellow-400/5 p-3">
                    <span className="text-yellow-400 text-xs flex-shrink-0 mt-0.5">⚠</span>
                    <p className="text-[11px] text-yellow-200/70 leading-relaxed">
                      Browser limits apply. RAM shown is estimated (browsers report total, not available), and GPU drivers/CPU flags can't be detected here. llamdrop measures all of this directly at launch — backends and model recommendations shown here may differ from what it actually selects on your device.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-border/40">
                <a href="https://github.com/ypatole035-ai/llamdrop" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-mono text-primary hover:underline">
                  Install llamdrop and run these models on your {specs.os} device <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Warning 1 — output quality by tier */}
              {(tier.badge === 'T0' || tier.badge === 'T1') && (
                <div className="mt-4 flex items-start gap-3 border border-yellow-400/30 bg-yellow-400/5 p-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] font-mono text-yellow-200/70 leading-relaxed">
                    <span className="text-yellow-400 font-bold">Output quality note:</span> On {tier.name} tier devices, models are heavily quantized to fit your RAM. Responses may hallucinate more than usual, struggle with complex reasoning, or give shorter answers. This is a hardware limit — not a bug. Tier T2+ gives noticeably better results.
                  </p>
                </div>
              )}

              {/* Warning 2 — device heat */}
              {specs.mobile && (
                <div className="mt-3 flex items-start gap-3 border border-orange-400/30 bg-orange-400/5 p-3">
                  <Thermometer className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] font-mono text-orange-200/70 leading-relaxed">
                    <span className="text-orange-400 font-bold">Device heat:</span> Running AI inference continuously heats your phone. Avoid using it while charging for extended sessions. llamdrop's RAM monitor will warn you before things go wrong, but take breaks on long chats.
                  </p>
                </div>
              )}

              {/* Feature 1 — what llamdrop picked */}
              {!showComparison && (
                <button
                  onClick={() => setShowComparison(true)}
                  className="mt-4 text-xs font-mono text-primary/60 hover:text-primary underline underline-offset-2 transition-colors"
                >
                  → See what llamdrop just did automatically
                </button>
              )}
              {showComparison && <WhatLlamdropPicks tier={tier} specs={specs} />}
            </div>
          ) : (
            /* RAM not supported by this browser */
            <div className="border border-yellow-400/30 bg-yellow-400/5 p-5">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-yellow-400 text-lg font-bold flex-shrink-0">⚠</span>
                <div>
                  <p className="font-bold text-foreground mb-1">Your browser doesn't expose RAM info</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Firefox and Safari hide <code className="text-xs bg-border/40 px-1 py-0.5">navigator.deviceMemory</code> for privacy reasons. Chrome and Edge on Android/Desktop report it. Select your RAM below to see your tier.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {MANUAL_RAM.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setManualRam(opt.value)}
                    className={`border px-3 py-2.5 text-xs font-mono transition-all text-center ${manualRam === opt.value ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {manualRam !== null && (() => {
                const mt = getTierFromRam(manualRam * 0.5);
                return (
                  <div className={`border p-4 ${mt.borderColor} ${mt.bg} mt-2`}>
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <span className={`font-mono text-xs font-bold px-2 py-1 border ${mt.borderColor} ${mt.color}`}>{mt.badge}</span>
                      <span className={`text-xl font-bold ${mt.color}`}>{mt.name} Tier</span>
                      <span className="text-muted-foreground font-mono text-xs">{mt.ram} RAM</span>
                    </div>
                    <ul className="space-y-1 mb-3">
                      {mt.models.map(m => (
                        <li key={m} className="flex items-center gap-2 text-sm font-mono">
                          <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />{m}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Server className="w-4 h-4 text-primary flex-shrink-0" />
                      {mt.backend}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <button onClick={reset} className="text-xs font-mono text-muted-foreground/50 hover:text-primary underline underline-offset-2 transition-colors">
            ← Run scan again
          </button>
        </div>
      )}

      {/* MANUAL state */}
      {phase === 'manual' && (
        <div className="space-y-4">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">How much RAM does your device have?</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MANUAL_RAM.map((opt) => (
              <button
                key={opt.label}
                onClick={() => { setManualRam(opt.value); setManualDone(false); }}
                className={`border px-3 py-3 text-sm font-mono transition-all text-center ${manualRam === opt.value ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => { if (manualRam !== null) setManualDone(true); }}
            disabled={manualRam === null}
            className="px-8 py-3 bg-primary text-primary-foreground font-bold uppercase tracking-wider font-mono disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            Show my tier
          </button>
          {manualDone && manualRam !== null && (() => {
            const mt = getTierFromRam(manualRam * 0.5);
            return (
              <div className={`border p-5 sm:p-6 ${mt.borderColor} ${mt.bg}`}>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className={`font-mono text-xs font-bold px-2 py-1 border ${mt.borderColor} ${mt.color}`}>{mt.badge}</span>
                  <span className={`text-2xl font-bold ${mt.color}`}>{mt.name} Tier</span>
                  <span className="text-muted-foreground font-mono text-sm">{mt.ram} RAM</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-2">Models that fit your device</p>
                    <ul className="space-y-1">
                      {mt.models.map(m => (
                        <li key={m} className="flex items-center gap-2 text-sm text-foreground font-mono">
                          <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />{m}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wide mb-2">Backend llamdrop would pick</p>
                    <div className="flex items-start gap-2">
                      <Server className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm font-mono text-foreground">{mt.backend}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
          <button onClick={reset} className="text-xs font-mono text-muted-foreground/50 hover:text-primary underline underline-offset-2 transition-colors block">
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}

const INVISIBLE_WORK = [
  { q: "Which backend should I use?",        a: "llamdrop auto-selects from llama.cpp, Ollama, CUDA, ROCm, Vulkan, Metal, or IPEX-LLM based on your exact chip and OS." },
  { q: "What quantization level do I need?", a: "It reads your live available RAM at download time and picks the optimal Q4/Q2/Q5/IQ variant automatically." },
  { q: "Will this model crash my device?",   a: "Only models confirmed to fit your available RAM appear in the list. If you see it, it runs." },
  { q: "What flags and commands do I run?",  a: "None. llamdrop generates all llama.cpp flags (threads, context, GPU layers, mmap) internally based on your hardware profile." },
  { q: "How do I install the right backend?", a: "The installer handles it. CUDA toolchains, Vulkan drivers, Ollama detection — all done for you." },
  { q: "What model is right for my device?", a: "The model browser filters automatically to your tier. You see only what works. Everything else is hidden." },
];

const FEATURES = [
  { icon: Brain,          title: "Full device profiling",        desc: "Reads RAM, CPU model & flags (AVX2/AVX512/NEON), GPU vendor, big.LITTLE core layout, Android SoC/API level, and storage type. Runs once on first launch." },
  { icon: Shield,         title: "Crash-safe model filtering",   desc: "Only shows models that fit your available RAM with the right quantization. If it's listed, it runs. No OOM errors, no guesswork." },
  { icon: Layers,         title: "Auto quantization selection",  desc: "Reads live RAM at download time, picks the best Q4/Q2/Q5/IQ variant. IQ3_M / IQ2_M support for better quality at the same memory budget." },
  { icon: Search,         title: "HuggingFace live search",      desc: "Browse any GGUF model on HuggingFace from inside the terminal UI. Live RAM estimates calculated from file size and quant type." },
  { icon: Zap,            title: "7 inference backends",         desc: "Auto-selects from llama.cpp, Ollama, CUDA, ROCm, Vulkan, Metal, or IPEX-LLM. Android GPU safety built-in — never forces Vulkan on Mali (it's slower than CPU)." },
  { icon: Download,       title: "Resilient downloader",         desc: "Auto-resumes on connection drops, retries automatically, SHA-256 verified. Partial downloads deleted on cancel — never shown as valid models." },
  { icon: MonitorSpeaker, title: "Live RAM & battery monitor",   desc: "Colour-coded RAM bar (green/yellow/red) warns before you hit a crash. Per-inference battery drain tracking with configurable low threshold alerts." },
  { icon: Database,       title: "Session save / load",          desc: "Save, load, and delete conversations. Auto-saves every 5 exchanges. Smart context trimming prevents OOM while always preserving your first exchange." },
];

type ScreenId =
  | 'menu' | 'start-chat' | 'browse' | 'hf-search' | 'hf-results'
  | 'downloaded' | 'sessions' | 'device-info' | 'doctor'
  | 'config' | 'update' | 'language' | 'help' | 'quit';

const BROWSE_MODELS = [
  { icon: "●", name: "SmolLM2 135M",             type: "fast/chat",      quant: "Q4_K_M", size: "0.10GB", ram: "0.5GB",  fit: "Great",   fc: "text-green-400",  dl: false, bench: "" },
  { icon: "●", name: "SmolLM2 360M",             type: "fast/chat",      quant: "Q4_K_M", size: "0.25GB", ram: "0.8GB",  fit: "Great",   fc: "text-green-400",  dl: false, bench: "" },
  { icon: "●", name: "TinyLlama 1.1B",           type: "fast/chat",      quant: "Q4_K_M", size: "0.67GB", ram: "1.2GB",  fit: "Great",   fc: "text-green-400",  dl: false, bench: "" },
  { icon: "●", name: "Gemma 3 1B",               type: "chat/fast",      quant: "Q4_K_M", size: "0.70GB", ram: "1.2GB",  fit: "Great",   fc: "text-primary",    dl: true,  bench: "⚡8t/s" },
  { icon: "●", name: "Qwen2.5 0.5B",             type: "fast/chat",      quant: "Q4_K_M", size: "0.40GB", ram: "1.0GB",  fit: "Great",   fc: "text-green-400",  dl: false, bench: "" },
  { icon: "●", name: "SmolLM2 1.7B",             type: "chat/fast",      quant: "Q4_K_M", size: "1.10GB", ram: "1.8GB",  fit: "Good",    fc: "text-cyan-400",   dl: false, bench: "" },
  { icon: "●", name: "Qwen3 1.7B",               type: "chat/reasoning", quant: "Q4_K_M", size: "1.20GB", ram: "2.0GB",  fit: "Good",    fc: "text-cyan-400",   dl: false, bench: "" },
  { icon: "●", name: "Qwen2.5 1.5B",             type: "chat/coding",    quant: "Q4_K_M", size: "1.00GB", ram: "2.0GB",  fit: "Good",    fc: "text-cyan-400",   dl: false, bench: "" },
  { icon: "●", name: "Qwen2.5 Coder 1.5B",       type: "coding",         quant: "Q4_K_M", size: "1.00GB", ram: "2.0GB",  fit: "Good",    fc: "text-cyan-400",   dl: false, bench: "" },
  { icon: "●", name: "LLama 3.2 1B",             type: "chat",           quant: "Q4_K_M", size: "0.80GB", ram: "1.6GB",  fit: "Good",    fc: "text-cyan-400",   dl: false, bench: "" },
  { icon: "○", name: "DeepSeek R1 Distill 1.5B", type: "reasoning/math", quant: "Q4_K_M", size: "1.00GB", ram: "1.8GB",  fit: "Good",    fc: "text-cyan-400",   dl: false, bench: "" },
  { icon: "○", name: "Phi-4 Mini 3.8B",          type: "reasoning",      quant: "IQ2_M",  size: "1.20GB", ram: "2.0GB",  fit: "Good",    fc: "text-cyan-400",   dl: false, bench: "" },
  { icon: "○", name: "Gemma 2 2B",               type: "chat/reasoning", quant: "Q2_K",   size: "1.00GB", ram: "2.2GB",  fit: "Tight",   fc: "text-yellow-400", dl: false, bench: "" },
  { icon: "○", name: "Qwen3 4B",                 type: "chat/reasoning", quant: "IQ2_M",  size: "1.65GB", ram: "2.1GB",  fit: "Tight",   fc: "text-yellow-400", dl: false, bench: "" },
  { icon: "○", name: "Qwen3.5 4B",               type: "chat/reasoning", quant: "IQ2_M",  size: "1.70GB", ram: "2.1GB",  fit: "Tight",   fc: "text-yellow-400", dl: false, bench: "" },
  { icon: "○", name: "SmolLM3 3B",               type: "chat/reasoning", quant: "IQ3_M",  size: "1.60GB", ram: "2.0GB",  fit: "Good",    fc: "text-cyan-400",   dl: false, bench: "" },
];

const HF_MODELS = [
  { name: "gemma4-coding-agent",                      size: "3.0B",  quant: "Q4_K_M", ram: "2.0GB", fit: "Good fit",  fc: "text-cyan-400",  verified: false },
  { name: "Ziya-Coding-34B-v1.0-GGUF",               size: "34.0B", quant: "Q4_K_M", ram: "0.0GB", fit: "—",         fc: "text-red-400",   verified: false },
  { name: "Quasar-3.7-Coding-i1-GGUF",               size: "(?)",   quant: "Q4_K_M", ram: "0.0GB", fit: "—",         fc: "text-red-400",   verified: false },
  { name: "Qwen3.5-18b-a3b-reap-coding-heretic-GGUF", size: "18.0B", quant: "Q4_K_M", ram: "0.0GB", fit: "—",         fc: "text-red-400",   verified: false },
  { name: "LLama-3-8b-liquid-coding-agent",           size: "8.0B",  quant: "Q4_K_M", ram: "0.0GB", fit: "—",         fc: "text-red-400",   verified: false },
  { name: "gemma3.5-18b-reap-coding-heretic-GGUF",    size: "18.0B", quant: "Q4_K_M", ram: "0.0GB", fit: "—",         fc: "text-red-400",   verified: false },
  { name: "gemma4-coding-agent (?)",                  size: "(?)",   quant: "Q4_K_M", ram: "2.0GB", fit: "Good fit",  fc: "text-cyan-400",  verified: false },
  { name: "CodingComplexityQwen3-0.6B-4bit",          size: "0.6B",  quant: "Q4_K_M", ram: "0.5GB", fit: "Great fit", fc: "text-green-400", verified: false },
];

function CliDemo() {
  const [screen, setScreen] = useState<ScreenId>('menu');
  const [fading, setFading] = useState(false);
  const [chatPhase, setChatPhase] = useState(0);
  const [hfPhase, setHfPhase] = useState(0);
  const [hfQuery, setHfQuery] = useState('');
  const [selectedBrowse, setSelectedBrowse] = useState(3);
  const [selectedHf, setSelectedHf] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const navigate = useCallback((to: ScreenId) => {
    setFading(true);
    setTimeout(() => {
      setScreen(to);
      setFading(false);
      if (contentRef.current) contentRef.current.scrollTop = 0;
      if (to === 'start-chat') setChatPhase(0);
      if (to === 'hf-search') { setHfPhase(0); setHfQuery(''); }
    }, 150);
  }, []);

  useEffect(() => {
    if (screen !== 'quit') return;
    const t = setTimeout(() => navigate('menu'), 2200);
    return () => clearTimeout(t);
  }, [screen, navigate]);

  useEffect(() => {
    if (screen !== 'hf-search' || hfPhase !== 0) return;
    const query = 'coding';
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setHfQuery(query.slice(0, i));
      if (i >= query.length) {
        clearInterval(iv);
        setTimeout(() => setHfPhase(1), 500);
        setTimeout(() => setHfPhase(2), 1800);
      }
    }, 120);
    return () => clearInterval(iv);
  }, [screen, hfPhase]);

  useEffect(() => {
    if (screen !== 'start-chat' || chatPhase !== 1) return;
    const t = setTimeout(() => setChatPhase(2), 1400);
    return () => clearTimeout(t);
  }, [screen, chatPhase]);

  const MENU_ITEMS: { id: ScreenId; sym: string; label: string; desc: string; highlight?: boolean }[] = [
    { id: 'start-chat',  sym: '🚀', label: 'Start chatting',       desc: 'Chat with a downloaded model',         highlight: true },
    { id: 'browse',      sym: '📥', label: 'Browse & downLoad',    desc: 'Find models that work on your device' },
    { id: 'hf-search',   sym: '🔍', label: 'Search HuggingFace',   desc: 'Search all GGUF models on HuggingFace' },
    { id: 'downloaded',  sym: '📁', label: 'My downloaded models', desc: 'See what you have installed' },
    { id: 'sessions',    sym: '💾', label: 'Resume saved session', desc: 'Continue a previous conversation' },
    { id: 'device-info', sym: '🔧', label: 'Device info',          desc: 'See your hardware specs' },
    { id: 'doctor',      sym: '🩺', label: 'Doctor',               desc: 'Check your install for issues' },
    { id: 'config',      sym: '⚙',  label: 'Config',               desc: 'View and edit your settings' },
    { id: 'update',      sym: '⬆',  label: 'Update LLamdrop',      desc: 'Pull latest version from GitHub' },
    { id: 'language',    sym: '🌐', label: 'Language / भाषा',      desc: 'Change display language' },
    { id: 'help',        sym: '❓', label: 'Help',                 desc: 'How to use LLamdrop' },
    { id: 'quit',        sym: '✖',  label: 'Quit',                 desc: '' },
  ];

  const TierBar = () => (
    <div className="px-2 py-1 bg-primary text-primary-foreground font-mono text-[9px] sm:text-[10px] flex items-center gap-2 flex-wrap border-b border-primary/30 flex-shrink-0">
      <span className="font-bold">RAM: 2.5GB free / 7.4GB</span>
      <span className="opacity-60">│</span>
      <span>MediaTek Dimensity 8</span>
      <span className="opacity-60">│</span>
      <span className="font-bold">Low (2-4GB)</span>
    </div>
  );

  const MainHdr = () => (
    <div className="px-3 py-1.5 border-b border-border/20 bg-black/60 font-mono text-[10px] leading-[1.55] flex-shrink-0">
      <div className="text-primary font-bold">llamdrop</div>
      <div className="text-muted-foreground/80">MediaTek Dimensity 800U — 8 cores (4 perf) — 2.5GB free / 7.4GB RAM
        <span className="text-primary ml-1 font-bold">[</span>
        <span className="text-primary">████████</span>
        <span className="text-primary font-bold">]</span>
        <span className="text-muted-foreground/60"> 2.47GB free</span>
      </div>
      <div className="text-green-400">Llama.cpp: ✓ ready — GPU: CPU only</div>
    </div>
  );

  const SubHdr = () => (
    <div className="px-3 py-1.5 border-b border-border/20 bg-black/60 font-mono text-[10px] leading-[1.55] flex-shrink-0">
      <div className="text-primary font-bold">LLamdrop</div>
      <div className="text-muted-foreground/70">Run AI on any device. No PC. No subscription. No struggle.</div>
      <div className="text-muted-foreground/50">v0.9.1 - Free forever - GPL v3 - github.com/ypatole035-ai/llamdrop<br />rop</div>
      <div className="text-muted-foreground/30 mt-0.5">{'─'.repeat(52)}</div>
    </div>
  );

  const BackBtn = () => (
    <div className="mt-3 pt-2 border-t border-border/20 text-[10px] font-mono text-muted-foreground/40">
      Press Enter to go back...{' '}
      <button onClick={() => navigate('menu')} className="text-primary hover:underline ml-1">← menu</button>
    </div>
  );

  const statusBar = () => {
    if (screen === 'menu') return '↑↓ Navigate  Enter Select  Q Quit';
    if (screen === 'browse' || screen === 'hf-results') return '↑↓ Navigate  Enter Select  C Filter  Q Quit';
    if (screen === 'quit') return '';
    return 'Enter to select  0 / ← back';
  };

  const renderContent = (): React.ReactNode => {
    switch (screen) {

      /* ─── MENU ─────────────────────────────────────────────── */
      case 'menu': return (
        <div className="font-mono text-[10px] sm:text-xs">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-start gap-0 text-left transition-all group py-[3px]
                ${item.highlight ? 'bg-primary/15 border-l-2 border-primary' : 'border-l-2 border-transparent hover:bg-white/[0.04] hover:border-primary/30'}`}
            >
              <span className="w-7 flex-shrink-0 pl-2 text-center">{item.sym}</span>
              <span className={`w-36 sm:w-44 flex-shrink-0 pr-2 transition-colors
                ${item.highlight ? 'text-primary font-bold' : 'text-foreground/90 group-hover:text-primary'}`}>
                {item.label}
              </span>
              {item.desc && (
                <span className="text-muted-foreground/55 truncate flex-1">
                  - {item.desc}
                </span>
              )}
            </button>
          ))}
        </div>
      );

      /* ─── START CHAT ───────────────────────────────────────── */
      case 'start-chat': return (
        <div className="font-mono text-[10px] sm:text-xs space-y-1.5">
          {/* Phase 0 — model selection */}
          <div className="text-muted-foreground/70">Scanning... 1 found &nbsp;&nbsp; on your device...</div>
          <div className="text-muted-foreground/70">done</div>

          <div className="mt-1">
            <div className="text-foreground font-bold">My downloaded models:</div>
            <div className="text-muted-foreground/40 text-[9px] my-0.5">— LLamdrop managed ————————————————————</div>
            <button
              onClick={() => { if (chatPhase === 0) setChatPhase(1); }}
              className={`flex gap-2 w-full text-left px-1 py-0.5 transition-colors
                ${chatPhase > 0 ? 'text-primary' : 'text-foreground hover:text-primary'}`}
            >
              <span className="text-muted-foreground/60">[1]</span>
              <span>google_gemma-3-1b-it-Q4_K_M.gguf</span>
              <span className="text-muted-foreground/60">(0.75GB)</span>
              {chatPhase === 0 && <span className="text-muted-foreground/50 hidden sm:inline">← click to start</span>}
            </button>
          </div>

          {chatPhase === 0 && (
            <div className="text-muted-foreground/60 mt-1">
              Enter number to chat, X+number to delete (e.g. X1), or 0 to go back: <span className="animate-pulse text-foreground">▋</span>
            </div>
          )}

          {chatPhase >= 1 && (
            <>
              <div className="border-t border-border/30 pt-2 mt-2 space-y-0.5 text-muted-foreground/80">
                <div className="text-foreground font-bold">Launch settings:</div>
                <div className="grid grid-cols-[auto_1fr] gap-x-3 mt-1">
                  {[
                    ["Model",   "google_gemma-3-1b-it-Q4_K_M.gguf (downloaded)"],
                    ["Threads", "4 (auto-tuned for your CPU)"],
                    ["Context", "4096 tokens"],
                    ["Batch",   "128"],
                    ["GPU",     "CPU only  (GPU hardware detected but Vulkan driver not confirmed)"],
                    ["mmap",    "ON (model on internal storage - lower RAM usage)"],
                  ].map(([k, v]) => (
                    <><span key={`k-${k}`} className="text-cyan-400 flex-shrink-0">{k}</span>
                    <span key={`v-${k}`} className="text-muted-foreground/70">: &nbsp;{v}</span></>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/30 pt-2 mt-1 space-y-0.5">
                <div className="text-cyan-400 font-bold">🔗 Attach a file? (focused mode)</div>
                <div className="text-primary text-[9px] sm:text-[10px]">Supported: .txt .md .pdf .csv .json .log .py and more</div>
                <div className="text-muted-foreground/70">Press Enter to skip and start normal chat</div>
                <div className="text-muted-foreground/50 mt-1 text-[9px] sm:text-[10px]">Common paths:</div>
                <div className="text-muted-foreground/40 text-[9px] leading-[1.6]">
                  /data/data/com.termux/files/home/storage/shared/Download<br />
                  /data/data/com.termux/files/home/downloads<br />
                  /data/data/com.termux/files/home/.llamdrop
                </div>
                <div className="text-muted-foreground/70 mt-1">File path (or Enter to skip):</div>
              </div>
            </>
          )}

          {chatPhase === 1 && (
            <div className="text-muted-foreground/70">
              Press Enter to start chatting...<span className="animate-pulse text-foreground ml-1">▋</span>
            </div>
          )}

          {chatPhase === 2 && (
            <div className="space-y-1.5 pt-1">
              <div className="border-t border-border/30 pt-1.5 space-y-0.5 text-[9px] sm:text-[10px] text-muted-foreground/60">
                <div className="text-primary/80">▶ Chat - google_gemma-3-1b-it-Q4_K_M.gguf</div>
                <div>RAM: 2.5GB free · Context: 4096 tokens</div>
                <div>Type /help for commands - Ctrl+C or /quit to exit</div>
                <div className="text-muted-foreground/40">{'─'.repeat(44)}</div>
              </div>
              <div className="space-y-1.5 text-[10px] sm:text-xs">
                <div className="text-green-400">🟢 RAM: 2.51GB free</div>
                <div className="flex gap-1.5">
                  <span className="text-muted-foreground/60 flex-shrink-0">You:</span>
                  <span className="text-foreground">hello</span>
                </div>
                <div className="flex gap-1.5">
                  <span className="text-primary flex-shrink-0">🦙</span>
                  <span className="text-muted-foreground/80 leading-relaxed">Hello there!! How can I help you today?</span>
                </div>
                <div className="text-green-400 text-[9px]">🟢 RAM: 2.71GB free</div>
                <div className="flex gap-1.5">
                  <span className="text-muted-foreground/60 flex-shrink-0">You:</span>
                  <span className="animate-pulse text-foreground">▋</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-border/20">
            <button onClick={() => navigate('menu')} className="text-[10px] font-mono text-muted-foreground/40 hover:text-primary transition-colors">
              ← back to menu
            </button>
          </div>
        </div>
      );

      /* ─── BROWSE ───────────────────────────────────────────── */
      case 'browse': return (
        <div className="font-mono space-y-0 text-[9px] sm:text-[10px]">
          <div className="space-y-0">
            {BROWSE_MODELS.map((m, i) => (
              <button
                key={i}
                onClick={() => setSelectedBrowse(i)}
                className={`w-full flex gap-1 px-1 py-[2.5px] text-left hover:bg-white/[0.05] transition-colors
                  ${selectedBrowse === i ? 'bg-primary/10 border-l-2 border-primary' : 'border-l-2 border-transparent'}
                  ${m.dl ? 'text-primary' : ''}`}
              >
                <span className={`${m.fc} flex-shrink-0 w-3`}>{m.icon}</span>
                <span className={`flex-1 truncate ${m.dl ? 'text-primary font-bold' : 'text-foreground/85'}`}>
                  {m.name}
                  {m.bench && <span className="text-primary ml-1">{m.bench}</span>}
                </span>
                <span className="text-muted-foreground/40 flex-shrink-0 hidden sm:inline">{m.type}</span>
                <span className="text-muted-foreground/55 flex-shrink-0 ml-1">{m.quant}</span>
                <span className="text-muted-foreground/65 flex-shrink-0 ml-1">{m.size}↓</span>
                <span className="text-muted-foreground/50 flex-shrink-0 ml-1">{m.ram} RAM</span>
                <span className={`${m.fc} flex-shrink-0 ml-1`}>{m.fit}</span>
              </button>
            ))}
          </div>
          {/* Model detail footer */}
          <div className="border-t border-border/30 mt-1 pt-1.5 px-1 space-y-0.5">
            <div className="text-foreground font-bold">{BROWSE_MODELS[selectedBrowse].name}</div>
            <div className="text-muted-foreground/55">
              Best for: u, l, t, r, a, -, f, a, s, t,&nbsp;&nbsp;,r, e, s, p, o, n, s,
            </div>
            <div className="text-muted-foreground/55">Languages: english</div>
            <div className="text-muted-foreground/55">License: Apache 2.0</div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-border/20">
            <button onClick={() => navigate('menu')} className="text-[10px] font-mono text-muted-foreground/40 hover:text-primary transition-colors">
              ← back to menu
            </button>
          </div>
        </div>
      );

      /* ─── HF SEARCH ────────────────────────────────────────── */
      case 'hf-search': return (
        <div className="font-mono text-[10px] sm:text-xs space-y-2.5">
          <div className="text-foreground font-bold">Search HuggingFace</div>
          <div className="text-yellow-400">⚠ These results are unverified - RAM estimates only.</div>
          <div className="mt-1">
            <span className="text-muted-foreground/70">Search HuggingFace (e.g. "qwen coding" or "LLama chat"): </span>
            <span className="text-foreground">{hfQuery}</span>
            {hfPhase === 0 && <span className="animate-pulse text-primary">▋</span>}
          </div>
          {hfPhase >= 1 && (
            <div className="text-muted-foreground/70">Searching HuggingFace...</div>
          )}
          {hfPhase >= 2 && (
            <div className="space-y-1">
              <div className="text-foreground">Found 9 compatible models. Opening browser...</div>
              <div className="animate-pulse text-primary">▋</div>
              <button
                onClick={() => navigate('hf-results')}
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors text-[10px] mt-1 block"
              >
                → View results
              </button>
            </div>
          )}
          <div className="mt-3 pt-2 border-t border-border/20">
            <button onClick={() => navigate('menu')} className="text-[10px] font-mono text-muted-foreground/40 hover:text-primary transition-colors">
              ← back to menu
            </button>
          </div>
        </div>
      );

      /* ─── HF RESULTS ───────────────────────────────────────── */
      case 'hf-results': return (
        <div className="font-mono space-y-0 text-[9px] sm:text-[10px]">
          <div className="space-y-0">
            {HF_MODELS.map((m, i) => (
              <button
                key={i}
                onClick={() => setSelectedHf(i)}
                className={`w-full flex gap-1 px-1 py-[2.5px] text-left hover:bg-white/[0.05] transition-colors
                  ${selectedHf === i ? 'bg-primary/10 border-l-2 border-primary' : 'border-l-2 border-transparent'}`}
              >
                <span className={`${m.fc} flex-shrink-0 w-3`}>●</span>
                <span className="flex-1 truncate text-foreground/80">{m.name}</span>
                <span className="text-muted-foreground/40 flex-shrink-0 ml-1">?</span>
                <span className="text-muted-foreground/55 flex-shrink-0 ml-1">{m.quant}</span>
                <span className="text-muted-foreground/65 flex-shrink-0 ml-1">{m.size}↓</span>
                <span className="text-muted-foreground/50 flex-shrink-0 ml-1">{m.ram}</span>
                <span className={`${m.fc} flex-shrink-0 ml-1`}>{m.fit}</span>
              </button>
            ))}
          </div>
          <div className="border-t border-border/30 mt-1 pt-1.5 px-1 space-y-0.5">
            <div className="text-foreground font-bold">{HF_MODELS[selectedHf].name}</div>
            <div className="text-muted-foreground/55">Best for: general chat</div>
            <div className="text-muted-foreground/55">Languages: english</div>
            <div className="text-muted-foreground/55">License: unknown</div>
            <div className="text-yellow-400">Note: ⚠ Unverified - RAM estimate from file size only. Downloa</div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-border/20">
            <button onClick={() => navigate('menu')} className="text-[10px] font-mono text-muted-foreground/40 hover:text-primary transition-colors">
              ← back to menu
            </button>
          </div>
        </div>
      );

      /* ─── DOWNLOADED ───────────────────────────────────────── */
      case 'downloaded': return (
        <div className="font-mono text-[10px] sm:text-xs space-y-1.5">
          <div className="text-muted-foreground/70">Scanning... 1 found &nbsp;&nbsp; on your device...</div>
          <div className="text-muted-foreground/70">done</div>
          <div className="mt-1">
            <div className="text-foreground font-bold">My downloaded models:</div>
            <div className="text-muted-foreground/40 text-[9px] my-0.5">— LLamdrop managed ————————————————————</div>
            <div className="flex gap-2 px-1 py-0.5 text-foreground">
              <span className="text-muted-foreground/60">[1]</span>
              <span>google_gemma-3-1b-it-Q4_K_M.gguf</span>
              <span className="text-muted-foreground/60">(0.75GB)</span>
            </div>
          </div>
          <div className="text-muted-foreground/60 mt-1">
            Enter number to chat, X+number to delete (e.g. X1), or 0 to go back: <span className="animate-pulse text-foreground">▋</span>
          </div>
          <BackBtn />
        </div>
      );

      /* ─── SESSIONS ─────────────────────────────────────────── */
      case 'sessions': return (
        <div className="font-mono text-[10px] sm:text-xs space-y-1.5">
          <div className="text-foreground font-bold">Resume saved session:</div>
          <div className="mt-1 space-y-0.5">
            {[
              { id: 1, model: "google_gemma-3-1b-it-Q4_K_M.gguf", msgs: 6,  date: "2026-04-28 18:27" },
              { id: 2, model: "google_gemma-3-1b-it-Q4_K_M.gguf", msgs: 4,  date: "2026-04-28 18:25" },
            ].map(s => (
              <div key={s.id} className="flex flex-wrap gap-x-2 text-foreground/90">
                <span className="text-muted-foreground/60">[{s.id}]</span>
                <span>{s.model}</span>
                <span className="text-muted-foreground/55">- {s.msgs} messages  -  {s.date}</span>
              </div>
            ))}
          </div>
          <div className="text-muted-foreground/60 mt-1">
            Enter number to resume, D+number to delete (e.g. D2), or 0 to go back: <span className="animate-pulse text-foreground">▋</span>
          </div>
          <BackBtn />
        </div>
      );

      /* ─── DEVICE INFO ──────────────────────────────────────── */
      case 'device-info': return (
        <div className="font-mono text-[9px] sm:text-[10px] space-y-1.5">
          {[
            ["Platform", "termux"],
            ["Chip",     "MediaTek Dimensity 800U"],
            ["Cores",    "8 (4 perf + 4 eff)"],
            ["Arch",     "aarch64"],
            ["RAM total","7.4 GB"],
            ["RAM free", "2.5 GB"],
            ["Swap/zram","1.5 GB free"],
            ["Effective","3.4 GB"],
            ["Storage",  "16.4 GB free / 107.5 GB"],
            ["Tier",     "Low (2-4GB)"],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-1">
              <span className="text-cyan-400 w-20 flex-shrink-0">{k}</span>
              <span className="text-muted-foreground/50">:</span>
              <span className="text-foreground/85">{v}</span>
            </div>
          ))}
          <div className="pt-0.5">
            <div className="text-cyan-400 font-bold uppercase text-[9px]">GPU / Acceleration</div>
            <div className="text-yellow-400">⚠ GPU detected but Vulkan driver not confirmed — using CPU only</div>
          </div>
          <div>
            <div className="text-cyan-400 font-bold uppercase text-[9px]">Runtime</div>
            {[["Threads","4"],["Context","4096 tokens"],["Batch","128"],["Backend","llama.cpp"]].map(([k,v]) => (
              <div key={k} className="flex gap-1">
                <span className="text-muted-foreground/60 w-16 flex-shrink-0">{k}</span>
                <span className="text-muted-foreground/40">=</span>
                <span className="text-foreground/85">{v}</span>
              </div>
            ))}
          </div>
          <div className="pt-0.5">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="flex-1 h-1.5 bg-border/30 rounded-full overflow-hidden">
                <div className="h-full bg-primary/70 rounded-full" style={{width:"66%"}} />
              </div>
              <span className="text-muted-foreground/55 text-[9px]">4.9 / 7.4 GB used</span>
            </div>
            <div className="text-green-400">✓ RAM looks good for running a model.</div>
          </div>
          <BackBtn />
        </div>
      );

      /* ─── DOCTOR ───────────────────────────────────────────── */
      case 'doctor': return (
        <div className="font-mono text-[9px] sm:text-[10px] space-y-1.5">
          {[
            { label: "Storage",       items: ["Free : 16.4 GB", "Total : 107.5 GB", "Models : 1 downloaded (0.75 GB)", "✓ Storage OK"] },
            { label: "Install dirs",  items: ["✓ ~/.llamdrop", "✓ ~/.llamdrop/models", "✓ ~/.llamdrop/sessions", "✓ ~/.llamdrop/bin"] },
            { label: "Model catalog", items: ["✓ models.json valid — v0.9.1, 41 models, updated 2026-04-27"] },
            { label: "Network",       items: ["✓ GitHub reachable", "✓ HuggingFace API reachable"] },
            { label: "Python",        items: ["✓ Python 3.13.3", "✓ curses module available"] },
            { label: "Benchmarks",    items: ["⚡ 8 t/s — google_gemma-3-1b-it-Q4_K_M", "5 runs avg · Last: 2026-04-29 18:43"] },
          ].map(({ label, items }) => (
            <div key={label}>
              <div className="text-cyan-400 font-bold uppercase text-[9px] border-b border-border/20 pb-0.5 mb-0.5">{label}</div>
              {items.map((line) => (
                <div key={line} className={`leading-[1.55]
                  ${line.startsWith("✓") ? "text-green-400" : line.startsWith("⚡") ? "text-yellow-400" : "text-muted-foreground/60"}`}>
                  {line}
                </div>
              ))}
            </div>
          ))}
          <div className="pt-1 border-t border-border/20">
            <div className="text-green-400 font-bold">✓ Everything looks good!</div>
            <div className="text-muted-foreground/50">llamdrop is healthy and ready to use.</div>
          </div>
          <BackBtn />
        </div>
      );

      /* ─── CONFIG ───────────────────────────────────────────── */
      case 'config': return (
        <div className="font-mono text-[9px] sm:text-[10px] space-y-2">
          <div>
            <span className="text-foreground font-bold">LLamdrop config</span>
            <span className="text-muted-foreground/40 ml-1">(/data/data/com.termux/files/home/.LLamdrop/con</span>
          </div>
          <div className="text-muted-foreground/40">fig.json)</div>
          <div className="space-y-[2px] pt-1">
            {[
              ["threads",            "auto-detected", "(auto)"],
              ["context_size",       "auto-detected", "(auto)"],
              ["batch_size",         "auto-detected", "(auto)"],
              ["max_tokens",         "512",           "(auto)"],
              ["temperature",        "0.7",           ""],
              ["system_prompt",      "auto-detected", "(auto)"],
              ["auto_save_sessions", "True",          ""],
              ["warn_battery_below", "15",            "(auto)"],
            ].map(([k, v, note]) => (
              <div key={k} className="flex gap-2">
                <span className="text-cyan-400 w-28 sm:w-36 flex-shrink-0">{k}</span>
                <span className="text-foreground/85 flex-1">{v}</span>
                <span className="text-muted-foreground/40">{note}</span>
              </div>
            ))}
          </div>
          <div className="text-muted-foreground/50 pt-1 space-y-0.5 leading-[1.6]">
            <div>Edit /data/data/com.termux/files/home/.LLamdrop/config.json to</div>
            <div>hange settings.</div>
            <div>Delete a key to let LLamdrop auto-detect it.</div>
          </div>
          <BackBtn />
        </div>
      );

      /* ─── UPDATE ───────────────────────────────────────────── */
      case 'update': return (
        <div className="font-mono text-[10px] sm:text-xs space-y-1.5">
          <div className="text-foreground font-bold">Update LLamdrop</div>
          <div className="mt-1 space-y-0.5">
            <div className="text-foreground font-bold">LLamdrop self-update</div>
            <div className="text-muted-foreground/70 mt-1">Checking GitHub for latest version...</div>
            <div className="text-muted-foreground/70">Installed : <span className="text-foreground">v0.9.1</span></div>
            <div className="text-muted-foreground/70">Available : <span className="text-foreground">v0.9.1</span></div>
          </div>
          <div className="text-green-400 font-bold mt-1">✓ Already up to date!</div>
          <BackBtn />
        </div>
      );

      /* ─── LANGUAGE ─────────────────────────────────────────── */
      case 'language': return (
        <div className="font-mono text-[10px] sm:text-xs space-y-1.5">
          <div className="text-foreground font-bold">Choose your Language / अपनी भाषा चुनें:</div>
          <div className="mt-1.5 space-y-0.5">
            {[
              [1, "English",     "",              true],
              [2, "हिन्दी",      "(Hindi)",       false],
              [3, "Español",     "(Spanish)",     false],
              [4, "Português",   "(Portuguese)",  false],
              [5, "العربية",     "(Arabic)",      false],
            ].map(([id, name, native, curr]) => (
              <div key={String(id)} className={`flex gap-2 ${curr ? 'text-foreground' : 'text-muted-foreground/70'}`}>
                <span className="text-muted-foreground/50">[{id}]</span>
                <span>{name as string}</span>
                {native && <span className="text-muted-foreground/50">{native as string}</span>}
              </div>
            ))}
          </div>
          <div className="mt-1 text-muted-foreground/60">
            Enter number: <span className="animate-pulse text-foreground">▋</span>
          </div>
          <BackBtn />
        </div>
      );

      /* ─── HELP ─────────────────────────────────────────────── */
      case 'help': return (
        <div className="font-mono text-[9px] sm:text-[10px] space-y-2">
          <div className="text-foreground font-bold">Help:</div>
          <div className="space-y-0.5 text-muted-foreground/70 leading-[1.65]">
            <div>1. Go to "Browse &amp; download" - find a model for your device</div>
            <div>2. Pick a model - only ones that fit your RAM are shown</div>
            <div>3. Download it - quantization is chosen automatically</div>
            <div>4. Go to "Start chatting" - pick your model</div>
            <div>5. Chat! Type your message and press Enter</div>
          </div>
          <div>
            <div className="text-foreground font-bold">Or search HuggingFace for any GGUF model:</div>
            <div className="text-muted-foreground/70">Go to "Search HuggingFace" → type a keyword → browse results</div>
            <div className="text-yellow-400">⚠ Search results are unverified - RAM is estimated only</div>
          </div>
          <div>
            <div className="text-foreground font-bold">Chat commands:</div>
            {[
              ["/save",  "save this conversation"],
              ["/clear", "clear conversation history"],
              ["/ram",   "show current RAM usage"],
              ["/trim",  "manually trim old context to free RAM"],
              ["/quit",  "exit chat"],
            ].map(([cmd, desc]) => (
              <div key={cmd} className="flex gap-2 text-muted-foreground/70">
                <span className="text-foreground/90 w-12 flex-shrink-0">{cmd}</span>
                <span>- {desc}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="text-foreground font-bold">Tips:</div>
            <div className="space-y-0.5 text-muted-foreground/60 leading-[1.65]">
              <div>- Close other apps before chatting to free up RAM</div>
              <div>- If the model crashes, try a smaller one or Tier 1</div>
              <div>- LLamdrop auto-saves every 5 exchanges (10 messages)</div>
              <div>- Context is trimmed automatically when RAM gets low</div>
              <div>- Use "My downloaded models" to find GGUFs already on your phone</div>
            </div>
          </div>
          <BackBtn />
        </div>
      );

      /* ─── QUIT ─────────────────────────────────────────────── */
      case 'quit': return (
        <div className="font-mono text-[10px] sm:text-xs space-y-1 py-3">
          <div className="text-muted-foreground/60">Saving session state...</div>
          <div className="text-green-400">✓ Session saved.</div>
          <div className="mt-2 text-foreground">Goodbye. Thank you for using <span className="text-primary font-bold">LLamdrop</span>.</div>
          <div className="text-muted-foreground/50">Run AI on any device. Free forever. GPL v3.</div>
          <div className="mt-3 text-muted-foreground/40 text-[9px] animate-pulse">Exiting...</div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto select-none">
      <div
        className="border border-primary/30 bg-[#060606] shadow-[0_0_50px_rgba(212,255,0,0.06)] flex flex-col overflow-hidden"
        style={{ height: 'clamp(460px, 62vw, 560px)' }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-border/30 bg-card/30 flex-shrink-0">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground/50 flex-1 text-center">llamdrop — termux</span>
          {screen !== 'menu' && (
            <button onClick={() => navigate('menu')} className="text-[10px] font-mono text-muted-foreground/40 hover:text-primary transition-colors px-1">
              ← menu
            </button>
          )}
        </div>

        {/* App header */}
        {screen === 'menu' ? <MainHdr /> : <SubHdr />}

        {/* Tier bar for browse/hf-results */}
        {(screen === 'browse' || screen === 'hf-results') && <TierBar />}

        {/* Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto p-3 sm:p-4"
          style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.15s ease' }}
        >
          {renderContent()}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1 border-t border-border/20 bg-black/60 text-[9px] sm:text-[10px] font-mono text-muted-foreground/40 flex-shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            llamdrop v0.9.1
          </span>
          <span>{statusBar()}</span>
        </div>
      </div>
      <p className="text-center text-[10px] font-mono text-muted-foreground/35 mt-3">
        click any menu item to explore · interactive demo
      </p>
    </div>
  );
}

export default function Home() {
  const [heroVisible, setHeroVisible] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary selection:text-primary-foreground font-sans">

      {/* Nav */}
      <nav className="fixed top-0 w-full border-b border-border/40 bg-background/85 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="font-mono font-bold text-lg tracking-tight flex items-center gap-2">
            <TerminalSquare className="w-5 h-5 text-primary" />
            llamdrop
          </div>
          <a
            href="https://github.com/ypatole035-ai/llamdrop"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-mono border border-border px-4 py-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 sm:pt-36 pb-14 sm:pb-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div
          style={{
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.8s ease, transform 0.8s ease",
          }}
        >
          <div className="flex items-center gap-3 mb-8 flex-wrap">
            <span className="border border-primary text-primary px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider bg-primary/10">
              Open Source • GPL v3 • Free Forever
            </span>
            <span className="border border-border text-muted-foreground px-3 py-1 text-xs font-mono uppercase tracking-wider">v0.9.1</span>
            <span className="border border-border text-muted-foreground px-3 py-1 text-xs font-mono uppercase tracking-wider">Terminal Tool</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tighter leading-[1.05] mb-6 sm:mb-8">
            Run AI locally.<br />
            <span className="text-muted-foreground">Zero research.</span><br />
            <span className="text-primary underline decoration-primary underline-offset-8">Two commands.</span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mb-5 sm:mb-6 leading-relaxed">
            You shouldn't need to know what quantization is, which backend to install, or which model fits your RAM. llamdrop figures all of that out — silently, automatically, for any device from a phone to a workstation.
          </p>

          <div className="flex flex-wrap gap-3 sm:gap-5 mb-10 sm:mb-14 text-xs sm:text-sm font-mono text-muted-foreground">
            {["7 device tiers", "41 verified models", "HuggingFace live search", "7 auto-selected backends", "No configuration"].map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-primary" />{s}
              </span>
            ))}
          </div>

          <div className="max-w-4xl border border-border p-4 sm:p-6 bg-card/60 backdrop-blur space-y-5 sm:space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <TerminalBlock label="Linux / Android (Termux) / macOS" command="curl -sL https://raw.githubusercontent.com/ypatole035-ai/llamdrop/main/install.sh | bash" />
              <TerminalBlock label="Windows (PowerShell as Admin)" command="irm https://raw.githubusercontent.com/ypatole035-ai/llamdrop/main/install.ps1 | iex" />
            </div>
            <div className="pt-4 border-t border-dashed border-border">
              <TerminalBlock label="Then just run" command="llamdrop" />
            </div>
            <p className="text-xs font-mono text-muted-foreground">
              No compilation. No configuration files. No account. No subscription.
            </p>
            <p className="text-xs font-mono text-muted-foreground/50 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-primary/50 flex-shrink-0" />
              Everything runs on your device. llamdrop only connects to the internet when you download a model.
            </p>
          </div>
        </div>
      </section>

      {/* CLI Demo */}
      <FadeIn className="py-14 sm:py-20 px-4 sm:px-6 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <p className="text-xs font-mono text-primary uppercase tracking-widest mb-3">See it in action</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">This is what llamdrop actually looks like.</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Running on an Android phone via Termux. No PC. No server. A full AI terminal — straight from the app store.
            </p>
          </div>
          <CliDemo />
          <p className="mt-6 text-center text-[11px] font-mono text-muted-foreground/40 max-w-2xl mx-auto">
            <AlertTriangle className="w-3 h-3 inline mr-1 text-yellow-400/50" />
            Output quality depends on your device tier and model size. Smaller models on lower-tier hardware hallucinate more and may struggle with complex reasoning. Use the device scanner below to see what tier you're on.
          </p>
        </div>
      </FadeIn>

      {/* The real problem */}
      <FadeIn className="py-14 sm:py-24 px-4 sm:px-6 bg-background border-y border-border">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div>
            <p className="text-xs font-mono text-primary uppercase tracking-widest mb-4">Why llamdrop exists</p>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-5 sm:mb-6 leading-tight">Running local AI was a research project before it was a tool.</h2>
            <div className="space-y-4 sm:space-y-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
              <p>Before llamdrop, getting local AI running meant hours of research: which backend supports your GPU, which quantization fits your RAM, which model won't crash, which flags to pass to llama.cpp.</p>
              <p>Most people gave up. Or broke their system. Or downloaded a model that ate all their RAM on the first prompt.</p>
              <p className="text-foreground font-mono border-l-2 border-primary pl-4 py-1 text-base">
                llamdrop hides all of that. You run one command. It detects your hardware, picks the right backend, filters models to what fits, selects the right quantization, and starts a chat.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Questions you no longer need to answer</p>
            {INVISIBLE_WORK.map((item, i) => (
              <div
                key={i}
                className="border border-border bg-background cursor-pointer"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="flex items-center justify-between p-4 gap-3">
                  <span className="font-mono text-sm text-foreground">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-primary flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </div>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground border-t border-border/40 pt-3 leading-relaxed">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Before vs After */}
      <BeforeAfterTerminal />

      {/* Find my tier */}
      <FadeIn className="py-14 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="mb-10">
          <p className="text-xs font-mono text-primary uppercase tracking-widest mb-3">7 Device Tiers</p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4">Works on everything.<br />From Termux to workstations.</h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            llamdrop supports 7 hardware tiers. Select your RAM below to see which tier you land in and which models would run — this is exactly what llamdrop does automatically when you launch it.
          </p>
        </div>
        <FindMyTier />
      </FadeIn>

      {/* Two-layer model system */}
      <FadeIn className="py-14 sm:py-24 px-4 sm:px-6 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-mono text-primary uppercase tracking-widest mb-3">Model Browser</p>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4">41 verified models.<br />The entire HuggingFace GGUF library.</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Two layers — a curated catalog for safe out-of-box experience, and a live HuggingFace search for when you want to go further.
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="border border-primary/40 bg-primary/5 p-5 sm:p-8 relative overflow-hidden">
              <div className="absolute top-4 right-4 opacity-20"><Star className="w-5 h-5 text-primary" /></div>
              <p className="text-xs font-mono text-primary uppercase tracking-widest mb-4">Layer 1 — Verified Catalog</p>
              <h3 className="text-2xl font-bold mb-4">Curated. Community-confirmed. Crash-proof.</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                41 models with confirmed performance data from users across platforms — Reddit, Discord, GitHub issues, and community testing. Every entry has validated RAM requirements and proven quantization settings for each tier.
              </p>
              <ul className="space-y-2 font-mono text-sm">
                {[
                  "Filtered to your exact device tier automatically",
                  "Quantization picked at download time from live RAM",
                  "SHA-256 verified. Benchmark scores tracked (rolling avg, last 5 runs)",
                  "Llama 3, Qwen2.5/3, DeepSeek R1, Gemma 3, Phi-4, Mistral, and more",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />{item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-border bg-background p-5 sm:p-8">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Layer 2 — HuggingFace Live Search</p>
              <h3 className="text-2xl font-bold mb-4">Browse any GGUF model. Download directly.</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Search HuggingFace from inside the terminal UI. Live RAM estimates are calculated on the fly from file size and quantization type. For users who want to go beyond the curated catalog.
              </p>
              <ul className="space-y-2 font-mono text-sm">
                {[
                  "Live search from inside the terminal — no browser needed",
                  "Live RAM estimates before you commit to downloading",
                  "Same resilient downloader — auto-resumes on connection drops",
                  "Clearly marked unverified — no false confidence",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-muted-foreground">
                    <Search className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />{item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-start gap-3 border border-yellow-400/25 bg-yellow-400/5 p-3">
                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] font-mono text-yellow-200/60 leading-relaxed">
                  HuggingFace search results are <span className="text-yellow-400">unverified</span>. RAM estimates are calculated from file size only — actual usage may differ. Models outside the verified catalog have not been tested for crashes, compatibility, or output quality on low-end hardware.
                </p>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Features */}
      <FadeIn className="py-14 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="mb-8 sm:mb-12">
          <p className="text-xs font-mono text-primary uppercase tracking-widest mb-3">Under the Hood</p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold">Everything handled.<br />Nothing to configure.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="border border-border bg-card p-6 hover:border-primary/50 transition-colors group relative overflow-hidden"
            >
              <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <f.icon className="w-28 h-28" />
              </div>
              <f.icon className="w-7 h-7 text-primary mb-4" />
              <h3 className="font-bold text-sm mb-2 leading-tight uppercase tracking-wide">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* Platforms */}
      <FadeIn className="py-14 sm:py-24 px-4 sm:px-6 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 sm:mb-12">
            <p className="text-xs font-mono text-primary uppercase tracking-widest mb-3">Platform Support</p>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4">If it runs Linux or has a terminal,<br />llamdrop runs on it.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Smartphone,     label: "Android via Termux",          note: "Primary test platform — built and tested here first. CPU-only, GPU-safe." },
              { icon: Laptop,         label: "Linux (any distro)",           note: "x86_64 or ARM64. Vulkan, CUDA, ROCm, and Ollama all auto-detected." },
              { icon: Cpu,            label: "Raspberry Pi 4 / 5",          note: "Full ARM64 support. SBCs, Orange Pi, and embedded Linux boards." },
              { icon: Globe,          label: "macOS (Apple Silicon & Intel)", note: "M-series via Metal/Ollama. Intel via CPU backend. Both auto-configured." },
              { icon: TerminalSquare, label: "Windows (native)",             note: "PowerShell installer. CUDA and Vulkan auto-detected. No WSL required." },
              { icon: Server,         label: "Servers & Workstations",       note: "Linux servers, NAS nodes, research clusters, multi-GPU rigs." },
            ].map((item) => (
              <div key={item.label} className="border border-border p-5 flex items-start gap-4 bg-background hover:border-primary/50 transition-colors">
                <item.icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-mono font-bold text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* CTA */}
      <FadeIn className="py-20 sm:py-32 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="inline-block p-4 border border-primary/30 bg-primary/5 mb-8">
          <Shield className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-5 sm:mb-6">
          Free forever.<br /><span className="text-primary">By license.</span>
        </h2>
        <p className="text-base sm:text-xl text-muted-foreground mb-4 leading-relaxed max-w-xl mx-auto">
          GPL v3. It cannot be sold. It cannot be closed off. That's not a promise — it's written into the license.
        </p>
        <p className="text-sm font-mono text-muted-foreground mb-12">
          One terminal command. Any device. Any model. No account.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://github.com/ypatole035-ai/llamdrop"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors font-mono"
          >
            <Github className="w-5 h-5" />
            View on GitHub
          </a>
          <a
            href="https://github.com/ypatole035-ai/llamdrop/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-border bg-card px-8 py-4 font-bold uppercase tracking-wider hover:border-primary transition-colors font-mono"
          >
            Read Docs
          </a>
        </div>
      </FadeIn>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/40 text-sm text-muted-foreground font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TerminalSquare className="w-4 h-4 text-primary" />
            <span>llamdrop v0.9.1 &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>GPL v3 Licensed</span>
            <span className="text-border">|</span>
            <a href="https://github.com/ypatole035-ai/llamdrop" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
