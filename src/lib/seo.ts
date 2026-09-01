/**
 * Open Desh - Enterprise SEO & Schema.org Structured Data Engine
 * Enables deep indexing across Google, Bing, Social Media crawlers (WhatsApp, Twitter/X, Facebook, LinkedIn)
 */

export interface SeoConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  structuredData?: Record<string, any> | Record<string, any>[];
}

const DEFAULT_SEO: Required<Omit<SeoConfig, "publishedTime" | "modifiedTime" | "structuredData">> = {
  title: "Open Desh — Open Voice, Open Desh | Civic Governance & Leader Accountability",
  description:
    "Open Desh (Open Voice, Open Desh) is India's premier civic governance and leader accountability ecosystem. Report municipal grievances with live GPS proof, track MLA/MP performance scorecards, and audit public infrastructure.",
  keywords: [
    "Open Desh",
    "Open Voice Open Desh",
    "Civic Tech India",
    "Leader Performance Scorecard",
    "Grievance Redressal",
    "Municipal Complaints",
    "RTI Legal Guidance",
    "Public Infrastructure Audit",
    "Jharkhand Civic Portal",
    "MLA Rating",
    "MP Performance Tracker"
  ],
  image: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80",
  url: typeof window !== "undefined" ? window.location.href : "https://opendesh.in",
  type: "website",
  author: "Open Desh Civic Initiative"
};

/**
 * Updates head metadata and injects schema.org JSON-LD
 */
export function updateSeo(config: SeoConfig = {}): void {
  if (typeof document === "undefined") return;

  const title = config.title ? `${config.title} | Open Desh` : DEFAULT_SEO.title;
  const description = config.description || DEFAULT_SEO.description;
  const keywords = config.keywords && config.keywords.length > 0 ? config.keywords.join(", ") : DEFAULT_SEO.keywords.join(", ");
  const image = config.image || DEFAULT_SEO.image;
  const url = config.url || (typeof window !== "undefined" ? window.location.href : DEFAULT_SEO.url);
  const type = config.type || DEFAULT_SEO.type;
  const author = config.author || DEFAULT_SEO.author;

  // 1. Update Title
  document.title = title;

  // 2. Helper to set or create meta tag
  const setMeta = (selector: string, attrName: string, attrValue: string, content: string) => {
    let el = document.querySelector(selector) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attrName, attrValue);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  // Standard Meta Tags
  setMeta('meta[name="description"]', "name", "description", description);
  setMeta('meta[name="keywords"]', "name", "keywords", keywords);
  setMeta('meta[name="author"]', "name", "author", author);
  setMeta('meta[name="robots"]', "name", "robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");

  // Open Graph
  setMeta('meta[property="og:title"]', "property", "og:title", title);
  setMeta('meta[property="og:description"]', "property", "og:description", description);
  setMeta('meta[property="og:image"]', "property", "og:image", image);
  setMeta('meta[property="og:url"]', "property", "og:url", url);
  setMeta('meta[property="og:type"]', "property", "og:type", type);
  setMeta('meta[property="og:site_name"]', "property", "og:site_name", "Open Desh");

  // Twitter Card
  setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
  setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
  setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
  setMeta('meta[name="twitter:image"]', "name", "twitter:image", image);

  // Canonical Link
  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalEl) {
    canonicalEl = document.createElement("link");
    canonicalEl.setAttribute("rel", "canonical");
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute("href", url);

  // 3. Schema.org JSON-LD Structured Data
  let jsonLdScript = document.getElementById("opendesh-structured-data") as HTMLScriptElement | null;
  if (!jsonLdScript) {
    jsonLdScript = document.createElement("script");
    jsonLdScript.id = "opendesh-structured-data";
    jsonLdScript.type = "application/ld+json";
    document.head.appendChild(jsonLdScript);
  }

  // Base Organization & WebSite Schemas
  const baseSchemas: Record<string, any>[] = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Open Desh",
      "alternateName": "Open Voice, Open Desh",
      "url": "https://opendesh.in",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://opendesh.in/search?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "GovernmentOrganization",
      "name": "Open Desh Civic Governance Portal",
      "url": "https://opendesh.in",
      "logo": "https://opendesh.in/logo.png",
      "description": "Public civic technology portal for grievance redressal and elected leader accountability in India.",
      "sameAs": [
        "https://twitter.com/OpenDesh",
        "https://instagram.com/OpenDesh"
      ]
    }
  ];

  if (config.structuredData) {
    if (Array.isArray(config.structuredData)) {
      baseSchemas.push(...config.structuredData);
    } else {
      baseSchemas.push(config.structuredData);
    }
  }

  jsonLdScript.textContent = JSON.stringify(baseSchemas);
}

/**
 * SEO helper for Public Profiles (Citizens, Leaders, Officials)
 */
export function buildProfileSeo(profile: {
  fullName: string;
  username: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  category?: string;
  verified?: boolean;
  systemScore?: number;
  publicRating?: number;
}): SeoConfig {
  const isLeader = profile.category === "leader" || profile.category === "official";
  const title = `${profile.fullName} (@${profile.username}) ${isLeader ? "— Leader Scorecard & Performance" : "— Verified Citizen Profile"}`;
  const description = profile.bio
    ? `${profile.bio} (Location: ${profile.location || "India"})${profile.systemScore ? ` • System Score: ${profile.systemScore}/100` : ""}${profile.publicRating ? ` • Public Rating: ${profile.publicRating}★` : ""}`
    : `View official governance performance, civic reports, and citizen rating for ${profile.fullName} on Open Desh.`;

  const structuredData: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": isLeader ? "Person" : "Person",
    "name": profile.fullName,
    "alternateName": `@${profile.username}`,
    "description": description,
    "image": profile.avatarUrl,
    "homeLocation": {
      "@type": "Place",
      "name": profile.location || "India"
    },
    ...(profile.publicRating && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": profile.publicRating.toString(),
        "bestRating": "5",
        "worstRating": "1",
        "ratingCount": "100"
      }
    })
  };

  return {
    title,
    description,
    image: profile.avatarUrl || DEFAULT_SEO.image,
    type: "profile",
    keywords: [
      profile.fullName,
      profile.username,
      `${profile.fullName} Open Desh`,
      `${profile.fullName} Rating`,
      `${profile.fullName} Scorecard`,
      profile.location || "India",
      "Civic Representative"
    ],
    structuredData
  };
}

/**
 * SEO helper for Grievance Reports (Google Rich Snippets)
 */
export function buildReportSeo(report: {
  id: string;
  text: string;
  category: string;
  authorName: string;
  authorUsername: string;
  location?: { address?: string };
  images?: string[];
  createdAt?: string | number;
  status?: string;
  urgencyLevel?: string;
}): SeoConfig {
  const shortText = report.text.length > 120 ? report.text.slice(0, 117) + "..." : report.text;
  const address = report.location?.address || "India";
  const title = `[${report.category}] ${shortText} — ${address}`;
  const description = `Civic Grievance Report #${report.id}: "${report.text}" reported by @${report.authorUsername} at ${address}. Status: ${report.status || "OPEN"}. Track official department response on Open Desh.`;

  const imageUrl = report.images && report.images.length > 0 ? report.images[0] : DEFAULT_SEO.image;

  const structuredData: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "@id": `https://opendesh.in/post/${report.id}`,
    "headline": title,
    "articleBody": report.text,
    "articleSection": report.category,
    "datePublished": new Date(report.createdAt || Date.now()).toISOString(),
    "author": {
      "@type": "Person",
      "name": report.authorName,
      "url": `https://opendesh.in/u/${report.authorUsername}`
    },
    "contentLocation": {
      "@type": "Place",
      "name": address
    },
    "image": imageUrl,
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/CommentAction"
    }
  };

  return {
    title,
    description,
    image: imageUrl,
    type: "article",
    keywords: [
      report.category,
      address,
      "Civic Grievance",
      "Open Desh Report",
      report.authorUsername,
      report.urgencyLevel || "Municipal Issue"
    ],
    structuredData
  };
}

/**
 * SEO helper for Help Center Articles & RTI Legal Guides (Google FAQ / Article Rich Result)
 */
export function buildHelpArticleSeo(article: {
  slug: string;
  title: string;
  englishTitle?: string;
  summary: string;
  englishSummary?: string;
  categoryLabel?: string;
  tags?: string[];
  faqQuestions?: Array<{ question: string; answer: string; englishQuestion?: string; englishAnswer?: string }>;
}): SeoConfig {
  const title = `${article.title} (${article.englishTitle || ""}) — Legal RTI & Civic Guide`;
  const description = article.summary || article.englishSummary || "Learn citizen rights, government SLA standards, and RTI guidance on Open Desh.";

  const structuredData: Record<string, any>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.title,
      "alternativeHeadline": article.englishTitle,
      "description": description,
      "author": {
        "@type": "Organization",
        "name": "Open Desh Civic Research Team"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Open Desh",
        "logo": {
          "@type": "ImageObject",
          "url": "https://opendesh.in/logo.png"
        }
      },
      "articleSection": article.categoryLabel || "Civic Governance"
    }
  ];

  // If article has FAQ questions, add Google FAQPage schema for instant rich snippets
  if (article.faqQuestions && article.faqQuestions.length > 0) {
    structuredData.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": article.faqQuestions.map((faq) => ({
        "@type": "Question",
        "name": faq.question || faq.englishQuestion,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer || faq.englishAnswer
        }
      }))
    });
  }

  return {
    title,
    description,
    type: "article",
    keywords: [
      ...(article.tags || []),
      "RTI Act 2005",
      "Civic Rights India",
      "Open Desh Help Center",
      "Citizen SLA Charter",
      article.categoryLabel || "Civic Tech"
    ],
    structuredData
  };
}
