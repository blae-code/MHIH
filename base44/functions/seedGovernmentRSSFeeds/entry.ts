/**
 * seedGovernmentRSSFeeds — admin-only.
 * Creates a curated set of government-related RSS feeds as DataSource records
 * with medium="rss_feed". Idempotent: skips feeds whose URL already exists.
 *
 * Body: {} (no params)
 * Returns: { success, created, skipped, feeds: [{name, url, status}] }
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const FEEDS = [
  // ── Federal — Government of Canada ──
  { name: "Health Canada — News", url: "https://www.canada.ca/en/news/web-feeds/health.xml", publisher: "Health Canada", category: "access_to_care", region: "Provincial" },
  { name: "Public Health Agency of Canada — News", url: "https://www.canada.ca/en/news/web-feeds/public-health.xml", publisher: "PHAC", category: "access_to_care", region: "Provincial" },
  { name: "Statistics Canada — The Daily", url: "https://www150.statcan.gc.ca/n1/dai-quo/rss/dai-quo-eng.xml", publisher: "Statistics Canada", category: "demographics", region: "Provincial" },
  { name: "Statistics Canada — Health Releases", url: "https://www150.statcan.gc.ca/n1/dai-quo/rss/topic/3-eng.xml", publisher: "Statistics Canada", category: "access_to_care", region: "Provincial" },
  { name: "Crown-Indigenous Relations — News", url: "https://www.canada.ca/en/news/web-feeds/crown-indigenous-relations-northern-affairs.xml", publisher: "CIRNAC", category: "social_determinants", region: "Provincial" },
  { name: "Indigenous Services Canada — News", url: "https://www.canada.ca/en/news/web-feeds/indigenous-services-canada.xml", publisher: "ISC", category: "access_to_care", region: "Provincial" },
  { name: "Government of Canada — All News", url: "https://www.canada.ca/en/news/web-feeds/all-news-releases.xml", publisher: "Government of Canada", category: "other", region: "Provincial" },

  // ── Provincial — British Columbia ──
  { name: "BC Gov News — Health", url: "https://news.gov.bc.ca/ministries/health.rss", publisher: "BC Government", category: "access_to_care", region: "BC" },
  { name: "BC Gov News — Mental Health and Addictions", url: "https://news.gov.bc.ca/ministries/mental-health-and-addictions.rss", publisher: "BC Government", category: "mental_health", region: "BC" },
  { name: "BC Gov News — Indigenous Relations and Reconciliation", url: "https://news.gov.bc.ca/ministries/indigenous-relations-and-reconciliation.rss", publisher: "BC Government", category: "social_determinants", region: "BC" },
  { name: "BC Gov News — Children and Family Development", url: "https://news.gov.bc.ca/ministries/children-and-family-development.rss", publisher: "BC Government", category: "maternal_child", region: "BC" },
  { name: "BC Gov News — Social Development", url: "https://news.gov.bc.ca/ministries/social-development-and-poverty-reduction.rss", publisher: "BC Government", category: "social_determinants", region: "BC" },
  { name: "BC Gov News — All Releases", url: "https://news.gov.bc.ca/releases.rss", publisher: "BC Government", category: "other", region: "BC" },
  { name: "BC Centre for Disease Control — News", url: "http://www.bccdc.ca/about/news-stories/news-releases/rss", publisher: "BCCDC", category: "chronic_disease", region: "BC" },

  // ── Indigenous health & First Nations ──
  { name: "First Nations Health Authority — News", url: "https://www.fnha.ca/about/news-and-events/news/rss", publisher: "FNHA", category: "access_to_care", region: "BC" },

  // ── Health research & evidence ──
  { name: "Canadian Institute for Health Information (CIHI)", url: "https://www.cihi.ca/en/rss/news.xml", publisher: "CIHI", category: "access_to_care", region: "Provincial" },
  { name: "WHO — Disease Outbreak News", url: "https://www.who.int/feeds/entity/csr/don/en/rss.xml", publisher: "WHO", category: "chronic_disease", region: "Provincial" },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me().catch(() => null);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Load existing sources to dedupe by URL
    const existing = await base44.asServiceRole.entities.DataSource.list('-created_date', 500).catch(() => []);
    const existingUrls = new Set(existing.map(s => s.url).filter(Boolean));

    const results = [];
    let created = 0;
    let skipped = 0;

    for (const feed of FEEDS) {
      if (existingUrls.has(feed.url)) {
        skipped += 1;
        results.push({ name: feed.name, url: feed.url, status: 'skipped' });
        continue;
      }
      try {
        await base44.asServiceRole.entities.DataSource.create({
          name: feed.name,
          type: 'other',
          medium: 'rss_feed',
          url: feed.url,
          description: `RSS feed from ${feed.publisher}.`,
          category: feed.category,
          region: feed.region,
          sync_frequency: 'daily',
          status: 'active',
          notes: `Seeded by ${user.full_name || user.email}`,
          metadata: {
            provider: 'rss',
            publisher: feed.publisher,
            feed_type: 'rss',
            seeded: true,
            seeded_at: new Date().toISOString(),
          },
        });
        created += 1;
        results.push({ name: feed.name, url: feed.url, status: 'created' });
      } catch (e) {
        results.push({ name: feed.name, url: feed.url, status: 'error', error: e?.message || String(e) });
      }
    }

    return Response.json({ success: true, created, skipped, total: FEEDS.length, feeds: results });
  } catch (error) {
    return Response.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
});