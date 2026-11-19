# davidarteaga.co

Sitio estático de David Arteaga®: una casa de nueve habitaciones (inicio, quién soy, herramientas, gestión comercial, método, productividad laboral, casos, programa y asesoría gratuita).

## Publicar en Vercel
1. En vercel.com, "Add New → Project", importar este repositorio. Framework: Other. Sin comando de build.
2. En Settings → Domains, agregar `davidarteaga.co` y `www.davidarteaga.co`.
3. En GoDaddy cambiar solo: registro A de `@` al valor que indique Vercel y CNAME `www` a `cname.vercel-dns.com`. No tocar los registros MX (correo).

## Antes de publicar
- Confirmar autorización de Vimar Vidrios para mostrar su caso.
- Revisar la política de datos (`politica-de-datos.html`) y completar documento y fecha.
- Verificar que `/finanzas` responde bien a través del rewrite hacia app-financiera-david.vercel.app.
- Agregar la fotografía profesional en el recibidor.

## Despliegue
- Proyecto en Vercel: `davidarteaga-web` (cuenta davidarteagaco). Cada push o merge a `main` publica en producción; cada pull request genera una vista previa.
- URL de revisión antes del cambio de DNS: `https://davidarteaga-web.vercel.app`.
