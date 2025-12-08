import { NextRequest, NextResponse } from "next/server";
import type {
  GoogleFont,
  GoogleFontsAPIResponse,
  FontInfo,
  PaginatedFontsResponse,
} from "@/types/fonts";

const GOOGLE_FONTS_API_KEY = process.env.GOOGLE_FONTS_API_KEY;
const GOOGLE_FONTS_API = "https://www.googleapis.com/webfonts/v1/webfonts";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    if (!GOOGLE_FONTS_API_KEY) {
      return NextResponse.json(
        { error: "Google Fonts API key not configured" },
        { status: 500 }
      );
    }

    const url = `${GOOGLE_FONTS_API}?key=${GOOGLE_FONTS_API_KEY}&sort=popularity`;
    const response = await fetch(url, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch from Google Fonts API");
    }

    const data = (await response.json()) as GoogleFontsAPIResponse;
    let fonts = data.items;

    if (category) {
      fonts = fonts.filter((font) => font.category === category);
    }

    if (query) {
      const lowerQuery = query.toLowerCase();
      fonts = fonts.filter((font) =>
        font.family.toLowerCase().includes(lowerQuery)
      );
    }

    const total = fonts.length;
    const paginatedFonts = fonts.slice(offset, offset + limit);

    const fontInfos: FontInfo[] = paginatedFonts.map((font: GoogleFont) => ({
      family: font.family,
      category: font.category,
      variants: font.variants,
      variable: !!font.axes && font.axes.length > 0,
    }));

    const result: PaginatedFontsResponse = {
      fonts: fontInfos,
      total,
      offset,
      limit,
      hasMore: offset + limit < total,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching Google Fonts:", error);
    return NextResponse.json(
      { error: "Failed to fetch fonts" },
      { status: 500 }
    );
  }
}
