import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bot,
  Mic,
  Send,
  Plus,
  User,
  MoreHorizontal,
  Trash2,
  Download,
  Copy,
  Sparkles,
  MessageSquare,
  Search,
  AlertTriangle,
  TrendingUp,
  Activity,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from "recharts";
import { KpiSection } from "@/components/panel/KpiSection";

// ---------- Types & storage ----------
type Role = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  ts: number;
  chart?: { title: string; data: { time: string; value: number }[] };
}

interface ChatThread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

const STORAGE_KEY = "paapeli.copilot.threads.v1";

const seedThread = (
  title: string = "New conversation",
  greeting: string = "Hi — I'm the Paapeli AI Co-Pilot. Ask me about device performance, anomalies, energy use, or forecasts. I can also draft reports and surface charts.",
): ChatThread => ({
  id: `t-${Date.now()}`,
  title,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [
    {
      id: `m-${Date.now()}`,
      role: "assistant",
      ts: Date.now(),
      content: greeting,
    },
  ],
});

const loadThreads = (): ChatThread[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [seedThread()];
    const arr = JSON.parse(raw) as ChatThread[];
    return arr.length ? arr : [seedThread()];
  } catch {
    return [seedThread()];
  }
};
const saveThreads = (t: ChatThread[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  } catch {}
};

// ---------- Mock AI ----------
const sampleSeries = () =>
  Array.from({ length: 12 }, (_, i) => ({
    time: `${String(i * 2).padStart(2, "0")}:00`,
    value: Math.round(40 + Math.sin(i / 2) * 18 + Math.random() * 8),
  }));

const mockReply = (q: string, t: (k: any) => string): ChatMessage => {
  const lower = q.toLowerCase();
  const id = `m-${Date.now()}-r`;
  const base = { id, role: "assistant" as const, ts: Date.now() };
  if (/(anomal|outlier|abnormal|شذوذ|ناهنجار)/.test(lower)) {
    return { ...base, content: t("copilotReplyAnomaly") };
  }
  if (/(forecast|fail|predict|تنبؤ|پیش‌بینی|خراب)/.test(lower)) {
    return { ...base, content: t("copilotReplyForecast") };
  }
  if (/(energy|power|consum|kwh|طاقة|انرژی|مصرف)/.test(lower)) {
    return {
      ...base,
      content: t("copilotReplyEnergy"),
      chart: { title: t("copilotReplyEnergyChart"), data: sampleSeries() },
    };
  }
  if (/(trend|temperature|performance|metric|اتجاه|روند|دما|عملکرد)/.test(lower)) {
    return {
      ...base,
      content: t("copilotReplyTrend"),
      chart: { title: t("copilotReplyTrendChart"), data: sampleSeries() },
    };
  }
  if (/(report|summary|export|تقرير|گزارش|خروجی)/.test(lower)) {
    return { ...base, content: t("copilotReplyReport") };
  }
  return { ...base, content: t("copilotReplyDefault") };
};

const titleFromMsg = (msg: string) =>
  msg.trim().split(/\s+/).slice(0, 6).join(" ").slice(0, 48) || "New conversation";

// ---------- Page ----------
const AIoTCoPilot = () => {
  const { isRTL, formatNumber, t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [threads, setThreads] = useState<ChatThread[]>(() => loadThreads());
  const [activeId, setActiveId] = useState<string>(() => loadThreads()[0].id);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ChatThread | null>(null);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const recogRef = useRef<any>(null);

  // persist
  useEffect(() => saveThreads(threads), [threads]);

  const active = threads.find((t) => t.id === activeId) || threads[0];

  // scroll to bottom on message changes
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [active?.messages.length, pending]);

  // KPIs
  const kpis = useMemo(() => {
    const allMsgs = threads.flatMap((t) => t.messages);
    return {
      conversations: threads.length,
      messages: allMsgs.length,
      insights: allMsgs.filter((m) => m.role === "assistant" && m.chart).length,
      today: allMsgs.filter(
        (m) => Date.now() - m.ts < 86_400_000 && m.role === "user",
      ).length,
    };
  }, [threads]);

  // filtered chat history
  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...threads]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .filter((t) =>
        q
          ? t.title.toLowerCase().includes(q) ||
            t.messages.some((m) => m.content.toLowerCase().includes(q))
          : true,
      );
  }, [threads, search]);

  // ---------- Actions ----------
  const newChat = () => {
    const th = seedThread(t("newConversation"), t("copilotSeedGreeting"));
    setThreads((prev) => [th, ...prev]);
    setActiveId(th.id);
    setInput("");
  };

  const selectThread = (id: string) => setActiveId(id);

  const deleteThread = (id: string) => {
    setThreads((prev) => {
      const next = prev.filter((th) => th.id !== id);
      const list = next.length
        ? next
        : [seedThread(t("newConversation"), t("copilotSeedGreeting"))];
      if (id === activeId) setActiveId(list[0].id);
      return list;
    });
    setConfirmDelete(null);
    toast({ title: t("copilotConversationDeleted") });
  };

  const renameThread = (id: string, title: string) =>
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title, updatedAt: Date.now() } : t)),
    );

  const send = (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || pending) return;
    const now = Date.now();
    const userMsg: ChatMessage = {
      id: `m-${now}`,
      role: "user",
      content: q,
      ts: now,
    };
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeId
          ? {
              ...t,
              title:
                t.messages.filter((m) => m.role === "user").length === 0
                  ? titleFromMsg(q)
                  : t.title,
              updatedAt: now,
              messages: [...t.messages, userMsg],
            }
          : t,
      ),
    );
    setInput("");
    setPending(true);
    setTimeout(() => {
      const reply = mockReply(q, t);
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeId
            ? { ...t, updatedAt: Date.now(), messages: [...t.messages, reply] }
            : t,
        ),
      );
      setPending(false);
    }, 700);
  };

  const regenerate = () => {
    if (!active) return;
    const lastUser = [...active.messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    // drop the last assistant if present
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== active.id) return t;
        const msgs = [...t.messages];
        if (msgs[msgs.length - 1]?.role === "assistant") msgs.pop();
        return { ...t, messages: msgs };
      }),
    );
    setPending(true);
    setTimeout(() => {
      const reply = mockReply(lastUser.content, t);
      setThreads((prev) =>
        prev.map((t) =>
          t.id === active.id
            ? { ...t, updatedAt: Date.now(), messages: [...t.messages, reply] }
            : t,
        ),
      );
      setPending(false);
    }, 600);
  };

  const copyMsg = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast({ title: t("copilotCopied") }),
      () => toast({ title: t("copilotCopyFailed"), variant: "destructive" }),
    );
  };

  const exportChat = () => {
    if (!active) return;
    const lines = active.messages.map(
      (m) =>
        `[${new Date(m.ts).toLocaleString()}] ${m.role.toUpperCase()}: ${m.content}`,
    );
    const blob = new Blob([lines.join("\n\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `copilot-${active.title.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: t("copilotConversationExported") });
  };

  // Voice input (browser SpeechRecognition with graceful fallback)
  const SpeechRec: any =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;
  const voiceSupported = !!SpeechRec;

  const toggleVoice = () => {
    if (!voiceSupported) {
      toast({ title: t("copilotVoiceUnsupportedToast") });
      return;
    }
    if (listening && recogRef.current) {
      recogRef.current.stop();
      setListening(false);
      return;
    }
    const r = new SpeechRec();
    r.lang = "en-US";
    r.interimResults = false;
    r.onresult = (ev: any) => {
      const text = ev.results?.[0]?.[0]?.transcript || "";
      setInput((prev) => (prev ? `${prev} ${text}` : text));
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    r.start();
    setListening(true);
  };

  // Quick prompts → drive into specific module routes/data
  const quickPrompts = [
    { label: t("promptDevicePerformance"), q: t("copilotQpPerformanceQ"), icon: Activity },
    { label: t("promptAnalyzeEnergy"), q: t("copilotQpEnergyQ"), icon: TrendingUp },
    { label: t("promptFindAnomalies"), q: t("copilotQpAnomaliesQ"), icon: AlertTriangle },
    { label: t("promptGenerateReport"), q: t("copilotQpReportQ"), icon: Sparkles },
  ];

  const lp = (p: string) => p; // co-pilot uses absolute paths already mapped by Panel routing

  // ---------- Render ----------
  return (
    <>
      <PageHeader
        title={t("aiCoPilotTitle")}
        count={kpis.conversations}
        countLabel={t("copilotCountLabel")}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportChat}>
              <Download className="h-4 w-4" />
              {t("export")}
            </Button>
            <Button size="sm" onClick={newChat}>
              <Plus className="h-4 w-4" />
              {t("copilotNewChatBtn")}
            </Button>
          </>
        }
      />


      {/* KPI cards — same language as Anomalies/Forecast */}
      <KpiSection storageKey="aiot-copilot" className="mb-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {[
          {
            label: t("conversationsLabel"),
            value: kpis.conversations,
            accent: "text-primary",
            bg: "from-primary/10 to-transparent",
            icon: MessageSquare,
          },
          {
            label: t("messagesLabel"),
            value: kpis.messages,
            accent: "text-blue-500",
            bg: "from-blue-50 to-transparent dark:from-blue-500/10",
            icon: Bot,
          },
          {
            label: t("copilotInsightsKpi"),
            value: kpis.insights,
            accent: "text-emerald-500",
            bg: "from-emerald-50 to-transparent dark:from-emerald-500/10",
            icon: Sparkles,
          },
          {
            label: t("askedToday"),
            value: kpis.today,
            accent: "text-amber-500",
            bg: "from-amber-50 to-transparent dark:from-amber-500/10",
            icon: Activity,
          },
        ].map((k, i) => (
          <div
            key={i}
            className={`relative rounded-lg border bg-card px-3 py-2.5 bg-gradient-to-br ${k.bg} border-border`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground truncate">
                {k.label}
              </span>
              <k.icon className={`h-3.5 w-3.5 shrink-0 ${k.accent}`} />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold leading-none">
                {formatNumber(k.value)}
              </span>
            </div>
          </div>
        ))}
      </div>
      </KpiSection>



      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-19rem)] min-h-[520px]">
        {/* Conversations sidebar */}
        <Card className="lg:col-span-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">{t("conversationsLabel")}</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={newChat}
                aria-label={t("newChat")}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("copilotSearchPh")}
                className="h-8 ps-7 text-xs"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                {t("copilotNoConversations")}
              </div>
            ) : (
              filteredThreads.map((th) => {
                const isActive = th.id === activeId;
                const preview =
                  th.messages[th.messages.length - 1]?.content.slice(0, 60) || "";
                return (
                  <div
                    key={th.id}
                    className={`group flex items-start gap-2 px-3 py-2.5 border-b cursor-pointer transition-colors ${
                      isActive ? "bg-primary/5 border-s-2 border-s-primary" : "hover:bg-muted/50"
                    }`}
                    onClick={() => selectThread(th.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{th.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {preview}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(th.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem
                          onSelect={() => {
                            const title = window.prompt(t("copilotRenamePrompt"), th.title);
                            if (title && title.trim()) renameThread(th.id, title.trim());
                          }}
                        >
                          {t("copilotRename")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => setConfirmDelete(th)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Main chat */}
        <Card className="lg:col-span-3 flex flex-col overflow-hidden">
          {/* header */}
          <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{active?.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t("copilotSubtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={regenerate}
                      disabled={pending}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("regenerateResponse")}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={exportChat}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("exportConversation")}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {active?.messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {m.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div className={`max-w-[80%] ${m.role === "user" ? "items-end" : ""}`}>
                  <div
                    className={`group rounded-lg p-3 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    {m.chart && (
                      <div className="mt-3 p-3 bg-background rounded-md border">
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <p className="text-xs font-medium text-foreground truncate">
                            {m.chart.title}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              toast({ title: t("copilotOpenedInDashboards") });
                              navigate("/dashboard");
                            }}
                          >
                            <Plus className="h-3 w-3" />
                            {t("copilotAddToDashboard")}
                          </Button>
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={m.chart.data}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="time" fontSize={11} />
                            <YAxis fontSize={11} />
                            <RTooltip />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                  <div
                    className={`mt-1 flex items-center gap-2 text-[10px] text-muted-foreground ${
                      m.role === "user" ? "justify-end" : ""
                    }`}
                  >
                    <span>{new Date(m.ts).toLocaleTimeString()}</span>
                    <button
                      className="hover:text-foreground inline-flex items-center gap-1"
                      onClick={() => copyMsg(m.content)}
                    >
                      <Copy className="h-3 w-3" />
                      {t("copilotCopy")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-pulse" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-pulse [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-pulse [animation-delay:240ms]" />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* composer */}
          <div className="border-t p-3 space-y-2">
            <div className="flex gap-2">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant={listening ? "default" : "outline"}
                        size="icon"
                        onClick={toggleVoice}
                        disabled={!voiceSupported}
                        aria-label={t("voiceInput")}
                      >
                        <Mic className={`h-4 w-4 ${listening ? "animate-pulse" : ""}`} />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {voiceSupported
                      ? listening
                        ? t("stopListening")
                        : t("voiceInput")
                      : t("voiceNotSupported")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                placeholder={t("copilotPlaceholder")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                className="flex-1"
                disabled={pending}
              />
              <Button onClick={() => send()} disabled={pending || !input.trim()}>
                <Send className="h-4 w-4" />
                {t("copilotSend")}
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {quickPrompts.map((p) => (
                <Badge
                  key={p.label}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent gap-1"
                  onClick={() => send(p.q)}
                >
                  <p.icon className="h-3 w-3" />
                  {p.label}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Delete confirmation modal (memory rule: destructive actions = modal) */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteConversation")}</DialogTitle>
            <DialogDescription>
              {t("copilotDeleteDesc").replace("{title}", confirmDelete?.title ?? "")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && deleteThread(confirmDelete.id)}
            >
              <Trash2 className="h-4 w-4" />
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIoTCoPilot;
