import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: 'Nicht eingeloggt',
        session: null 
      }, { status: 401 });
    }

    // Hole User aus der Datenbank
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      sessionEmail: session.user.email,
      sessionName: session.user.name,
      databaseUser: user,
      isAdmin: user?.role === 'ADMIN',
      actualRole: user?.role || 'NO_USER_FOUND'
    });

  } catch (error: any) {
    console.error('Fehler beim Überprüfen der Rolle:', error);
    return NextResponse.json(
      { 
        error: 'Fehler beim Überprüfen',
        details: error?.message || 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}