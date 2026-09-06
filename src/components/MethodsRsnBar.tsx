import { Loader2, User, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { WikiSweepButton } from "@/components/WikiSweepButton";
import { usePlayerLookup } from "@/hooks/usePlayerLookup";

export function MethodsRsnBar() {
  const { rsnDraft, setRsnDraft, activeRsn, playerQuery, loadRsn, clearRsn } = usePlayerLookup();

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <User className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={rsnDraft}
            onChange={(e) => setRsnDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadRsn(rsnDraft);
            }}
            placeholder="RSN"
            className="h-8 w-36 pl-7 text-base sm:w-44"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button
          type="button"
          onClick={() => loadRsn(rsnDraft)}
          className="h-8 rounded-md border border-border/60 bg-secondary/40 px-2.5 text-xs font-medium hover:bg-secondary/60"
        >
          Load
        </button>
        {activeRsn && (
          <button
            type="button"
            onClick={clearRsn}
            className="inline-flex size-8 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:bg-secondary/50"
            title="Clear RSN"
          >
            <X className="size-3.5" />
          </button>
        )}
        <div className="ml-auto">
          <WikiSweepButton />
        </div>
      </div>
      {playerQuery.isFetching && (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Looking up hiscores…
        </p>
      )}
      {playerQuery.isError && (
        <p className="text-[11px] text-destructive">Player not found on hiscores.</p>
      )}
    </>
  );
}
