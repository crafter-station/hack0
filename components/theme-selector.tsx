"use client";

import { useState, useCallback, useEffect } from "react";
import { Palette, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FontSelector } from "@/components/font-selector";
import { convertTinteToShadcn, type TinteTheme } from "@/lib/tinte-to-shadcn";
import type { FontInfo } from "@/types/fonts";

interface TinteThemePreview {
  id: string;
  slug: string;
  name: string;
  concept?: string;
  is_public: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    foreground: string;
    background: string;
  };
  rawTheme?: TinteTheme;
  overrides?: {
    shadcn?: {
      light: Record<string, string>;
      dark: Record<string, string>;
    };
  };
}

type ShadcnTokens = Record<string, string>;

interface ThemeSelectorProps {
  onThemeChange?: (theme: { light: ShadcnTokens; dark: ShadcnTokens }) => void;
}

export function ThemeSelector({ onThemeChange }: ThemeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [themes, setThemes] = useState<TinteThemePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [bodyFont, setBodyFont] = useState<string>("Geist Mono");
  const [headingFont, setHeadingFont] = useState<string>("Geist Mono");

  useEffect(() => {
    const saved = localStorage.getItem("selectedFonts");
    if (saved) {
      try {
        const fonts = JSON.parse(saved);
        const migrateFont = (font: string) => font === "Inter" ? "Geist Mono" : font;
        if (fonts.body) setBodyFont(migrateFont(fonts.body));
        if (fonts.heading) setHeadingFont(migrateFont(fonts.heading));
      } catch (e) {
        console.error("Failed to load saved fonts", e);
      }
    }
  }, []);

  const fetchThemes = useCallback(async (page = 1, search?: string) => {
    setLoading(true);
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const response = await fetch(
        `https://www.tinte.dev/api/themes/public?limit=20&page=${page}${searchParam}`
      );
      if (!response.ok) throw new Error("Failed to fetch themes");

      const data = await response.json();
      setThemes(data.themes || []);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching themes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && themes.length === 0) {
      fetchThemes();
    }
  }, [open, themes.length, fetchThemes]);

  const applyTheme = useCallback(
    (theme: TinteThemePreview) => {
      let shadcnTheme: { light: ShadcnTokens; dark: ShadcnTokens } | null = null;

      if (theme.rawTheme) {
        shadcnTheme = convertTinteToShadcn(theme.rawTheme);
      } else if (
        theme.overrides?.shadcn?.light &&
        theme.overrides?.shadcn?.dark
      ) {
        shadcnTheme = theme.overrides.shadcn;
      }

      if (shadcnTheme) {
        const lightTokens = Object.entries(shadcnTheme.light)
          .map(([key, value]) => `  --${key}: ${value};`)
          .join("\n");

        const darkTokens = Object.entries(shadcnTheme.dark)
          .map(([key, value]) => `  --${key}: ${value};`)
          .join("\n");

        const styleId = "theme-selector-dynamic";
        let styleElement = document.getElementById(styleId) as HTMLStyleElement;

        if (!styleElement) {
          styleElement = document.createElement("style");
          styleElement.id = styleId;
          document.head.appendChild(styleElement);
        }

        styleElement.textContent = `:root {\n${lightTokens}\n}\n\n.dark {\n${darkTokens}\n}`;

        setSelectedTheme(theme.id);
        onThemeChange?.(shadcnTheme);

        localStorage.setItem("selectedTheme", JSON.stringify({
          themeId: theme.id,
          themeName: theme.name,
        }));
      }
    },
    [onThemeChange]
  );

  const applyFonts = useCallback(() => {
    const styleId = "theme-selector-fonts";
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    const isMonoBody = bodyFont.toLowerCase().includes('mono');
    const isMonoHeading = headingFont.toLowerCase().includes('mono');
    const bodyFallback = isMonoBody ? 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace' : 'ui-sans-serif, system-ui, sans-serif';
    const headingFallback = isMonoHeading ? 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace' : 'ui-sans-serif, system-ui, sans-serif';

    styleElement.textContent = `
      body, p, span, div, li, td, th, label, input, textarea, select {
        font-family: "${bodyFont}", ${bodyFallback} !important;
      }

      h1, h2, h3, h4, h5, h6, .heading {
        font-family: "${headingFont}", ${headingFallback} !important;
      }
    `;

    localStorage.setItem("selectedFonts", JSON.stringify({
      body: bodyFont,
      heading: headingFont,
    }));
  }, [bodyFont, headingFont]);

  useEffect(() => {
    applyFonts();
  }, [applyFonts]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      fetchThemes(1, query);
    } else {
      fetchThemes(1);
    }
  }, [fetchThemes]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg"
        >
          <Palette className="h-6 w-6" />
        </Button>
      </DrawerTrigger>

      <DrawerContent className="h-[90vh]">
        <div className="mx-auto w-full max-w-4xl flex flex-col h-full">
          <DrawerHeader>
            <DrawerTitle>Theme Selector</DrawerTitle>
            <DrawerDescription>
              Browse and apply themes from{" "}
              <a
                href="https://tinte.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                tinte.dev
              </a>
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 overflow-hidden px-4 pb-4">
            <div className="space-y-6 h-full flex flex-col">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Search Themes
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search themes..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-9 pr-9"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSearch("")}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Body Font
                    </label>
                    <FontSelector
                      value={bodyFont}
                      placeholder="Select body font..."
                      onSelect={(font: FontInfo) => setBodyFont(font.family)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Heading Font
                    </label>
                    <FontSelector
                      value={headingFont}
                      placeholder="Select heading font..."
                      onSelect={(font: FontInfo) => setHeadingFont(font.family)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0">
                <label className="text-sm font-medium mb-2 block">
                  Available Themes
                </label>
                <ScrollArea className="h-full pr-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {themes.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => applyTheme(theme)}
                          className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                            selectedTheme === theme.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex gap-2 mb-2">
                            {[
                              theme.colors.primary,
                              theme.colors.secondary,
                              theme.colors.accent,
                            ].map((color, i) => (
                              <div
                                key={i}
                                className="w-8 h-8 rounded"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-sm truncate">
                              {theme.name}
                            </div>
                            {theme.concept && (
                              <div className="text-xs text-muted-foreground truncate">
                                {theme.concept}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
