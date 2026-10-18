import { useEffect, useId, useState } from "react";
import { NEWS_TOPICS, type NewsTopic, type OfficialNewsFeed, type OfficialNewsItem } from "@aion2/shared/browser";
import { localizePath, type Locale } from "@/lib/i18n";
import { ArrowDown, ArrowUpRight, CalendarDays, Gift, Megaphone, RefreshCw, ShieldCheck, ShoppingBag, Swords, Wrench } from "lucide-react";
import "@/styles/official-news.css";

const labels = {
  fr: { all: "Tout", patch: "Mises à jour", event: "Événements", pass: "BP / Daeva Pass", shop: "Boutique", maintenance: "Maintenances", notice: "Annonces" },
  en: { all: "All", patch: "Updates", event: "Events", pass: "BP / Daeva Pass", shop: "Shop", maintenance: "Maintenance", notice: "Announcements" },
};
const sourceLabels = {
  fr: { announcements: "Annonces", updates: "Notes de version", events: "Événements" },
  en: { announcements: "Announcements", updates: "Patch notes", events: "Events" },
};
const topicIcons = { patch: Swords, event: CalendarDays, pass: Gift, shop: ShoppingBag, maintenance: Wrench, notice: Megaphone };
const covers: Record<NewsTopic, string> = {
  patch: "trailer-launch-reveal.jpg", event: "steam-screenshot-10.jpg", pass: "steam-screenshot-09.jpg",
  shop: "steam-screenshot-05.jpg", maintenance: "steam-background.jpg", notice: "steam-screenshot-13.jpg",
};
function primaryTopic(item: OfficialNewsItem): NewsTopic {
  return (["pass", "patch", "event", "shop", "maintenance", "notice"] as const).find((topic) => item.topics.includes(topic)) ?? "notice";
}
function cover(item: OfficialNewsItem): string {
  if (/halloween|bonbon|trick.or.treat/i.test(item.title)) return "official-halloween-2026-costumes.jpg";
  return covers[primaryTopic(item)];
}

export default function OfficialNews({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const t = (en: string, fr: string) => locale === "fr" ? fr : en;
  const [feed, setFeed] = useState<OfficialNewsFeed>();
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(true);
  const [filter, setFilter] = useState<"all" | NewsTopic>("all");
  const [limit, setLimit] = useState(20);
  const [retry, setRetry] = useState(0);
  const listId = useId();
  const date = (value: string, time = false) => new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    day: "numeric", month: "short", year: "numeric", ...(time ? { hour: "2-digit", minute: "2-digit", timeZone: "UTC" } as const : { timeZone: "UTC" }),
  }).format(new Date(value));

  useEffect(() => {
    let active = true;
    let controller: AbortController | undefined;
    const refresh = async () => {
      if (document.hidden || controller) return;
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 12_000);
      setBusy(true);
      try {
        const response = await fetch(`/api/news/?lang=${locale}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error();
        const data = await response.json() as OfficialNewsFeed;
        if (!Array.isArray(data.items) || !Array.isArray(data.sources) || !Number.isFinite(Date.parse(data.checkedAt))) throw new Error();
        if (active) { setFeed(data); setFailed(false); }
      } catch {
        if (active) setFailed(true);
      } finally {
        window.clearTimeout(timeout);
        controller = undefined;
        if (active) setBusy(false);
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 300_000);
    const resume = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", resume);
    return () => {
      active = false;
      controller?.abort();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [locale, retry]);

  const items = (feed?.items ?? []).filter((item) => filter === "all" || item.topics.includes(filter));
  const shown = items.slice(0, compact ? 5 : limit);
  const warning = failed || feed?.partial;
  const select = (value: typeof filter) => { setFilter(value); setLimit(20); };

  const featured = feed ? [
    feed.items.find((item) => item.topics.includes("patch")),
    feed.items.find((item) => item.source === "events") ?? feed.items.find((item) => item.topics.includes("event")),
    feed.items.find((item) => item.topics.includes("pass")),
  ].filter((item, index, entries): item is OfficialNewsItem => Boolean(item) && entries.findIndex((entry) => entry?.id === item?.id) === index) : [];

  const card = (item: OfficialNewsItem, featuredIndex?: number) => {
    const topic = primaryTopic(item);
    const Icon = topicIcons[topic];
    const source = feed?.sources.find((entry) => entry.id === item.source);
    const isStale = failed || source?.state === "stale";
    const ended = item.endsAt && Date.parse(item.endsAt) <= Date.now();
    const image = cover(item);
    return <article className={`news-card${featuredIndex !== undefined ? " news-card-featured" : ""}${featuredIndex === 0 ? " news-card-featured-first" : ""}`}>
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="news-card-link">
        <div className="news-card-media">
          <picture>
            <source srcSet={`/images/${image.replace(/\.jpg$/, ".webp")}`} type="image/webp" />
            <img src={`/images/${image}`} alt="" width={1920} height={1080} loading={featuredIndex === 0 ? "eager" : "lazy"} decoding="async" />
          </picture>
          <span className="news-card-topic" data-topic={topic}><Icon size={13} aria-hidden="true" />{labels[locale][topic]}</span>
        </div>
        <div className="news-card-body">
          <h3 className="news-card-title">{item.title}</h3>
          {item.endsAt && <p className="news-card-end">{ended ? t("Ended ", "Terminé le ") : t("Until ", "Jusqu’au ")}<time dateTime={item.endsAt}>{date(item.endsAt, true)} UTC</time></p>}
          <div className="news-card-meta"><span>NC · AION 2</span><time dateTime={item.date}>{item.endsAt ? t("Starts ", "Début : ") : ""}{date(item.date)}</time><ArrowUpRight size={13} aria-hidden="true" /></div>
          {isStale && <span className="news-card-stale">{t("Saved entry", "Entrée en cache")}</span>}
          {item.updatedAt && Date.parse(item.updatedAt) - Date.parse(item.date) > 3_600_000 && <span className="sr-only">{t("Updated ", "Modifié le ")}<time dateTime={item.updatedAt}>{date(item.updatedAt, true)} UTC</time></span>}
          <span className="sr-only">{t("Official website, opens in a new tab", "Site officiel, s’ouvre dans un nouvel onglet")}</span>
        </div>
      </a>
    </article>;
  };

  return <div className={`official-news${compact ? " official-news-preview" : ""}`} data-official-news={compact ? "preview" : "full"}>
    {!compact && (featured.length > 0 || !feed && busy) && <section className="news-featured" aria-labelledby={`${listId}-featured`}>
      <h2 className="news-section-title" id={`${listId}-featured`}>{t("In the spotlight", "À la une")}</h2>
      <ul className="news-featured-list">{featured.map((item, index) => <li key={item.id}>{card(item, index)}</li>)}{!feed && busy && [0, 1, 2].map((index) => <li className="news-skeleton" key={`loading-${index}`} aria-hidden="true" />)}</ul>
    </section>}

    {!compact && <section aria-labelledby={`${listId}-heading`}>
      <div className="news-heading-row">
        <h2 className="news-section-title" id={`${listId}-heading`}>{t("Latest news", "Dernières publications")}</h2>
        <button type="button" disabled={busy} onClick={() => setRetry((value) => value + 1)} className="news-refresh"><RefreshCw size={14} aria-hidden="true" />{busy ? t("Checking…", "Vérification…") : t("Refresh", "Actualiser")}</button>
      </div>
      <div className="news-toolbar">
        <div role="group" aria-label={t("Filter news by topic", "Filtrer les actualités par sujet")} className="news-filters">
          {(["all", ...NEWS_TOPICS] as const).map((topic) => {
            const count = feed?.items.filter((item) => topic === "all" || item.topics.includes(topic)).length;
            return <button key={topic} type="button" aria-label={`${labels[locale][topic]}${count === undefined ? "" : ` (${count})`}`} aria-pressed={filter === topic} aria-controls={listId} onClick={() => select(topic)} className="news-filter">
              {labels[locale][topic]}{count !== undefined && <span aria-hidden="true" className="news-filter-count">{count}</span>}
            </button>;
          })}
        </div>
        {feed && <p className="news-results" role="status">{items.length} {items.length === 1 ? t("publication", "publication") : t("publications", "publications")}</p>}
      </div>
      <ul id={listId} className="news-grid" aria-label={t("Official AION 2 publications", "Publications officielles AION 2")}>
        {shown.map((item) => <li key={item.id}>{card(item)}</li>)}
      </ul>
      {!feed && busy && <div className="news-grid" aria-hidden="true">{[0, 1, 2].map((index) => <div key={index} className="news-skeleton" />)}</div>}
      {feed && !items.length && <p className="news-empty">{t("No recent publication in this category. Try another filter or browse the official archives.", "Aucune publication récente dans cette catégorie. Essaie un autre filtre ou consulte les archives officielles.")}</p>}
      {items.length > limit && <button type="button" onClick={() => setLimit((value) => value + 20)} className="news-load-more">{t("More news", "Plus d’actualités")}<ArrowDown size={15} aria-hidden="true" /></button>}
    </section>}

    {compact && <>
      <ul id={listId} className="news-preview-list" aria-label={t("Official AION 2 publications", "Publications officielles AION 2")}>{shown.map((item) => <li key={item.id}>{card(item)}</li>)}</ul>
      <a className="news-preview-more" href={localizePath("/actualites/", locale)}>{t("All AION 2 news", "Toutes les actualités AION 2")}<ArrowUpRight size={16} aria-hidden="true" /></a>
    </>}

    <div className="news-sync" data-warning={warning ? "true" : "false"}>
      <p role="status" aria-atomic="true" className="news-sync-status"><span className="news-sync-dot" aria-hidden="true" /><span>
        {failed ? t("Refresh unavailable. ", "Actualisation indisponible. ") : feed?.partial ? t("Some sources are unavailable. ", "Certaines sources sont indisponibles. ") : ""}
        {feed ? <>{t("Checked ", "Vérifié le ")}<time dateTime={feed.checkedAt}>{date(feed.checkedAt, true)} UTC</time>{warning && t(". Saved entries may be shown.", ". Des entrées en cache peuvent être affichées.")}</> : busy ? t("Loading official news…", "Chargement des actualités officielles…") : t("News unavailable. Use the official archive link below.", "Fil indisponible. Consulte les archives officielles ci-dessous.")}
      </span></p>
      {!warning && <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} aria-hidden="true" />{t("Official Global sources", "Sources officielles Global")}</span>}
      {compact && <button type="button" disabled={busy} onClick={() => setRetry((value) => value + 1)} className="news-refresh"><RefreshCw size={13} aria-hidden="true" />{t("Refresh", "Actualiser")}</button>}
    </div>

    {!compact && <details className="news-sources">
      <summary>{t("Sources and synchronization", "Sources et synchronisation")}</summary>
      <p>{t("Official Global publications, checked every five minutes while this page is visible. Categories are assigned from titles and summaries; a post may appear in several filters. Covers are AION 2 illustrations, not screenshots of each announcement.", "Publications officielles Global, vérifiées toutes les cinq minutes lorsque la page est visible. Classement d’après les titres et résumés : une annonce peut apparaître dans plusieurs filtres. Les visuels sont des illustrations AION 2, pas des captures de chaque annonce.")}</p>
      <ul className="news-source-list">{(feed?.sources ?? []).map((source) => <li key={source.id}>
        <a href={source.url} target="_blank" rel="noopener noreferrer">{sourceLabels[locale][source.id]}<ArrowUpRight size={13} aria-hidden="true" /></a>
        {source.syncedAt && <span>{date(source.syncedAt, true)} UTC</span>}
        {source.state !== "live" && <span className="text-amber-200">{source.state === "stale" ? t("saved copy", "copie en cache") : t("unavailable", "indisponible")}</span>}
      </li>)}</ul>
      <p>{t("This recent feed covers up to 75 announcements, 25 patch notes and 30 ongoing events per language. Dates come from NC; a pass announcement does not confirm that it is still on sale.", "Ce fil récent couvre jusqu’à 75 annonces, 25 notes de version et 30 événements en cours par langue. Les dates proviennent de NC. Une annonce de pass ne confirme pas qu’il est encore en vente.")}</p>
    </details>}
  </div>;
}
