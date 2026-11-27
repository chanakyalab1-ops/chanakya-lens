import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase-user";
import { isOwnerEmail } from "@/lib/memberAccess";
import { getAnalyst } from "@/lib/analystDesk";
import { MAX_IMPORT_BYTES, MAX_IMPORT_CHARS, pdfTextToEditor, wordDocToEditor } from "@/lib/importDoc";

export const runtime = "nodejs";
export const maxDuration = 30;

const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

// Reads a Word (.docx) or PDF file a writer uploads and returns a heading and text for the editor.
// Nothing is saved or published here: she checks it in the editor first.
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user?.email) return fail("Sign in first.", 401);
  const analyst = await getAnalyst(user.email);
  if (!isOwnerEmail(user.email) && !(analyst && analyst.active)) return fail("Not allowed.", 403);

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    file = f instanceof File ? f : null;
  } catch {
    return fail("Could not read the upload.");
  }
  if (!file) return fail("Choose a file.");
  if (file.size > MAX_IMPORT_BYTES) return fail("That file is over 4 MB. Save a smaller copy, or paste the text in.", 413);

  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());
  try {
    if (name.endsWith(".docx")) {
      if (buf.subarray(0, 2).toString("latin1") !== "PK") return fail("That does not look like a Word .docx file.");
      const mammoth = await import("mammoth");
      const { value } = await mammoth.convertToHtml({ buffer: buf }, { styleMap: ["p[style-name='Title'] => h1:fresh", "p[style-name='Subtitle'] => p:fresh"] });
      const r = wordDocToEditor(value);
      if (!r.body.trim()) return fail("That file has no text in it.");
      return NextResponse.json({ ok: true, kind: "word", title: r.title, body: r.body.slice(0, MAX_IMPORT_CHARS) });
    }
    if (name.endsWith(".pdf")) {
      if (buf.subarray(0, 4).toString("latin1") !== "%PDF") return fail("That does not look like a PDF.");
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buf));
      const { text } = await extractText(pdf, { mergePages: true });
      const r = pdfTextToEditor(Array.isArray(text) ? text.join("\n") : text);
      if (!r.body.trim()) return fail("That PDF has no selectable text. It may be a scan, so paste the text in instead.");
      return NextResponse.json({ ok: true, kind: "pdf", title: r.title, body: r.body.slice(0, MAX_IMPORT_CHARS) });
    }
    if (name.endsWith(".doc")) return fail("Old .doc files are not supported. In Word, choose Save As and pick .docx.");
    return fail("Upload a Word (.docx) or PDF file.");
  } catch {
    return fail("Could not read that file. Try saving it again as .docx or PDF, or paste the text in.", 422);
  }
}
