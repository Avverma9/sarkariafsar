import * as cheerio from 'cheerio';
import sanitizeHtml from 'sanitize-html';

// ============================================================================
// 1. CONFIGURATIONS & DICTIONARIES (Scalable to thousands of lines)
// ============================================================================

const FORMATTER_CONFIG = {
  brandName: 'Sarkari Job Portal', // Aapka Brand Name
  brandUrl: 'https://yourwebsite.com',
  
  // 1.1 Competitor Domains to Block
  competitorDomains: [
    'sarkariexam.com', 'sarkariresult.com', 'sarkariresult.info', 'freejobalert.com',
    'jagranjosh.com', 'roajgarresult.com', 'telegram.me', 't.me', 'whatsapp.com', 
    'instagram.com', 'youtube.com', 'twitter.com', 'facebook.com', 'play.google.com'
  ],

  // 1.2 Regex Keywords for Text Replacement
  competitorKeywords: [
    /sarkari\s*exam/gi, /sarkari\s*result/gi, /free\s*job\s*alert/gi, 
    /jagran\s*josh/gi, /rojgar\s*result/gi, /sarkariresult/gi
  ],

  // 1.3 Garbage Selectors (Ads, Hidden Trackers, Social Plugins)
  garbageSelectors: [
    'script', 'style', 'noscript', 'iframe', 'ins', 'meta', 'link', 'svg',
    '.code-block', '.adsbygoogle', '[id^="div-gpt-ad"]', '.social-share',
    '.post-social-link', '.related-posts', '.wp-block-latest-posts',
    '[class*="sarkari"]', '[id*="sarkari"]', '.mobile-home', '.share-buttons',
    '.telegram-join', '.whatsapp-join', 'a[href*="t.me"]', 'a[href*="whatsapp"]'
  ],

  // 1.4 Smart Button Detector Keywords
  buttonKeywords: [
    'click here', 'apply online', 'download notification', 'download admit card', 
    'official website', 'registration', 'login', 'download syllabus', 'download result'
  ],

  // 1.5 Unwanted Attributes to Strip Completely
  attributesToStrip: ['style', 'width', 'height', 'border', 'cellpadding', 'cellspacing', 'bgcolor', 'align', 'valign'],

  // 1.6 High-signal content roots (order matters)
  contentSelectors: [
    '.entry-content',
    '.post-section',
    '.post-content',
    '.single-content',
    '.article-content',
    '.td-post-content',
    '#primary article',
    'main article',
    'article',
    'main',
    '#primary',
    '#content',
    '.content',
  ],

  // 1.7 Navigation/Footer style containers to drop before content detection
  noiseBlockSelectors: [
    'header', 'nav', 'footer', 'aside',
    '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
    '.menu', '.main-menu', '.navbar', '.navigation', '.nav-menu',
    '.site-header', '.site-footer', '.page-header', '.page-footer',
    '.breadcrumbs', '.breadcrumb', '.sidebar', '.widget',
    '.social-share', '.social-links', '.share-buttons'
  ],

  // 1.8 Short menu/footer text patterns to remove from formatted output
  menuNoisePatterns: [
    /^skip to content$/i,
    /^menu$/i,
    /^home$/i,
    /^latest job$/i,
    /^admit card$/i,
    /^result$/i,
    /^admission$/i,
    /^syllabus$/i,
    /^answer key$/i,
    /^more$/i,
    /^contact us$/i,
    /^privacy policy$/i,
    /^disclaimer$/i,
    /^(latest job|admit card(\s+date)?|result(\s+date)?|admission|syllabus|answer key)\s*:/i,
    /^sarkariresult\.com(\.cm)?$/i,
    /^sarkari\s*result(\s*\.?\s*com(\.cm)?)?$/i,
    /^sarkari job portal(\.com\.cm)?$/i,
    /^let[’']?s update$/i
  ],

  // 1.9 Legal/footer style content blocks to drop
  legalNoisePatterns: [
    /(^|\s)disclaimer[:\s-]/i,
    /privacy policy/i,
    /contact us/i,
    /about us/i,
    /we are not responsible/i,
    /immediate information of the examinees/i,
    /download\s+.*app\s+now/i
  ]
};

// ============================================================================
// 2. THE ULTIMATE FORMATTER CLASS
// ============================================================================

class UltimateJobFormatter {
  constructor(html, config = FORMATTER_CONFIG) {
    // 1. Pehle XSS aur extremely dangerous tags ko sanitize karein
    const cleanHtml = sanitizeHtml(html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3']),
      allowedAttributes: {
        '*': ['id', 'class', 'style', 'href', 'src', 'title', 'target', 'rel', 'role', 'aria-label', 'aria-hidden', 'data-*']
      },
      allowVulnerableTags: true // Taaki Cheerio isko effectively process kar sake
    });

    this.$ = cheerio.load(cleanHtml);
    this.config = config;

    this.removeGlobalNoiseBlocks();
    this.$content = this.pickContentRoot();
  }

  normalizeText(value = '') {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  removeGlobalNoiseBlocks() {
    const { noiseBlockSelectors } = this.config;
    this.$(noiseBlockSelectors.join(', ')).remove();

    this.$('*').each((_, el) => {
      const $el = this.$(el);
      const className = this.normalizeText($el.attr('class') || '').toLowerCase();
      const idName = this.normalizeText($el.attr('id') || '').toLowerCase();
      const role = this.normalizeText($el.attr('role') || '').toLowerCase();
      const composite = `${className} ${idName} ${role}`;

      if (/(^|\s)(menu|nav|navbar|header|footer|breadcrumb|sidebar|social|share|cookie|popup)(\s|$)/i.test(composite)) {
        $el.remove();
      }
    });
  }

  pickContentRoot() {
    const { contentSelectors } = this.config;
    let bestNode = null;
    let bestScore = 0;

    contentSelectors.forEach((selector) => {
      this.$(selector).each((_, el) => {
        const $el = this.$(el);
        const textLength = this.normalizeText($el.text()).length;
        if (textLength < 120) return;

        const tables = $el.find('table').length;
        const headings = $el.find('h1, h2, h3').length;
        const score = textLength + tables * 200 + headings * 60;

        if (score > bestScore) {
          bestScore = score;
          bestNode = el;
        }
      });
    });

    if (bestNode) return this.$(bestNode);
    return this.$('body');
  }

  /**
   * Pipeline Executor: Saare advanced functions ek ke baad ek chalenge
   */
  processPipeline() {
    this.removeGarbage();
    this.removeMenuKeywordNoise();
    this.anonymizeCompetitors();
    this.cleanAttributes();
    this.formatTypography();
    this.formatTablesAdvanced();
    this.formatLists();
    this.formatSmartLinks();
    this.cleanEmptyNodes();
    
    return this.renderFinalHtml();
  }

  // ------------------------------------------------------------------------
  // STEP 1: Deep Garbage Collection
  // ------------------------------------------------------------------------
  removeGarbage() {
    const { garbageSelectors } = this.config;
    // CSS Selectors se kachra nikalein
    this.$content.find(garbageSelectors.join(', ')).remove();

    // Table rows jisme sirf social media links ho, unhe hatayein
    this.$content.find('tr').each((_, el) => {
      const rowText = this.$(el).text().toLowerCase();
      if (rowText.includes('follow us') || rowText.includes('join whatsapp') || rowText.includes('join telegram')) {
        this.$(el).remove();
      }
    });

    // Hidden elements hatayein (jinke style me display:none hai)
    this.$content.find('*').each((_, el) => {
      const style = this.$(el).attr('style');
      if (style && style.replace(/\s/g, '').includes('display:none')) {
        this.$(el).remove();
      }
    });
  }

  removeMenuKeywordNoise() {
    const { menuNoisePatterns, legalNoisePatterns } = this.config;
    const navTokens = [
      'home',
      'latest job',
      'admit card',
      'result',
      'admission',
      'syllabus',
      'answer key',
      'privacy policy',
      'disclaimer',
      'contact us'
    ];

    const isNoiseText = (text = '') => {
      const normalized = this.normalizeText(text).toLowerCase();
      if (!normalized || normalized.length > 80) return false;
      return menuNoisePatterns.some((pattern) => pattern.test(normalized));
    };

    const isLegalNoiseBlock = (text = '') => {
      const normalized = this.normalizeText(text).toLowerCase();
      if (!normalized || normalized.length < 20 || normalized.length > 1500) return false;
      return legalNoisePatterns.some((pattern) => pattern.test(normalized));
    };

    const hasNavTokenCluster = (text = '', linkCount = 0) => {
      const normalized = this.normalizeText(text).toLowerCase();
      if (!normalized || normalized.length > 260) return false;
      const hits = navTokens.filter((token) => normalized.includes(token)).length;
      return hits >= 4 && linkCount >= 3;
    };

    this.$content.find('div, section, ul, ol').each((_, el) => {
      const $el = this.$(el);
      const blockText = this.normalizeText($el.text());
      const linkCount = $el.find('a').length;
      const hasCriticalContent = $el.find('h1, h2, h3, table').length > 0;

      if (!hasCriticalContent && (hasNavTokenCluster(blockText, linkCount) || isLegalNoiseBlock(blockText))) {
        $el.remove();
      }
    });

    this.$content.find('a, p, span, li, div, strong, b').each((_, el) => {
      const $el = this.$(el);
      const text = this.normalizeText($el.text());

      // Leaf/near-leaf nodes me exact menu-like labels remove karo.
      if (text && isNoiseText(text) && $el.children().length <= 1) {
        $el.remove();
        return;
      }

      if (
        text &&
        isLegalNoiseBlock(text) &&
        $el.find('table').length === 0 &&
        $el.children().length <= 2
      ) {
        $el.remove();
      }
    });

    this.$content.contents().each((_, node) => {
      if (node.type !== 'text') return;
      if (isNoiseText(node.data || '')) {
        this.$(node).remove();
      }
    });
  }

  // ------------------------------------------------------------------------
  // STEP 2: Competitor Anonymization (Text + Links)
  // ------------------------------------------------------------------------
  anonymizeCompetitors() {
    const { competitorDomains } = this.config;

    // A. Links Neutralization
    this.$content.find('a').each((_, el) => {
      const $a = this.$(el);
      const href = $a.attr('href') || '';
      
      const isCompetitor = competitorDomains.some(domain => href.toLowerCase().includes(domain));
      if (isCompetitor) {
        const linkText = this.normalizeText($a.text()).toLowerCase();
        if (
          !linkText ||
          /sarkari|rojgar|freejobalert|jagran|\.com|\.in|telegram|whatsapp/i.test(linkText)
        ) {
          $a.remove();
          return;
        }

        $a.attr('href', '#');
        $a.removeAttr('target');
      } else {
        // Safe external links ke liye SEO friendly tags
        if (href.startsWith('http')) {
          $a.attr('target', '_blank');
          $a.attr('rel', 'noopener noreferrer nofollow');
        }
      }
    });

    this.$content.find('img').each((_, el) => {
      const $img = this.$(el);
      const src = $img.attr('src') || '';
      const isCompetitorImage = competitorDomains.some((domain) =>
        src.toLowerCase().includes(domain)
      );
      if (isCompetitorImage) {
        $img.remove();
      }
    });

  }

  // ------------------------------------------------------------------------
  // STEP 3: Strip Old Legacy Attributes
  // ------------------------------------------------------------------------
  cleanAttributes() {
    const { attributesToStrip } = this.config;
    this.$content.find('*').each((_, el) => {
      attributesToStrip.forEach(attr => this.$(el).removeAttr(attr));
      // Sab purani classes hata do, sirf wahi bachengi jo hum ab inject karenge
      this.$(el).removeAttr('class'); 
    });
  }

  // ------------------------------------------------------------------------
  // STEP 4: Advanced Typography Formatting (Tailwind)
  // ------------------------------------------------------------------------
  formatTypography() {
    this.$content.find('h1').addClass('text-3xl md:text-5xl font-black text-gray-900 mt-10 mb-6 text-center tracking-tight');
    this.$content.find('h2').addClass('text-2xl md:text-3xl font-extrabold text-gray-800 mt-8 mb-4 border-b-4 border-blue-600 pb-2 inline-block');
    this.$content.find('h3').addClass('text-xl md:text-2xl font-bold text-white bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-3 mt-8 mb-5 rounded-lg shadow-md text-center uppercase tracking-wider');
    this.$content.find('h4, h5, h6').addClass('text-lg font-bold text-gray-700 mt-6 mb-3 border-l-4 border-blue-500 pl-3');
    this.$content.find('p').addClass('text-base md:text-lg text-gray-700 leading-relaxed mb-5');
    this.$content.find('strong, b').addClass('font-bold text-gray-900');
  }

  // ------------------------------------------------------------------------
  // STEP 5: Ultimate Responsive Tables
  // ------------------------------------------------------------------------
  formatTablesAdvanced() {
    this.$content.find('table').each((_, table) => {
      const $table = this.$(table);
      
      // Add Tailwind Classes to Table
      $table.addClass('w-full text-sm md:text-base text-left text-gray-700 border-collapse bg-white');
      
      // Wrap table in responsive div (Crucial for mobile view)
      $table.wrap('<div class="w-full overflow-x-auto my-8 shadow-lg rounded-xl border border-gray-200"></div>');

      // Header Row
      $table.find('thead, th').addClass('text-xs md:text-sm text-white uppercase bg-blue-800 px-4 py-4 font-bold text-center border-b-2 border-blue-900');
      
      // Body Rows
      $table.find('tbody tr').each((i, tr) => {
        const $tr = this.$(tr);
        // Zebra striping dynamically
        if (i % 2 === 0) {
          $tr.addClass('bg-white hover:bg-blue-50 transition-colors');
        } else {
          $tr.addClass('bg-gray-50 hover:bg-blue-50 transition-colors');
        }
      });

      // Table Data Cells
      $table.find('td').each((_, td) => {
        const $td = this.$(td);
        $td.addClass('px-4 py-3 border border-gray-200 align-middle');
        
        // Agar cell me sirf ek link hai (jaise Apply Online column), usko center karo
        if ($td.children().length === 1 && $td.children().first()[0].name === 'a') {
           $td.addClass('text-center font-medium');
        } else if ($td.text().length < 20) {
           $td.addClass('text-center'); // Chote text (dates/fees) ko center align karein
        }
      });
    });
  }

  // ------------------------------------------------------------------------
  // STEP 6: Format Lists
  // ------------------------------------------------------------------------
  formatLists() {
    this.$content.find('ul').addClass('list-disc list-outside space-y-3 mb-6 text-gray-700 ml-6 marker:text-blue-600');
    this.$content.find('ol').addClass('list-decimal list-outside space-y-3 mb-6 text-gray-700 ml-6 marker:text-blue-600 marker:font-bold');
    this.$content.find('li').addClass('text-base md:text-lg leading-relaxed pl-1');
  }

  // ------------------------------------------------------------------------
  // STEP 7: Smart Buttons & Links Parsing
  // ------------------------------------------------------------------------
  formatSmartLinks() {
    const { buttonKeywords } = this.config;
    
    this.$content.find('a').each((_, el) => {
      const $a = this.$(el);
      const text = $a.text().trim().toLowerCase();
      
      // Agar link ka text buttonKeywords se match karta hai, to usko Premium Button banao
      const isButton = buttonKeywords.some(keyword => text.includes(keyword));

      if (isButton) {
        $a.addClass('inline-flex items-center justify-center text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-bold rounded-lg text-sm md:text-base px-6 py-2.5 text-center shadow-md transform hover:scale-105 transition-all duration-300 w-full sm:w-auto my-1 focus:ring-4 focus:ring-blue-300');
      } else {
        $a.addClass('text-blue-600 hover:text-blue-800 font-semibold underline decoration-2 decoration-blue-300 hover:decoration-blue-600 underline-offset-4 transition-all');
      }
    });
  }

  // ------------------------------------------------------------------------
  // STEP 8: Clean Empty Nodes
  // ------------------------------------------------------------------------
  cleanEmptyNodes() {
    // Aise empty tags jinke andar kuch nahi hai, unhe uda do
    this.$content.find('p, span, div, h1, h2, h3, h4, h5, h6').each((_, el) => {
      const $el = this.$(el);
      if ($el.html().replace(/\s|&nbsp;/g, '').length === 0) {
        $el.remove();
      }
    });
  }

  // ------------------------------------------------------------------------
  // STEP 9: Final Render Wrapper
  // ------------------------------------------------------------------------
  renderFinalHtml() {
    // SEO Schema markup aur semantic container inject kar raha hu
    return `
      <article class="max-w-6xl mx-auto p-4 md:p-8 bg-white rounded-2xl shadow-2xl font-sans selection:bg-blue-200 selection:text-blue-900 border border-gray-100">
        <div class="prose prose-blue max-w-none">
          ${this.$content.html()}
        </div>
      </article>
    `;
  }
}

// ============================================================================
// 3. EXPORT FUNCTION FOR API
// ============================================================================

/**
 * Ye main function hai jo aapke API controller me call hoga
 * @param {string} rawHtml - Scrape kiya hua HTML
 * @returns {string} - Ultra formatted, safe, and beautiful HTML
 */
export const formatJobHtmlAdvanced = (rawHtml) => {
  if (!rawHtml) return '';
  try {
    const formatter = new UltimateJobFormatter(rawHtml);
    return formatter.processPipeline();
  } catch (error) {
    console.error("Formatter Error: ", error);
    // Fallback me raw html bhej do agar formatting fail ho
    return rawHtml; 
  }
};
