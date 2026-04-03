const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../scrapper/fetchAllBySection.js');
let c = fs.readFileSync(filePath, 'utf8');

const start = c.indexOf('function convertToMeaningfulJSON');
const end = c.indexOf('\nfunction extractPostLinksFromSectionPage');

if (start === -1 || end === -1) {
  console.error('Could not find markers'); process.exit(1);
}

const newFn = `function convertToMeaningfulJSON(html) {
  const $ = cheerio.load(html);
  const result = {
    postTitle: $('h1').first().text().trim(),
    totalPost: '',
    importantDates: {},
    applicationFee: {},
    ageLimit: { min: '', max: '', byCategory: [] },
    vacancyDetails: [],
    physicalDetails: [],
    selectionProcess: [],
    importantLinks: [],
  };

  function getLiUnderH2(keyword) {
    const h2 = $('h2').filter((_, el) =>
      $(el).text().toLowerCase().includes(keyword.toLowerCase())
    ).first();
    if (!h2.length) return [];
    const items = [];
    h2.nextUntil('h2', 'ul').find('li').each((_, li) => items.push($(li).text().trim()));
    return items;
  }

  // 1. Total Post
  const totalPostH2 = $('h2').filter((_, el) =>
    $(el).text().toLowerCase().includes('total post')
  ).first();
  if (totalPostH2.length) result.totalPost = totalPostH2.next('p').text().trim();

  // 2. Important Dates
  getLiUnderH2('Important Dates').forEach((text) => {
    const colon = text.indexOf(':');
    if (colon !== -1) {
      const key = text.slice(0, colon).trim();
      const val = text.slice(colon + 1).trim();
      if (key) result.importantDates[key] = val;
    }
  });

  // 3. Application Fee
  getLiUnderH2('Application Fee').forEach((text) => {
    const colon = text.indexOf(':');
    if (colon !== -1) {
      const key = text.slice(0, colon).trim();
      const val = text.slice(colon + 1).trim();
      if (key) result.applicationFee[key] = val;
    } else if (text) {
      result.applicationFee[text] = '';
    }
  });

  // 4. Age Limit
  getLiUnderH2('Age Limit').forEach((text) => {
    const minMatch = text.match(/Minimum Age\\s*:\\s*(\\d+)/i);
    const maxMatch = text.match(/Maximum Age\\s*:\\s*(\\d+)/i);
    if (minMatch) result.ageLimit.min = minMatch[1] + ' Years';
    if (maxMatch && !result.ageLimit.max) result.ageLimit.max = maxMatch[1] + ' Years';
    result.ageLimit.byCategory.push(text);
  });

  // 5. Vacancy Table — first table with 3+ columns
  let vacancyDone = false;
  $('table').each((_, table) => {
    if (vacancyDone) return;
    const rows = $(table).find('tr');
    const firstRowCols = $(rows[0]).find('td');
    if (firstRowCols.length >= 3) {
      const headers = firstRowCols.map((_, td) => $(td).text().trim()).get();
      rows.each((i, row) => {
        if (i === 0) return;
        const cols = $(row).find('td');
        if (cols.length < 3) return;
        const entry = {};
        headers.forEach((h, idx) => { entry[h] = $(cols[idx]).text().trim(); });
        result.vacancyDetails.push(entry);
      });
      vacancyDone = true;
    }
  });

  // 6. Physical Details Table
  $('table').each((_, table) => {
    const allText = $(table).text().toLowerCase();
    if (allText.includes('height') || allText.includes('chest') || allText.includes('physical exam')) {
      const rowsData = [];
      $(table).find('tr').each((_, row) => {
        const cells = $(row).find('td').map((_, td) => $(td).text().trim()).get().filter(Boolean);
        if (cells.length) rowsData.push(cells);
      });
      if (rowsData.length > 1) result.physicalDetails = rowsData;
    }
  });

  // 7. Selection Process
  $('ul li').each((_, li) => {
    const text = $(li).text().trim();
    if (/written exam/i.test(text) || /physical standards/i.test(text) || /document verif/i.test(text) || /medical exam/i.test(text)) {
      if (!result.selectionProcess.includes(text)) result.selectionProcess.push(text);
    }
  });

  // 8. Important Links
  $('table a[href]').each((_, a) => {
    const href = $(a).attr('href') || '';
    if (!href || href.includes('javascript')) return;
    const label = $(a).closest('tr').find('td').first().text().trim() || $(a).text().trim();
    result.importantLinks.push({ label, url: href });
  });

  return result;
}
`;

c = c.slice(0, start) + newFn + c.slice(end);
fs.writeFileSync(filePath, c, 'utf8');
console.log('Done. convertToMeaningfulJSON replaced successfully.');
