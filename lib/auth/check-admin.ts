/**
 * Zentrale Funktion zum Prüfen ob ein User Admin ist
 * Unterstützt verschiedene Admin-Rollen-Schreibweisen
 */
export function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  
  const adminRoles = [
    'ADMIN',
    'SUPER_ADMIN',
    'Super_Admin',  // Ihre aktuelle Rolle
    'SuperAdmin',
    'admin',
    'super_admin'
  ];
  
  return adminRoles.includes(role);
}