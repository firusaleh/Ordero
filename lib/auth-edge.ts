import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

// Für Middleware: Verwende die gemeinsame Auth-Konfiguration
export const { auth: authEdge } = NextAuth(authConfig)