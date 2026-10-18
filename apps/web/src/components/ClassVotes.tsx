import { useEffect, useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import type { ClassKey } from "@aion2/shared/browser";
import { ui, type Locale } from "@/lib/i18n";

type Choice = "agree" | "disagree";
type Result = { agree: number; disagree: number; choice: Choice | null };

export default function ClassVotes({ classKey, name, revision, locale = "en" }: { classKey: ClassKey; name: string; revision: string; locale?: Locale }) {
  const [result, setResult] = useState<Result>({ agree: 0, disagree: 0, choice: null });
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const endpoint = `/api/class-votes/?class=${classKey}&revision=${encodeURIComponent(revision)}`;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setMessage("");
    fetch(endpoint, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        setResult(await response.json());
        setReady(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setMessage(ui(locale, "Votes are temporarily unavailable.", "Votes indisponibles pour le moment."));
      }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [endpoint, retry]);

  async function vote(choice: Choice) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice }),
      });
      if (!response.ok) throw new Error();
      setResult(await response.json());
      setMessage(ui(locale, "Vote saved. You can change it.", "Avis enregistré. Tu peux le modifier."));
    } catch {
      setMessage(ui(locale, "Vote not saved. Please try again shortly.", "Avis non enregistré. Réessaie dans un instant."));
    } finally {
      setBusy(false);
    }
  }

  const total = result.agree + result.disagree;
  const number = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB");
  return (
    <div className="min-w-[228px] max-w-[280px]" role="group" aria-label={ui(locale, `Rate ${name}'s grades`, `Valider les notes de ${name}`)} aria-busy={loading || busy}>
      <div className="flex flex-wrap gap-2">
        {(["agree", "disagree"] as const).map((choice) => {
          const selected = result.choice === choice;
          const Icon = choice === "agree" ? ThumbsUp : ThumbsDown;
          return <button key={choice} type="button" disabled={!ready || busy} aria-pressed={selected}
            onClick={() => vote(choice)}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#057af0] disabled:cursor-wait disabled:opacity-50 ${selected ? "border-[#057af0] bg-[#057af0]/20 text-white" : "border-[#404040] text-[#c5c8cb] hover:border-[#95989b] hover:text-white"}`}>
            <Icon size={16} aria-hidden="true" />
            {choice === "agree" ? ui(locale, "Agree", "Je valide") : ui(locale, "Needs review", "À revoir")}
          </button>;
        })}
      </div>
      <p className="mt-2 text-xs leading-5 text-[#95989b]">
        {ready ? total > 0
          ? locale === "fr"
            ? `${number.format(Math.round(result.agree / total * 100))} % valident · ${number.format(total)} avis`
            : `${number.format(Math.round(result.agree / total * 100))}% agree · ${number.format(total)} votes`
          : ui(locale, "No votes yet. Be the first!", "Aucun avis. Donne le premier !")
          : loading ? ui(locale, "Loading votes…", "Chargement des avis…") : ui(locale, "Results unavailable", "Résultats indisponibles")}
      </p>
      {!loading && !ready && <button type="button" onClick={() => setRetry((value) => value + 1)} className="min-h-11 rounded px-2 text-sm text-[#71b7ff] underline focus-visible:outline-2">{ui(locale, "Try again", "Réessayer")}</button>}
      <p role="status" className="text-xs leading-5 text-[#c5c8cb]">{busy ? ui(locale, "Saving…", "Enregistrement…") : message}</p>
    </div>
  );
}
