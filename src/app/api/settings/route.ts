import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let setting = null;
    try {
      setting = await prisma.systemSetting.findUnique({
        where: { key: 'PRN_REQUIRED_YEARS' }
      });
    } catch (e: any) {
      if (e.message?.includes('no such table') || e.code === 'P2021') {
        console.warn('SystemSetting table missing, using defaults.');
      } else {
        throw e;
      }
    }

    // Default configuration if none exists
    const requiredYears = setting ? JSON.parse(setting.value) : ['FY', 'SY', 'TY', 'Final Year'];

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
