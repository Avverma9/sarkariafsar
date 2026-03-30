export interface JobPost {
  _id?: string;
  title: string;
  slug?: string;
  jobtitle?: string;
  category?: string;
  sectionName?: string;
  sectionCanonicalUrl?: string;
  tags?: string[];
  advertisement_number?: string;
  conducting_authority?: string;
  applyLastDate?: string;
  status?: string;
  isActive?: boolean;
  sourceUrl?: string;
  salary?: string;
  location?: string;
  totalVacancies?: string;
  ageLimit?: string;
  applicationFee?: string;
  selectionProcess?: string;
  examPreparationStrategy?: string;
  syllabusBreakdown?: string;
  physicalTestDetails?: string;
  authorName?: string;
  authorProfileUrl?: string;
  authorBio?: string;
  wordCount?: number;
  noIndex?: boolean;
  scrapedContent?: {
    contentHtml?: string;
  };
  scrapedMeta?: {
    sourceSiteName?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface PostSection {
  _id?: string;
  name: string;
  canonicalUrl?: string;
  status: 'active' | 'inactive';
  aliases?: string[];
  sourceSectionName?: string;
  sourceSectionUrl?: string;
  scrapedContent?: {
    contentHtml?: string;
  };
}

export interface BlogSection {
  heading: string;
  paragraphs: string[];
  bullets: string[];
}

export interface Blog {
  _id?: string;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  category: string;
  intro: string;
  tags?: string[];
  publishedAt?: string;
  sections: BlogSection[];
  authorProfileUrl?: string;
  authorBio?: string;
  authorCredentials?: string;
  wordCount?: number;
  noIndex?: boolean;
  scrapedContent?: {
    contentHtml?: string;
  };
}

export interface Scheme {
  _id?: string;
  schemeTitle: string;
  schemetype?: string;
  requiredDocs?: string[];
  process?: string;
  state?: string;
  city?: string;
  schemeStartDate?: string;
  schemeLastDate?: string;
  applyLink?: string;
  aboutScheme?: string;
  slug?: string;
  officialSourceUrl?: string;
  authorName?: string;
  authorProfileUrl?: string;
  authorBio?: string;
  wordCount?: number;
  noIndex?: boolean;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
}
