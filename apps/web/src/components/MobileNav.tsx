import { ChevronDownIcon, MenuIcon, XIcon } from "lucide-react";
import { Dialog } from "radix-ui";
import { useState } from "react";
import type { Game } from "@/lib/games";
import { resolveHref } from "@/lib/links";
import type { NavLink } from "@/lib/nav";
import { cn } from "@/lib/utils";

/** Menu mobile plein écran, relevé maxroll.gg : Accueil puis accordéon « Jeux ». */
export default function MobileNav({ games, links, current }: { games: readonly Game[]; links: NavLink[]; current: string }) {
  const [openGame, setOpenGame] = useState<string | null>(games.find((g) => current.startsWith(g.href))?.slug ?? null);
  return (
    <Dialog.Root>
      <Dialog.Trigger className="flex size-[44px] items-center justify-center text-white md:hidden" aria-label="Ouvrir le menu">
        <MenuIcon className="size-[24px]" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content className="bg-chrome fixed inset-0 z-[200] overflow-y-auto text-white data-[state=open]:animate-in data-[state=open]:fade-in-0" aria-describedby={undefined}>
          <div className="flex h-[60px] items-center justify-between px-[20px]">
            <Dialog.Title className="font-display text-[20px] font-semibold tracking-wide">Atreia</Dialog.Title>
            <Dialog.Close className="flex size-[44px] items-center justify-center" aria-label="Fermer le menu">
              <XIcon className="size-[24px]" />
            </Dialog.Close>
          </div>
          <div role="radiogroup" aria-label="Faction" className="mx-[20px] mb-[12px] flex rounded-md border border-white/10 p-0.5 text-sm">
            {[["elyos", "Elyos"], ["asmodien", "Asmodiens"]].map(([key, label]) => (
              <button key={key} type="button" role="radio" data-faction-btn={key}
                aria-checked={typeof document !== "undefined" && document.documentElement.dataset.faction === key}
                className="flex-1 rounded-[5px] px-2.5 py-1.5 font-medium text-white/60 aria-checked:bg-primary aria-checked:text-primary-foreground">
                {label}
              </button>
            ))}
          </div>
          <nav aria-label="Menu" className="pb-[32px]">
            <a href={resolveHref("/")} className={cn("block border-b border-white/10 px-[20px] py-[14px] text-[17px] font-semibold", current === "/" ? "text-white" : "text-white/75")}>Accueil</a>
            <p className="px-[20px] pt-[18px] pb-[6px] text-[12px] font-semibold tracking-[0.08em] text-white/45 uppercase">Jeux</p>
            {games.map((g) => {
              const expanded = openGame === g.slug;
              return (
                <div key={g.slug} className="border-b border-white/10">
                  <button type="button" aria-expanded={expanded} onClick={() => setOpenGame(expanded ? null : g.slug)}
                    className="flex w-full items-center justify-between px-[20px] py-[14px] text-left text-[17px] font-semibold">
                    {g.name}
                    <ChevronDownIcon className={cn("size-[18px] transition-transform", expanded && "rotate-180")} />
                  </button>
                  {expanded && (
                    <ul className="pb-[8px]">
                      {links.map((l) => (
                        <li key={l.href}>
                          <a href={resolveHref(l.href)} className={cn("block px-[32px] py-[10px] text-[15px]", l.href === current ? "text-primary font-semibold" : "text-white/70")}>{l.label}</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
