import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GELS, type Gel } from "@/lib/gels";
import { findMatches, type Match } from "@/lib/matcher";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: GelStackApp,
});

function GelStackApp() {
  const [mode, setMode] = useState<"gel" | "custom">("gel");
  const [targetGelNum, setTargetGelNum] = useState<string>("106");
  const [customHex, setCustomHex] = useState<string>("#e10a17");
  const [maxStack, setMaxStack] = useState<1 | 2 | 3>(2);
  const [advanced, setAdvanced] = useState(false);
  const [inventory, setInventory] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const targetHex = useMemo(() => {
    if (mode === "gel") {
      return GELS.find((g) => g.number === targetGelNum)?.hex ?? "#ffffff";
    }
    return /^#[0-9a-fA-F]{6}$/.test(customHex) ? customHex : "#ffffff";
  }, [mode, targetGelNum, customHex]);

  const matches = useMemo<Match[]>(() => {
    const inv = advanced && inventory.size > 0 ? Array.from(inventory) : null;
    return findMatches({
      targetGelNumber: mode === "gel" ? targetGelNum : undefined,
      targetHex: mode === "custom" ? targetHex : undefined,
      maxStack,
      inventory: inv,
      topN: 12,
    });
  }, [mode, targetGelNum, targetHex, maxStack, advanced, inventory]);

  const filteredGels = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return GELS;
    return GELS.filter(
      (g) =>
        g.number.includes(q) || g.name.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-md"
              style={{
                background:
                  "linear-gradient(135deg,#e10a17 0%,#fbb000 50%,#0078d6 100%)",
              }}
              aria-hidden
            />
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                LightMix Pro
              </h1>
              <p className="text-xs text-muted-foreground">
                Lee Filters combination finder · subtractive stacking
              </p>
            </div>
          </div>
          <div className="hidden text-xs text-muted-foreground md:block">
            {GELS.length} gels in catalog
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[380px_1fr]">
        {/* Left: input panel */}
        <section className="space-y-6">
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Target color
            </h2>

            <Tabs
              value={mode}
              onValueChange={(v) => setMode(v as "gel" | "custom")}
              className="mt-4"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="gel">Lee gel</TabsTrigger>
                <TabsTrigger value="custom">Custom color</TabsTrigger>
              </TabsList>

              <TabsContent value="gel" className="mt-4">
                <Label className="text-xs text-muted-foreground">
                  Choose a Lee filter to recreate
                </Label>
                <Select value={targetGelNum} onValueChange={setTargetGelNum}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {GELS.map((g) => (
                      <SelectItem key={g.number} value={g.number}>
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-sm border border-border/60"
                            style={{ backgroundColor: g.hex }}
                          />
                          <span className="font-mono text-xs">
                            L{g.number}
                          </span>
                          <span className="text-sm">{g.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="custom" className="mt-4 space-y-3">
                <Label className="text-xs text-muted-foreground">
                  HEX or color picker
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customHex}
                    onChange={(e) => setCustomHex(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-md border border-border bg-transparent"
                    aria-label="Color picker"
                  />
                  <Input
                    value={customHex}
                    onChange={(e) => setCustomHex(e.target.value)}
                    className="font-mono"
                    placeholder="#ff0000"
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Live target preview */}
            <div className="mt-5 overflow-hidden rounded-lg border border-border/60">
              <div
                className="h-24 w-full"
                style={{ backgroundColor: targetHex }}
              />
              <div className="flex items-center justify-between bg-muted/40 px-3 py-2 text-xs">
                <span className="text-muted-foreground">Target</span>
                <span className="font-mono">{targetHex.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Search options
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Max gels per stack</Label>
                  <span className="font-mono text-sm">{maxStack}</span>
                </div>
                <Slider
                  value={[maxStack]}
                  min={1}
                  max={3}
                  step={1}
                  onValueChange={(v) => setMaxStack(v[0] as 1 | 2 | 3)}
                  className="mt-2"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  More gels = better match, less light
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3">
                <div>
                  <Label className="text-sm">Advanced mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Only suggest from your stock
                  </p>
                </div>
                <Switch checked={advanced} onCheckedChange={setAdvanced} />
              </div>
            </div>
          </div>

          {advanced && (
            <div className="rounded-xl border border-border/60 bg-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  My inventory
                </h2>
                <Badge variant="secondary" className="font-mono">
                  {inventory.size}
                </Badge>
              </div>
              <Input
                placeholder="Search gels…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mt-3"
              />
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setInventory(new Set(filteredGels.map((g) => g.number)))
                  }
                >
                  Select all
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInventory(new Set())}
                >
                  Clear
                </Button>
              </div>
              <ScrollArea className="mt-3 h-72 rounded-md border border-border/60">
                <ul className="divide-y divide-border/40">
                  {filteredGels.map((g) => {
                    const checked = inventory.has(g.number);
                    return (
                      <li
                        key={g.number}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30"
                      >
                        <Checkbox
                          id={`inv-${g.number}`}
                          checked={checked}
                          onCheckedChange={(v) => {
                            const next = new Set(inventory);
                            if (v) next.add(g.number);
                            else next.delete(g.number);
                            setInventory(next);
                          }}
                        />
                        <span
                          className="h-5 w-5 rounded-sm border border-border/60"
                          style={{ backgroundColor: g.hex }}
                        />
                        <label
                          htmlFor={`inv-${g.number}`}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          <span className="font-mono text-xs text-muted-foreground">
                            L{g.number}
                          </span>{" "}
                          {g.name}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            </div>
          )}
        </section>

        {/* Right: results */}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Suggested combinations
              </h2>
              <p className="text-sm text-muted-foreground">
                Ranked by ΔE accuracy with brightness penalty
              </p>
            </div>
            <Badge variant="outline" className="font-mono">
              {matches.length} results
            </Badge>
          </div>

          {matches.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
              No combinations found. Try increasing max stack size or adding
              more gels to your inventory.
            </div>
          ) : (
            <ul className="grid gap-3">
              {matches.map((m, i) => (
                <ResultCard
                  key={m.gels.map((g) => g.number).join("+")}
                  match={m}
                  rank={i + 1}
                  targetHex={targetHex}
                />
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        Approximate subtractive color math · designed to upgrade to spectral
        data later
      </footer>
    </div>
  );
}

function ResultCard({
  match,
  rank,
  targetHex,
}: {
  match: Match;
  rank: number;
  targetHex: string;
}) {
  const { gels, resultHex, deltaE, brightness } = match;
  const lightLossPct = Math.round((1 - brightness) * 100);
  const accuracyTier =
    deltaE < 5
      ? { label: "Excellent", tone: "text-emerald-400" }
      : deltaE < 12
        ? { label: "Good", tone: "text-amber-400" }
        : { label: "Approximate", tone: "text-orange-400" };

  return (
    <li className="rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/40">
      <div className="flex items-stretch gap-4">
        {/* Rank */}
        <div className="flex w-10 flex-col items-center justify-center rounded-md bg-muted/40 font-mono text-sm">
          <span className="text-muted-foreground">#</span>
          <span className="text-base">{rank}</span>
        </div>

        {/* Color comparison */}
        <div className="flex w-40 shrink-0 overflow-hidden rounded-md border border-border/60">
          <div
            className="flex-1"
            style={{ backgroundColor: targetHex }}
            title="Target"
          />
          <div
            className="flex-1"
            style={{ backgroundColor: resultHex }}
            title="Stacked result"
          />
        </div>

        {/* Combo */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {gels.map((g, i) => (
              <Gel
                key={g.number + i}
                g={g}
                connector={i < gels.length - 1}
              />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
            <Stat
              label="Accuracy"
              value={`ΔE ${deltaE.toFixed(1)}`}
              hint={accuracyTier.label}
              hintClass={accuracyTier.tone}
            />
            <Stat
              label="Light loss"
              value={`${lightLossPct}%`}
              hint={
                lightLossPct < 40
                  ? "Bright"
                  : lightLossPct < 70
                    ? "Dim"
                    : "Very dim"
              }
              hintClass={
                lightLossPct < 40
                  ? "text-emerald-400"
                  : lightLossPct < 70
                    ? "text-amber-400"
                    : "text-orange-400"
              }
            />
            <Stat
              label="Result"
              value={resultHex.toUpperCase()}
              mono
            />
          </div>
        </div>
      </div>
    </li>
  );
}

function Gel({ g, connector }: { g: Gel; connector: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="h-6 w-6 rounded-sm border border-border/60"
        style={{ backgroundColor: g.hex }}
      />
      <span className="text-sm">
        <span className="font-mono text-xs text-muted-foreground">
          L{g.number}
        </span>{" "}
        <span className="text-foreground">{g.name}</span>
      </span>
      {connector && (
        <span className="px-1 text-muted-foreground">+</span>
      )}
    </span>
  );
}

function Stat({
  label,
  value,
  hint,
  hintClass,
  mono,
}: {
  label: string;
  value: string;
  hint?: string;
  hintClass?: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-md bg-muted/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={cn("text-sm", mono && "font-mono")}>{value}</div>
      {hint && (
        <div className={cn("text-[10px]", hintClass ?? "text-muted-foreground")}>
          {hint}
        </div>
      )}
    </div>
  );
}
