# Frontend — SO/ARCHIVO

Página estática (HTML / CSS / JS puro, sin frameworks) desplegada en una instancia EC2 de AWS con Nginx como reverse proxy y PM2 como servidor de archivos estáticos.

**URL:** https://proyectososergio.scaleautomatization.tech

---

## Stack

| Componente | Tecnología |
|------------|------------|
| Servidor   | AWS EC2 — Ubuntu Server 24.04 LTS (`t3.micro`) |
| Reverse proxy | Nginx 1.28 |
| Process manager | PM2 (sirve los estáticos en el puerto 3000) |
| HTTPS | Let's Encrypt vía Certbot |

---

## Pasos de despliegue

### 1. Crear la instancia EC2

- **AMI:** Ubuntu Server 24.04 LTS (Free tier eligible)
- **Tipo:** `t3.micro`
- **Key pair:** Llave `.pem` para acceso SSH
- **Security Group:** Puertos abiertos:

| Puerto | Uso   |
|--------|-------|
| 22     | SSH   |
| 80     | HTTP  |
| 443    | HTTPS |

### 2. Conectarse por SSH

```bash
ssh -i mi-llave.pem ubuntu@<IP-PUBLICA>
```

### 3. Instalar dependencias

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nginx git -y

# Node.js + PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 4. Clonar el repositorio

```bash
cd ~
git clone https://github.com/<usuario>/Proyecto-Final-SO.git
```

### 5. Crear symlink para Nginx

En vez de copiar archivos, se crea un enlace simbólico desde `/var/www/` apuntando a la carpeta `frontend/` del repositorio clonado:

```bash
sudo ln -s ~/Proyecto-Final-SO/frontend /var/www/proyectososergio
```

Dar permisos para que Nginx pueda acceder a través del home:

```bash
sudo chmod 755 /home/ubuntu
sudo chmod -R 755 ~/Proyecto-Final-SO/frontend
```

### 6. Levantar el frontend con PM2

PM2 sirve los archivos estáticos como un demonio persistente en el puerto 3000:

```bash
pm2 serve /var/www/proyectososergio 3000 --name frontend --spa
pm2 startup
# (copiar y ejecutar el comando sudo que imprime)
pm2 save
```

### 7. Configurar Nginx como reverse proxy

Se creó el archivo `/etc/nginx/sites-available/proyectososergio` con la siguiente configuración:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name proyectososergio.scaleautomatization.tech;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activar el sitio y recargar:

```bash
sudo ln -s /etc/nginx/sites-available/proyectososergio /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 8. Certificado HTTPS con Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d proyectososergio.scaleautomatization.tech
```

Certbot configura automáticamente la redirección HTTP → HTTPS y agrega los bloques SSL al archivo de Nginx.

---

## Verificación

- `https://proyectososergio.scaleautomatization.tech`
- `pm2 list` → el proceso `frontend` aparece como `online`
- `pm2 logs frontend` → logs del servidor estático
- 

---

## Estructura de archivos

```
frontend/
├── index.html       # Página principal
├── styles.css       # Estilos base
├── archive.css      # Estilos del timeline/archivo
├── holo.css         # Hologramas 3D, tilt e interacciones del cursor
├── config.js        # URL de la API del backend
├── app.js           # Lógica de la aplicación
├── favicon.svg      # Ícono del sitio
├── nginx.conf       # Config de Nginx (reverse proxy)
└── README.md        # Este archivo
```
