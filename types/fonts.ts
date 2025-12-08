export type FontCategory =
  | "sans-serif"
  | "serif"
  | "display"
  | "handwriting"
  | "monospace";

export type GoogleFontAxis = {
  tag: string;
  start: number;
  end: number;
};

export type GoogleFontFiles = {
  [variant: string]: string;
};

export type GoogleFont = {
  kind: "webfonts#webfont";
  family: string;
  category: FontCategory;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: GoogleFontFiles;
  menu?: string;
  axes?: GoogleFontAxis[];
};

export type GoogleFontsAPIResponse = {
  kind: "webfonts#webfontList";
  items: GoogleFont[];
};

export type FontInfo = {
  family: string;
  category: FontCategory;
  variants: string[];
  variable: boolean;
};

export type PaginatedFontsResponse = {
  fonts: FontInfo[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
};
