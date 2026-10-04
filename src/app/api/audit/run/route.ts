import { NextRequest, NextResponse } from 'next/server';
import { runFullAudit } from '@/lib/auditEngine';
import { DEMO_PROJECTS } from '@/lib/demoProjects';
import { FileEntry } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { demoId, projectName, files } = body;

    let targetFiles: FileEntry[] = [];
    let targetProjectName = projectName || 'Audited Project';

    if (demoId) {
      const demo = DEMO_PROJECTS.find(d => d.id === demoId);
      if (!demo) {
        return NextResponse.json({ error: 'Demo project not found' }, { status: 404 });
      }
      targetFiles = demo.files;
      targetProjectName = demo.name;
    } else if (Array.isArray(files) && files.length > 0) {
      targetFiles = files;
    } else {
      return NextResponse.json(
        { error: 'Please provide either a demoId or a list of files to audit.' },
        { status: 400 }
      );
    }

    const auditResult = runFullAudit(targetProjectName, targetFiles);
    return NextResponse.json(auditResult);
  } catch (error: any) {
    console.error('Audit run error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to complete audit' },
      { status: 500 }
    );
  }
}
