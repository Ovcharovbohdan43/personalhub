export type UrlMetadata = {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
};

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function pickMeta(html: string, property: string) {
  const regex = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    'i'
  );
  const match = html.match(regex);
  return match?.[1] ? decodeHtml(match[1]) : undefined;
}

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    const response = await fetch(normalized, {
      headers: { 'User-Agent': 'PersonalHub/1.0' },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 3600 },
    });
    if (!response.ok) return {};

    const html = await response.text();
    return {
      title: pickMeta(html, 'og:title') ?? pickMeta(html, 'twitter:title'),
      description: pickMeta(html, 'og:description') ?? pickMeta(html, 'description'),
      image: pickMeta(html, 'og:image') ?? pickMeta(html, 'twitter:image'),
      siteName: pickMeta(html, 'og:site_name'),
    };
  } catch {
    return {};
  }
}
