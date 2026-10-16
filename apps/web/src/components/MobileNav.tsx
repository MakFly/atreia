import { MenuIcon, XIcon } from "lucide-react";
import { Dialog } from "radix-ui";
import { resolveHref } from "@/lib/links";
import type { NavLink } from "@/lib/nav";
import { cn } from "@/lib/utils";

/** Menu mobile plein écran : choix de faction puis les rubriques AION 2. */
export default function MobileNav({ links, current }: { links: NavLink[]; current: string }) {
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
            <ul>
              {links.map((l) => (
                <li key={l.href} className="border-b border-white/10">
                  <a href={resolveHref(l.href)} aria-current={l.href === current ? "page" : undefined}
                    className={cn("block px-[20px] py-[14px] text-[17px] font-semibold", l.href === current ? "text-primary" : "text-white/75")}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
