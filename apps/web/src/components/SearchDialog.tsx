import { SearchIcon } from "lucide-react";
import { Dialog } from "radix-ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { resolveHref } from "@/lib/links";
import { cn } from "@/lib/utils";
import { localizePath, ui, type Locale } from "@/lib/i18n";

export interface SearchItem {
  href: string;
  title: string;
  category: string;
  /** Résumé et titres de sections, pour élargir la recherche */
  text: string;
}

const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export default function SearchDialog({ items, label, locale = "en" }: { items: SearchItem[]; label?: string; locale?: Locale }) {
  const searchLabel = label ?? ui(locale, "Search", "Rechercher");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const indexed = useMemo(() => items.map((i) => ({ ...i, haystack: normalize(`${i.title} ${i.category} ${i.text}`) })), [items]);
  const results = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return indexed;
    return indexed
      .filter((i) => terms.every((t) => i.haystack.includes(t)))
      .sort((a, b) => Number(normalize(b.title).includes(terms[0] ?? "")) - Number(normalize(a.title).includes(terms[0] ?? "")));
  }, [indexed, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest("input, textarea, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setActive(0), [query]);

  const go = (href: string) => {
    window.location.href = resolveHref(localizePath(href, locale));
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={searchLabel}
          className="group flex h-[44px] w-[44px] items-center justify-center gap-[12px] text-left md:h-[24px] md:w-full md:justify-start"
        >
          <SearchIcon className="size-[22px] text-[#e8e8e8] md:size-[24px]" strokeWidth={1.5} aria-hidden="true" />
          <span className="hidden truncate text-[16px] leading-[20px] text-[#95989b] transition-colors group-hover:text-white md:inline">{searchLabel}</span>
          <kbd className="ml-auto hidden rounded-[4px] border border-[#2b2c2c] px-[6px] text-[11px] leading-[18px] whitespace-nowrap text-[#737373] lg:inline">Ctrl K</kbd>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-[250] bg-black/70 backdrop-blur-[2px]" />
        <Dialog.Content
          className="bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed top-[12vh] left-1/2 z-[251] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border shadow-2xl"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">{ui(locale, "Search the guides", "Rechercher dans les guides")}</Dialog.Title>
          <div className="flex items-center gap-2 border-b px-4">
            <SearchIcon className="text-muted-foreground size-4" aria-hidden="true" />
            <input
              id="search-guides"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                if (e.key === "Enter" && results[active]) go(results[active].href);
              }}
              placeholder={ui(locale, "Assassin, servers, subscription…", "Assassin, serveurs, abonnement…")}
              className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
              role="combobox"
              aria-expanded="true"
              aria-controls="search-results"
              aria-activedescendant={results[active] ? `result-${active}` : undefined}
            />
          </div>
          <ul id="search-results" ref={listRef} role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
            {results.length === 0 && (
              <li className="text-muted-foreground px-3 py-6 text-center text-sm">
                {ui(locale, "No guides match. Try a class, server, or a word like ‘Kinah’.", "Aucun guide ne correspond. Essaie un nom de classe, de serveur ou un mot comme « Kinah ».")}
              </li>
            )}
            {results.map((r, i) => (
              <li key={r.href} id={`result-${i}`} role="option" aria-selected={i === active}>
                <a
                  href={resolveHref(localizePath(r.href, locale))}
                  onMouseEnter={() => setActive(i)}
                  className={cn("block rounded-md px-3 py-2.5", i === active && "bg-accent")}
                >
                  <span className="block text-sm font-semibold">{r.title}</span>
                  <span className="text-muted-foreground block text-xs">{r.category}</span>
                </a>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
