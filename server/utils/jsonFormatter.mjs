import * as cheerio from 'cheerio';

/**
 * FUTURE-READY JSON FORMATTER
 * Heuristic-based parsing for unpredictable Sarkari Job Portals.
 */
export const formatJobJsonAdvanced = (htmlString) => {
  if (!htmlString) return null;
  
  const $ = cheerio.load(htmlString);
  
  // 1. Extreme Deep Cleaning (Jhadu maar do kachre par)
  const garbageSelectors = [
    'header', 'nav', 'footer', '.sidebar', '#masthead', '#site-navigation',
    '.wp-block-latest-posts', '.social-share', '.telegram-join', '.whatsapp-join',
    'iframe', 'script', 'style', 'noscript', 'img[src*="wa.me"]', 'img[src*="t.me"]',
    'a[href*="t.me"]', 'a[href*="whatsapp"]', 'a[href*="telegram"]'
  ];
  $(garbageSelectors.join(', ')).remove();
  
  // Target the core content area where actual details live
  const $content = $('.entry-content').length ? $('.entry-content') : 
                   $('#primary').length ? $('#primary') : 
                   $('.post-section').length ? $('.post-section') : 
                   $('body');

  const jobData = {
    title: "",
    shortInfo: "",
    importantDates: [],
    applicationFee: [],
    ageLimit: [],
    vacancyDetails: [],
    importantLinks: [],
    otherDetails: []
  };

  // -----------------------------------------------------------
  // 1. MAIN TITLE EXTRACTION (With Fallbacks)
  // -----------------------------------------------------------
  jobData.title = $content.find('h1').first().text().trim() || 
                  $content.find('h2').first().text().trim() || 
                  $content.find('.post-title').text().trim() || 
                  "Job Notification";

  // -----------------------------------------------------------
  // 2. SHORT INFO EXTRACTION (Smart Paragraph Matching)
  // -----------------------------------------------------------
  let shortInfoFound = false;
  $content.find('p, div.short-info').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    // Exclude metadata texts, dates, short junk lines, and competitive brand names
    if (
      text.length > 60 && 
      !shortInfoFound &&
      !/Post Date|Updated On|Sarkari\s*(Result|Exam|Job)|WhatsApp|Telegram/i.test(text)
    ) {
       jobData.shortInfo = text.replace(/short\s*(information|info)\s*:/i, '').trim();
       shortInfoFound = true;
    }
  });

  // -----------------------------------------------------------
  // 3. HEURISTIC BASED LIST & SECTION EXTRACTION
  // -----------------------------------------------------------
  // Look for any kind of heading (h2 to h6) or strong text that acts like a heading
  $content.find('h2, h3, h4, h5, h6, strong.section-title').each((_, el) => {
    const $heading = $(el);
    const headingText = $heading.text().trim().toLowerCase();
    
    // Ignore garbage headings
    if (/related|latest|useful|download app/i.test(headingText)) return;

    // Find the NEXT DOM node that contains actual data (Skip empty wrappers)
    let $nextEl = $heading.parent().next(); 
    if (!$nextEl.length || $nextEl.text().trim() === '') $nextEl = $heading.next();
    if (!$nextEl.length || $nextEl.text().trim() === '') $nextEl = $heading.parent().parent().next();

    let collectedItems = new Set();
    
    // Scan up to 7 next sibling blocks to find lists, paragraphs or table rows 
    // that belong to this heading.
    for (let j = 0; j < 7; j++) {
       if (!$nextEl.length) break;
       // Stop if we hit another heading
       if ($nextEl.is('h2, h3, h4, h5, h6') || $nextEl.find('h2, h3, h4, h5, h6').length > 0) break;
       
       // Strategy A: Try finding UL/OL
       $nextEl.find('li').each((_, li) => {
          const txt = $(li).text().replace(/\s+/g, ' ').trim();
          if (txt && !/click here/i.test(txt)) collectedItems.add(txt);
       });

       // Strategy B: If no UL, but it's a paragraph with line breaks (<br>)
       if (collectedItems.size === 0 && $nextEl.find('br').length > 0) {
          $nextEl.html().split(/<br\s*\/?>/i).forEach(line => {
              const cleanLine = $(`<span>${line}</span>`).text().replace(/\s+/g, ' ').trim();
              if (cleanLine) collectedItems.add(cleanLine);
          });
       }

       // Strategy C: Direct text content (Like "Age Limit: NA" or basic div texts)
       if (collectedItems.size === 0) {
          const directText = $nextEl.text().replace(/\s+/g, ' ').trim();
          if (directText && directText.length < 150 && directText !== 'NA') {
             collectedItems.add(directText);
          }
       }

       $nextEl = $nextEl.next();
    }

    // Convert Set back to Array
    const items = Array.from(collectedItems);

    // Route the data to the correct array based on heading text
    if (items.length > 0) {
        if (/date/i.test(headingText)) {
            jobData.importantDates.push(...items);
        } else if (/fee/i.test(headingText)) {
            jobData.applicationFee.push(...items);
        } else if (/age/i.test(headingText)) {
            jobData.ageLimit.push(...items);
        } else if (!/post|details|links|result/i.test(headingText)) {
            jobData.otherDetails.push({ section: $heading.text().trim(), details: items });
        }
    }
  });

  // -----------------------------------------------------------
  // 4. SMART TABLE PARSER (Vacancies & Links)
  // -----------------------------------------------------------
  $content.find('table').each((i, table) => {
    const $table = $(table);
    const tableText = $table.text().toLowerCase();
    
    // DETECT LINKS TABLE: If it contains words like 'apply', 'download', 'click here'
    if (/apply\s*online|click\s*here|download|official\s*website/i.test(tableText)) {
      
      $table.find('tr').each((_, tr) => {
        // Assume first TD is the title, and rest contain links
        const titleText = $(tr).find('td, th').first().text().replace(/\s+/g, ' ').trim();
        const $links = $(tr).find('a');
        
        if ($links.length > 0 && !/important\s*links|useful/i.test(titleText)) {
            $links.each((_, linkEl) => {
                let linkLabel = $(linkEl).text().trim();
                let finalLabel = titleText;
                
                // If there are multiple links in one row (e.g. Server 1 | Server 2)
                if ($links.length > 1 && linkLabel.length > 0) {
                    // Combine row title with link title -> "Download Admit Card (Server 1)"
                    finalLabel = `${titleText} (${linkLabel})`;
                }

                const href = $(linkEl).attr('href') || '#';
                
                // Do not push empty/garbage links
                if (href !== '#' && !href.includes('whatsapp') && !href.includes('telegram')) {
                    jobData.importantLinks.push({ label: finalLabel, url: href });
                }
            });
        }
      });
    } 
    // DETECT DATA/VACANCY TABLE
    else {
      let headers = [];
      $table.find('tr').first().find('th, td').each((_, th) => {
        headers.push($(th).text().replace(/\s+/g, ' ').trim());
      });

      // Skip fake tables used for layout holding garbage
      if (headers.join('').toLowerCase().includes('latest posts')) return;

      // Fallback headers if none exist
      if (headers.length === 0) headers = ['Column_1', 'Column_2'];

      const tableData = [];
      $table.find('tr').each((rowIndex, tr) => {
        // Skip header row
        if (rowIndex === 0 || $(tr).find('th').length === $(tr).find('td').length + $(tr).find('th').length) return; 
        
        const rowObj = {};
        $(tr).find('td').each((colIndex, td) => {
          const colName = headers[colIndex] || `Column_${colIndex + 1}`;
          rowObj[colName] = $(td).text().replace(/\s+/g, ' ').trim();
        });
        
        if (Object.keys(rowObj).length > 0 && Object.values(rowObj).some(val => val.length > 0)) {
           tableData.push(rowObj);
        }
      });

      if (tableData.length > 0) {
          jobData.vacancyDetails.push({
            tableIndex: i + 1,
            headers: headers,
            rows: tableData
          });
      }
    }
  });

  // -----------------------------------------------------------
  // 5. AGGRESSIVE CLEANUP OF COMPETITOR NAMES
  // -----------------------------------------------------------
  const deepClean = (obj) => {
    if (typeof obj === 'string') {
        let cleanStr = obj.replace(/sarkari\s*exam|sarkari\s*result|sarkariresult\.com\.cm|rojgarresult/gi, 'SarkariAfsar');
        // Final trim for safety
        return cleanStr.replace(/^\s+|\s+$/g, '');
    }
    if (Array.isArray(obj)) return obj.map(deepClean);
    if (typeof obj === 'object' && obj !== null) {
      const newObj = {};
      for (let key in obj) {
        newObj[key] = deepClean(obj[key]);
      }
      return newObj;
    }
    return obj;
  };

  // Remove duplicate entries from arrays
  jobData.importantDates = [...new Set(jobData.importantDates)];
  jobData.applicationFee = [...new Set(jobData.applicationFee)];
  jobData.ageLimit = [...new Set(jobData.ageLimit)];

  return deepClean(jobData);
};
