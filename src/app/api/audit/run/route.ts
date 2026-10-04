import { NextRequest, NextResponse } from 'next/server';
import { runFullAudit } from '@/lib/auditEngine';
import { DEMO_PROJECTS } from '@/lib/demoProjects';
import { FileEntry } from '@/lib/types';

// Input limits protect the endpoint from oversized or abusive payloads.
const MAX_FILES = 300;
const MAX_FILE_BYTES = 1_000_000; // 1 MB per file
const MAX_TOTAL_BYTES = 5_000_000; // 5 MB per request
const MAX_NAME_LENGTH = 120;

function isFileEntry(value: unknown): value is FileEntry {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.path === 'string' && v.path.length > 0 && v.path.length <= 500 && typeof v.content === 'string';
}

export async function POST(req: NextRequest) {
  try {
    const declaredLength = Number(req.headers.get('content-length') ?? 0);
    if (declaredLength > MAX_TOTAL_BYTES * 1.5) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
    }
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 });
    }

    const { demoId, projectName, files } = body as Record<string, unknown>;

    let targetFiles: FileEntry[] = [];
    let targetProjectName =
      typeof projectName === 'string' && projectName.trim()
        ? projectName.trim().slice(0, MAX_NAME_LENGTH)
        : 'Audited Project';

    if (typeof demoId === 'string' && demoId) {
      const demo = DEMO_PROJECTS.find((d) => d.id === demoId);
      if (!demo) {
        return NextResponse.json({ error: 'Demo project not found' }, { status: 404 });
      }
      targetFiles = demo.files;
      targetProjectName = demo.name;
    } else if (Array.isArray(files) && files.length > 0) {
      if (files.length > MAX_FILES) {
        return NextResponse.json({ error: `Too many files (max ${MAX_FILES})` }, { status: 413 });
      }
      if (!files.every(isFileEntry)) {
        return NextResponse.json(
          { error: 'Each file must be an object with a string "path" and string "content"' },
          { status: 400 }
        );
      }
      let total = 0;
      for (const f of files) {
        const size = Buffer.byteLength(f.content, 'utf8');
        if (size > MAX_FILE_BYTES) {
          return NextResponse.json({ error: `File too large: ${f.path} (max 1 MB)` }, { status: 413 });
        }
        total += size;
      }
      if (total > MAX_TOTAL_BYTES) {
        return NextResponse.json({ error: 'Total payload too large (max 5 MB)' }, { status: 413 });
      }
      targetFiles = files;
    } else {
      return NextResponse.json(
        { error: 'Please provide either a demoId or a list of files to audit.' },
        { status: 400 }
      );
    }

    return NextResponse.json(runFullAudit(targetProjectName, targetFiles));
  } catch (error) {
    // Log details server-side only; never leak internals to the client.
    console.error('Audit run error:', error);
    return NextResponse.json({ error: 'Failed to complete audit' }, { status: 500 });
  }
}
