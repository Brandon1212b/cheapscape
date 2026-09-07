import { Loader2, User, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePlayerLookup } from "@/hooks/usePlayerLookup";

export function MethodsRsnBar() {
  const { rsnDraft, setRsnDraft, activeRsn, playerQuery, loadRsn, clearRsn } = usePlayerLookup();

  return (
    <>
      <div className="relative min-w-0 flex-1">
        <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={rsnDraft}
          onChange={(e) => setRsnDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") loadRsn(rsnDraft);
          }}
          placeholder="RSN"
          className="h-11 pl-9 text-base"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <button
        type="button"
        onClick={() => loadRsn(rsnDraft)}
        className="inline-flex h-11 shrink-0 items-center rounded-full border border-border/60 bg-secondary/40 px-3 text-sm font-medium hover:bg-secondary/60"
      >
        Load
      </button>
      {activeRsn && (
        <button
          type="button"
          onClick={clearRsn}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:bg-secondary/50"
          title="Clear RSN"
        >
          <X className="size-4" />
        </button>
      )}
      {playerQuery.isFetching && (
        <p className="basis-full flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Looking up hiscores…
        </p>
      )}
      {playerQuery.isError && (
        <p className="basis-full text-[11px] text-destructive">Player not found on hiscores.</p>
      )}
    </>
  );
}
