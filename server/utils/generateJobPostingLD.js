/**
 * Generates Google-compatible JSON-LD (JobPosting schema) from a job post document.
 * Ref: https://developers.google.com/search/docs/appearance/structured-data/job-posting
 *
 * Usage:
 *   const ld = generateJobPostingLD(jobPostDoc, { siteUrl: 'https://sarkariafsar.com' });
 *   // Embed in <script type="application/ld+json"> on the page.
 */

const generateJobPostingLD = (post, options = {}) => {
  const siteUrl = options.siteUrl || "https://sarkariafsar.com";

  if (!post || !post.title) return null;

  const ld = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: post.jobtitle || post.title,
    description: buildDescription(post),
    datePosted: (post.createdAt || new Date()).toISOString(),
    hiringOrganization: {
      "@type": "Organization",
      name: post.conductingAuthority || post.conducting_authority || "Government of India",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "IN",
        addressLocality: post.location || "",
      },
    },
    employmentType: "FULL_TIME",
  };

  if (post.applyLastDate) {
    ld.validThrough = new Date(post.applyLastDate).toISOString();
  }

  if (post.salary) {
    ld.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "INR",
      value: {
        "@type": "QuantitativeValue",
        value: post.salary,
        unitText: "MONTH",
      },
    };
  }

  if (post.slug) {
    ld.url = `${siteUrl}/post/${post.slug}`;
  }

  if (post.advertisement_number || post.advertisementNumber) {
    ld.identifier = {
      "@type": "PropertyValue",
      name: "Advertisement Number",
      value: post.advertisement_number || post.advertisementNumber,
    };
  }

  return ld;
};

function buildDescription(post) {
  const parts = [post.title];
  if (post.jobtitle) parts.push(`Job Title: ${post.jobtitle}`);
  if (post.category) parts.push(`Category: ${post.category}`);
  if (post.totalVacancies) parts.push(`Total Vacancies: ${post.totalVacancies}`);
  if (post.salary) parts.push(`Salary: ${post.salary}`);
  if (post.ageLimit) parts.push(`Age Limit: ${post.ageLimit}`);
  if (post.applicationFee) parts.push(`Application Fee: ${post.applicationFee}`);
  if (post.selectionProcess) parts.push(`Selection Process: ${post.selectionProcess}`);
  if (post.disclaimer) parts.push(post.disclaimer);
  return parts.join(". ");
}

module.exports = { generateJobPostingLD };
