# SSL-Zertifikat Setup für Oriido

## Übersicht
SSL/TLS-Zertifikate sind essentiell für die Sicherheit Ihrer Oriido-Installation. Diese Anleitung erklärt die verschiedenen Optionen für SSL-Zertifikate.

## 1. Vercel Deployment (Empfohlen)

Wenn Sie Oriido auf Vercel deployen, wird SSL **automatisch** eingerichtet:

- ✅ Automatische SSL-Zertifikate von Let's Encrypt
- ✅ Automatische Erneuerung
- ✅ Keine zusätzliche Konfiguration erforderlich
- ✅ Unterstützt Custom Domains

### Setup für Custom Domain auf Vercel:
```bash
1. Gehen Sie zu Ihrem Vercel Dashboard
2. Wählen Sie Ihr Projekt
3. Gehen Sie zu Settings > Domains
4. Fügen Sie Ihre Domain hinzu (z.B. oriido.com)
5. Folgen Sie den DNS-Anweisungen
6. SSL wird automatisch aktiviert (kann 24 Stunden dauern)
```

## 2. Railway/Render Deployment

Railway und Render bieten ebenfalls automatische SSL-Zertifikate:

### Railway:
- Automatisches SSL für *.up.railway.app Domains
- Custom Domains: SSL automatisch via Let's Encrypt

### Render:
- Automatisches SSL für *.onrender.com Domains
- Custom Domains: SSL automatisch via Let's Encrypt

## 3. Self-Hosting mit Nginx

Für Self-Hosting empfehlen wir Nginx mit Let's Encrypt (Certbot):

### Installation:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install nginx certbot python3-certbot-nginx
```

### Nginx Konfiguration:
```nginx
# /etc/nginx/sites-available/oriido
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (wird von Certbot automatisch eingefügt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL-Zertifikat mit Certbot erhalten:
```bash
# Interaktive Installation
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Oder automatisch
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com --non-interactive --agree-tos --email your@email.com
```

### Automatische Erneuerung einrichten:
```bash
# Test der Erneuerung
sudo certbot renew --dry-run

# Cronjob für automatische Erneuerung (fügt zu crontab hinzu)
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo tee -a /etc/crontab > /dev/null
```

## 4. Docker Deployment mit Traefik

Für Docker-Deployments empfehlen wir Traefik als Reverse Proxy:

### docker-compose.yml:
```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.myresolver.acme.tlschallenge=true"
      - "--certificatesresolvers.myresolver.acme.email=your@email.com"
      - "--certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "./letsencrypt:/letsencrypt"
      - "/var/run/docker.sock:/var/run/docker.sock:ro"

  oriido:
    build: .
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.oriido.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.oriido.entrypoints=websecure"
      - "traefik.http.routers.oriido.tls.certresolver=myresolver"
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
      - "traefik.http.routers.oriido-http.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.oriido-http.entrypoints=web"
      - "traefik.http.routers.oriido-http.middlewares=redirect-to-https"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      # ... andere env vars
```

## 5. Cloudflare SSL (Proxy)

Wenn Sie Cloudflare verwenden:

### Cloudflare Dashboard:
1. Fügen Sie Ihre Domain zu Cloudflare hinzu
2. Aktivieren Sie "Full (strict)" SSL/TLS Verschlüsselung
3. Aktivieren Sie "Always Use HTTPS"
4. Aktivieren Sie "Automatic HTTPS Rewrites"

### Origin Server Certificate:
```bash
1. Gehen Sie zu SSL/TLS > Origin Server
2. Erstellen Sie ein Zertifikat
3. Installieren Sie es auf Ihrem Server
4. Konfigurieren Sie Nginx/Apache damit
```

## 6. SSL-Konfiguration testen

### Online-Tools:
- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [SSL Checker](https://www.sslshopper.com/ssl-checker.html)

### Kommandozeile:
```bash
# Zertifikat überprüfen
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Zertifikat-Details anzeigen
echo | openssl s_client -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -text

# Ablaufdatum prüfen
echo | openssl s_client -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

## 7. Security Headers

Fügen Sie diese Headers für zusätzliche Sicherheit hinzu:

### Next.js (next.config.js):
```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}
```

## 8. Troubleshooting

### Problem: Mixed Content Warnings
**Lösung**: Stellen Sie sicher, dass alle Ressourcen über HTTPS geladen werden:
```javascript
// In Ihrer App
const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://yourdomain.com' 
  : 'http://localhost:3000'
```

### Problem: SSL-Zertifikat abgelaufen
**Lösung**: 
```bash
# Let's Encrypt erneuern
sudo certbot renew --force-renewal

# Nginx neustarten
sudo systemctl restart nginx
```

### Problem: ERR_CERT_AUTHORITY_INVALID
**Lösung**: 
- Verwenden Sie ein vertrauenswürdiges Zertifikat (Let's Encrypt)
- Für Development: Akzeptieren Sie das selbstsignierte Zertifikat

## 9. Best Practices

1. **Verwenden Sie immer HTTPS in Production**
2. **Aktivieren Sie HSTS (HTTP Strict Transport Security)**
3. **Verwenden Sie mindestens TLS 1.2, besser TLS 1.3**
4. **Erneuern Sie Zertifikate automatisch**
5. **Überwachen Sie Ablaufdaten**
6. **Testen Sie regelmäßig mit SSL Labs**
7. **Implementieren Sie Certificate Pinning für mobile Apps**

## 10. Monitoring

### Zertifikat-Ablauf überwachen:
```bash
#!/bin/bash
# check-ssl-expiry.sh
domain="yourdomain.com"
expiry_date=$(echo | openssl s_client -connect ${domain}:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
expiry_epoch=$(date -d "${expiry_date}" +%s)
current_epoch=$(date +%s)
days_left=$(( ($expiry_epoch - $current_epoch) / 86400 ))

if [ $days_left -lt 30 ]; then
    echo "WARNING: SSL certificate expires in $days_left days!"
    # Sende E-Mail oder Slack-Benachrichtigung
fi
```

## Support

Bei Fragen zum SSL-Setup:
- 📧 E-Mail: support@oriido.com
- 📖 Dokumentation: https://docs.oriido.com/ssl
- 💬 Discord: https://discord.gg/oriido