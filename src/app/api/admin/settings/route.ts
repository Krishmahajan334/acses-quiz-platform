import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');
    if (!adminSession?.value) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'PRN_REQUIRED_YEARS' }
    });

    const requiredYears = setting ? JSON.parse(setting.value) : ['SY', 'TY', 'Final Year'];

    return NextResponse.json({
      success: true,
      prnRequiredYears: requiredYears
    });
  } catch (error) {
    console.error('Settings GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session');
    if (!adminSession?.value) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { prnRequiredYears } = await request.json();

    if (!Array.isArray(prnRequiredYears)) {
      return NextResponse.json({ success: false, error: 'Invalid data format' }, { status: 400 });
    }

    await prisma.systemSetting.upsert({
      where: { key: 'PRN_REQUIRED_YEARS' },
      update: { value: JSON.stringify(prnRequiredYears) },
      create: { key: 'PRN_REQUIRED_YEARS', value: JSON.stringify(prnRequiredYears) },
    });

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Settings POST Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save settings' }, { status: 500 });
  }
}
