import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BOOK_SOURCE_TRUTH_ROOT = path.join(process.cwd(), "source-truth-plan", "references", "betsy_desktop_nerdkle_the_book");
const BOOK_SOURCE_TRUTH_REPO_URL =
  "https://github.com/benleakwerkles/Werkles/tree/main/source-truth-plan/references/betsy_desktop_nerdkle_the_book";

const BOOK_CHAPTER_NUMBER_WORDS: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
  SIX: 6,
  SEVEN: 7,
  EIGHT: 8,
  NINE: 9,
  TEN: 10,
  ELEVEN: 11,
  TWELVE: 12,
  THIRTEEN: 13,
  FOURTEEN: 14,
  FIFTEEN: 15,
  SIXTEEN: 16,
  SEVENTEEN: 17,
  EIGHTEEN: 18,
  NINETEEN: 19,
  TWENTY: 20,
  THIRTY: 30
};

type ChapterRecord = {
  chapter_id: string;
  chapter_number: number | null;
  sort_key: string;
  title: string;
  filename: string;
  extension: string;
  local_path: string;
  repo_path: string;
  github_url: string;
  byte_count: number;
  sha256: string;
  modified_at: string;
};

function sha256Hex(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex").toUpperCase();
}

function safeReceiptStem(value: string) {
  return String(value || "receipt").replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 120);
}

function bookRepoUrlFor(relativePath: string) {
  return `${BOOK_SOURCE_TRUTH_REPO_URL}/${relativePath.split(path.sep).map(encodeURIComponent).join("/")}`;
}

function parseBookChapterNumber(name: string) {
  const upper = String(name || "").toUpperCase();
  if (upper.includes("FOREWORD")) return 0;
  const chapterMatch = upper.match(/CHAPTER\s+([A-Z]+)(?:[-\s]+([A-Z]+))?/);
  if (chapterMatch) {
    const first = BOOK_CHAPTER_NUMBER_WORDS[chapterMatch[1]] || 0;
    const second = BOOK_CHAPTER_NUMBER_WORDS[chapterMatch[2] || ""] || 0;
    if (first || second) return first + second;
  }
  if (upper.includes("ESCAPE VELOCITY")) return 2;
  if (upper.includes("COST OF FORGETTING")) return 5;
  if (upper.includes("INHERITANCE")) return 6;
  if (upper.includes("RATCHET")) return 7;
  if (upper.includes("DEAD CONTINUE")) return 8;
  if (upper.includes("SOVEREIGNTY")) return 9;
  if (upper.includes("HEALTH")) return 10;
  if (upper.includes("COOPERATION")) return 11;
  if (upper.includes("CONSCIOUSNESS")) return 12;
  if (upper.includes("CAPACITY")) return 13;
  if (upper.includes("OPPORTUNITY")) return 14;
  if (upper.includes("HOPEFUL FUTURE")) return 16;
  if (upper.includes("HOPE")) return 15;
  if (upper.includes("OPERATOR PRINCIPLE")) return 17;
  if (upper.includes("GARDEN") && upper.includes("RELIGION")) return 18;
  if (upper.includes("TINKULARITY")) return 19;
  if (upper.includes("THE TEST") || upper.includes("REALITY GETS A VOTE")) return 20;
  if (upper.includes("THE LOOP")) return 21;
  if (upper.includes("THE END")) return 22;
  return 900;
}

function isBookChapterCandidate(fileName: string) {
  const lower = String(fileName || "").toLowerCase();
  const ext = path.extname(lower);
  if (![".docx", ".md", ".pdf"].includes(ext)) return false;
  return (
    lower.includes("foreword") ||
    lower.startsWith("chapter ") ||
    lower.includes("escape velocity") ||
    lower.includes("cost of forgetting") ||
    lower.includes("dead continue") ||
    lower.includes("operator principle") ||
    lower.includes("garden") ||
    lower.includes("religion") ||
    lower.includes("tinkularity") ||
    lower.includes("hopeful future") ||
    lower === "the end.docx"
  );
}

function bookChapterTitle(fileName: string, chapterNumber: number) {
  const base = path.basename(fileName, path.extname(fileName)).replace(/\s+\(\d+\)$/u, " copy").replaceAll("_", " ").replace(/\s+/g, " ").trim();
  if (chapterNumber === 0) return base;
  if (chapterNumber > 0 && chapterNumber < 900 && !/^Chapter\s/i.test(base)) return `Chapter ${chapterNumber} - ${base}`;
  return base;
}

function listBookChapters(): ChapterRecord[] {
  if (!fs.existsSync(BOOK_SOURCE_TRUTH_ROOT)) {
    throw new Error(`Book source truth path not found: ${BOOK_SOURCE_TRUTH_ROOT}`);
  }

  const entries = fs.readdirSync(BOOK_SOURCE_TRUTH_ROOT, { withFileTypes: true });
  const chapters = entries
    .filter((entry) => entry.isFile() && isBookChapterCandidate(entry.name))
    .map((entry) => {
      const absolutePath = path.join(BOOK_SOURCE_TRUTH_ROOT, entry.name);
      const relativePath = path.relative(BOOK_SOURCE_TRUTH_ROOT, absolutePath);
      const stat = fs.statSync(absolutePath);
      const raw = fs.readFileSync(absolutePath);
      const chapterNumber = parseBookChapterNumber(entry.name);
      const chapterId = safeReceiptStem(
        `${String(chapterNumber).padStart(3, "0")}_${path.basename(entry.name, path.extname(entry.name))}_${path.extname(entry.name).slice(1)}`
      );
      const variantMatch = entry.name.match(/\((\d+)\)\.[^.]+$/);
      const variantSort = variantMatch ? Number(variantMatch[1]) : 0;
      const baseSortName = entry.name.replace(/\s+\(\d+\)(\.[^.]+)$/u, "$1").toLowerCase();
      return {
        chapter_id: chapterId,
        chapter_number: chapterNumber < 900 ? chapterNumber : null,
        sort_key: `${String(chapterNumber).padStart(3, "0")}_${baseSortName}_${String(variantSort).padStart(3, "0")}`,
        title: bookChapterTitle(entry.name, chapterNumber),
        filename: entry.name,
        extension: path.extname(entry.name).slice(1).toLowerCase(),
        local_path: absolutePath,
        repo_path: `source-truth-plan/references/betsy_desktop_nerdkle_the_book/${relativePath.replaceAll(path.sep, "/")}`,
        github_url: bookRepoUrlFor(relativePath),
        byte_count: raw.length,
        sha256: sha256Hex(raw),
        modified_at: stat.mtime.toISOString()
      };
    });

  return chapters.sort((a, b) => a.sort_key.localeCompare(b.sort_key));
}

function decodeXml(value: string) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function findZipEntry(buffer: Buffer, entryName: string) {
  let eocdOffset = -1;
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 66000); offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error("DOCX central directory not found.");

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  let cursor = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) throw new Error("DOCX central directory entry is invalid.");
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const fileNameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localHeaderOffset = buffer.readUInt32LE(cursor + 42);
    const fileName = buffer.subarray(cursor + 46, cursor + 46 + fileNameLength).toString("utf8");

    if (fileName === entryName) {
      if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) throw new Error(`DOCX local header invalid for ${entryName}.`);
      const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
      if (method === 0) return compressed;
      if (method === 8) return zlib.inflateRawSync(compressed);
      throw new Error(`Unsupported DOCX compression method ${method}.`);
    }

    cursor += 46 + fileNameLength + extraLength + commentLength;
  }

  throw new Error(`DOCX entry missing: ${entryName}`);
}

function extractDocxParagraphs(buffer: Buffer) {
  const documentXml = findZipEntry(buffer, "word/document.xml").toString("utf8");
  const paragraphMatches = documentXml.match(/<w:p[\s\S]*?<\/w:p>/g) ?? [];
  const paragraphs = paragraphMatches
    .map((paragraphXml) => {
      const normalized = paragraphXml.replace(/<w:tab\s*\/>/g, "\t").replace(/<w:br\s*\/>/g, "\n");
      const textParts = Array.from(normalized.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)).map((match) => decodeXml(match[1]));
      return textParts.join("").replace(/\u00A0/g, " ").trim();
    })
    .filter(Boolean);

  return paragraphs;
}

function readChapterContent(chapter: ChapterRecord) {
  const raw = fs.readFileSync(chapter.local_path);
  if (chapter.extension === "md") {
    const text = raw.toString("utf8").replace(/^\uFEFF/, "");
    return {
      extraction_status: "TEXT_EXTRACTED",
      extraction_method: "utf8 markdown read",
      paragraphs: text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean),
      text
    };
  }

  if (chapter.extension === "docx") {
    const paragraphs = extractDocxParagraphs(raw);
    return {
      extraction_status: "TEXT_EXTRACTED",
      extraction_method: "docx word/document.xml paragraph extraction",
      paragraphs,
      text: paragraphs.join("\n\n")
    };
  }

  return {
    extraction_status: "UNSUPPORTED_FORMAT",
    extraction_method: "No PDF extractor is wired in this dashboard route yet.",
    paragraphs: [],
    text: ""
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const requested = (url.searchParams.get("chapter_id") || url.searchParams.get("filename") || "").trim();
    if (!requested) {
      return NextResponse.json({ ok: false, status: "CHAPTER_TEXT_BLOCKED", error: "chapter_id or filename is required" }, { status: 400 });
    }

    const chapters = listBookChapters();
    const chapter = chapters.find((item) => item.chapter_id === requested || item.filename === requested);
    if (!chapter) {
      return NextResponse.json({ ok: false, status: "CHAPTER_TEXT_BLOCKED", error: `Chapter not found: ${requested}` }, { status: 404 });
    }

    const content = readChapterContent(chapter);
    return NextResponse.json(
      {
        ok: true,
        status: "CHAPTER_TEXT_READY",
        generated_at: new Date().toISOString(),
        source_root: BOOK_SOURCE_TRUTH_ROOT,
        chapter,
        ...content,
        paragraph_count: content.paragraphs.length,
        character_count: content.text.length,
        rule: "This is extracted reader text from the source-truth file. It is for reading and routing, not a replacement for the source DOCX."
      },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "CHAPTER_TEXT_BLOCKED",
        source_root: BOOK_SOURCE_TRUTH_ROOT,
        error: error instanceof Error ? error.message : "Chapter text extraction failed"
      },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }
}
