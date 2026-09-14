import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession, isSuperAdmin } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!isSuperAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    // params is a Promise in Next.js 15
    const { id } = await params;

    // Prevent deleting the currently logged-in super admin (or fallback admin)
    if (session?.adminId === id) {
       return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    const existing = await prisma.admin.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    await prisma.admin.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete admin error:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
