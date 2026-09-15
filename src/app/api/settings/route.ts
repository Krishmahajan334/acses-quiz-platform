import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'PRN_REQUIRED_YEARS' }
    });

    // Default configuration if none exists: FY is not required, everyone else is.
    const requiredYears = setting ? JSON.parse(setting.value) : ['SY', 'TY', 'Final Year'];

    return NextResponse.json({
      success: true,
      prnRequiredYears: requiredYears
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    });
  } catch (error) {
    console.error('Settings GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}
