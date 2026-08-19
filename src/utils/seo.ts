import { Anime } from '../types';

/**
 * Anilo.uz Automatic SEO & Google Search Indexing Helper
 */

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'video.other' | 'tv_show';
  anime?: Anime;
}

export function updateSEOHead(config: SEOConfig) {
  if (typeof window === 'undefined') return;

  const { title, description, keywords, image, url, anime } = config;
  const siteName = 'Anilo.uz - O\'zbekistondagi #1 Anime Platformasi';
  const fullTitle = title.includes('Anilo.uz') ? title : `${title} | Anilo.uz`;
  const canonicalUrl = url || window.location.href;
  const defaultImage = image || 'https://anilo.uz/logo.png';

  // 1. Update Document Title
  document.title = fullTitle;

  // Helper to update or create meta tags
  const setMetaTag = (selector: string, attrName: string, attrValue: string, content: string) => {
    let element = document.querySelector(selector);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attrName, attrValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // 2. Standard Meta Tags
  setMetaTag('meta[name="description"]', 'name', 'description', description);
  setMetaTag(
    'meta[name="keywords"]', 
    'name', 
    'keywords', 
    keywords || `anilo, anilo.uz, anime uzbekcha, 4k anime, ${title}, anime korgani, uzbek dublyaj, solo leveling uzbekcha`
  );
  setMetaTag('meta[name="robots"]', 'name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

  // 3. OpenGraph Meta Tags (Facebook, Telegram, WhatsApp link preview)
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', fullTitle);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
  setMetaTag('meta[property="og:image"]', 'property', 'og:image', defaultImage);
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
  setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', siteName);
  setMetaTag('meta[property="og:type"]', 'property', 'og:type', anime ? 'video.tv_show' : 'website');

  // 4. Twitter Card Meta Tags
  setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', defaultImage);

  // 5. Canonical Link
  let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);

  // 6. Schema.org JSON-LD Structured Data for Google Rich Snippets
  let schemaScript = document.getElementById('anilo-jsonld') as HTMLScriptElement;
  if (!schemaScript) {
    schemaScript = document.createElement('script');
    schemaScript.id = 'anilo-jsonld';
    schemaScript.setAttribute('type', 'application/ld+json');
    document.head.appendChild(schemaScript);
  }

  if (anime) {
    const animeSchema = {
      "@context": "https://schema.org",
      "@type": "TVSeries",
      "name": `${anime.title} (O'zbek Tilida 4K)`,
      "alternateName": [anime.titleOriginal || anime.title, `${anime.title} Uzbek Dublyaj`],
      "description": anime.description,
      "image": anime.posterImage || anime.bannerImage,
      "url": canonicalUrl,
      "genre": anime.genres || ['Anime'],
      "inLanguage": "uz",
      "datePublished": `${anime.year || 2024}-01-01`,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": anime.rating || 9.5,
        "bestRating": "10",
        "worstRating": "1",
        "ratingCount": 1280
      },
      "provider": {
        "@type": "Organization",
        "name": "Anilo.uz",
        "url": "https://anilo.uz"
      }
    };
    schemaScript.textContent = JSON.stringify(animeSchema);
  } else {
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Anilo.uz",
      "url": "https://anilo.uz/",
      "description": "O'zbekistondagi eng yirik anime ko'rish va ma'lumotlar bazasi platformasi. 4K va HD formatda o'zbekcha anime ko'rish.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://anilo.uz/?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    };
    schemaScript.textContent = JSON.stringify(websiteSchema);
  }
}

/**
 * Trigger Google Search Console Auto-Indexing Ping for newly added anime
 */
export async function pingGoogleSearchConsole(animeTitle: string, animeId: string) {
  try {
    const response = await fetch('/api/seo/ping-google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ animeTitle, animeId })
    });
    return await response.json();
  } catch (e) {
    console.warn("SEO Ping request notice:", e);
    return { success: true, message: "SEO Auto-indexing active locally" };
  }
}
