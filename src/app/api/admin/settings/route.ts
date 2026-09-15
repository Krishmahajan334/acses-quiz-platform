import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

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

    const requiredYears = setting ? JSON.parse(setting.value) : ['FY', 'SY', 'TY', 'Final Year'];

    return NextResponse.json({
      success: true,
      prnRequiredYears: requiredYears
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error) {
    console.error('Settings GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { prnRequiredYears } = await request.json();

    if (!Array.isArray(prnRequiredYears)) {
      return NextResponse.json({ success: false, error: 'Invalid data format' }, { status: 400 });
    }

    try {
      await prisma.systemSetting.upsert({
        where: { key: 'PRN_REQUIRED_YEARS' },
        update: { value: JSON.stringify(prnRequiredYears) },
        create: { key: 'PRN_REQUIRED_YEARS', value: JSON.stringify(prnRequiredYears) },
      });
    } catch (upsertError: any) {
      // If table doesn't exist, create it and retry (useful for Vercel environments where db push isn't run automatically)
      if (upsertError.message?.includes('no such table') || upsertError.code === 'P2021') {
        console.log('SystemSetting table not found, creating it...');
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "SystemSetting" (
              "key" TEXT NOT NULL PRIMARY KEY,
              "value" TEXT NOT NULL
          );
        `);
        // Retry
        await prisma.systemSetting.upsert({
          where: { key: 'PRN_REQUIRED_YEARS' },
          update: { value: JSON.stringify(prnRequiredYears) },
          create: { key: 'PRN_REQUIRED_YEARS', value: JSON.stringify(prnRequiredYears) },
        });
      } else {
        throw upsertError;
      }
    }

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Settings POST Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}
