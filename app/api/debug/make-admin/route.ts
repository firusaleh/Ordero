import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        error: 'Nicht eingeloggt'
      }, { status: 401 });
    }

    // Update User auf ADMIN Rolle
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Sie sind jetzt Admin!',
      user: updatedUser
    });

  } catch (error: any) {
    console.error('Fehler beim Admin-Update:', error);
    
    // Falls User nicht existiert, erstelle einen
    if (error.code === 'P2025') {
      try {
        const newUser = await prisma.user.create({
          data: {
            email: session!.user!.email!,
            name: session!.user!.name || 'Admin',
            role: 'ADMIN',
            password: 'temp-password-change-me' // Sollte geändert werden
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        });
        
        return NextResponse.json({
          success: true,
          message: 'Admin-User erstellt!',
          user: newUser
        });
      } catch (createError: any) {
        return NextResponse.json(
          { 
            error: 'Fehler beim Erstellen des Users',
            details: createError?.message
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Fehler beim Update',
        details: error?.message || 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}