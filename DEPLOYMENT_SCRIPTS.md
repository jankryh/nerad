# 🚀 Deployment Scripty pro Linux

## 📋 Přehled

Vytvořil jsem dva deployment scripty pro automatizaci celého procesu:

1. **`deploy.sh`** - Kompletní script s pokročilými funkcemi
2. **`deploy-simple.sh`** - Zjednodušená verze pro rychlé použití

## 🔧 deploy.sh - Kompletní script

### Funkce:
- ✅ **Git pull** - aktualizace kódu
- ✅ **Docker build** - sestavení image
- ✅ **Docker push** - upload na Quay.io
- ✅ **Docker run** - spuštění kontejneru
- ✅ **Kontrola předpokladů** - Docker, Git
- ✅ **Error handling** - zastavení při chybě
- ✅ **Ověření deploymentu** - kontrola funkčnosti
- ✅ **Cleanup** - úklid nepoužívaných objektů
- ✅ **Barevný výstup** - přehledné logování
- ✅ **Argumenty** - flexibilní konfigurace

### Použití:

```bash
# Standardní deployment
./deploy.sh

# Deployment s konkrétním tagem
./deploy.sh -t v1.0.0

# Deployment na jiný port
./deploy.sh -p 9090

# Bez push na Quay.io
./deploy.sh --no-push

# Bez cleanup
./deploy.sh --no-cleanup

# Nápověda
./deploy.sh --help
```

### Argumenty:
- `-t, --tag` - specifikovat tag (default: latest)
- `-p, --port` - specifikovat port (default: 8080)
- `--no-push` - přeskočit push na Quay.io
- `--no-cleanup` - přeskočit cleanup
- `-h, --help` - zobrazit nápovědu

## 🚀 deploy-simple.sh - Zjednodušená verze

### Funkce:
- ✅ **Git pull** - aktualizace kódu
- ✅ **Docker build** - sestavení image
- ✅ **Docker push** - upload na Quay.io
- ✅ **Docker run** - spuštění kontejneru
- ✅ **Minimální výstup** - jen základní informace

### Použití:

```bash
# Spuštění
./deploy-simple.sh
```

## 📋 Požadavky

### Systém:
- **Linux** (Ubuntu, Debian, CentOS, RHEL)
- **Bash** shell
- **Docker** nainstalovaný a běžící
- **Git** nainstalovaný
- **Přístup k internetu** pro push na Quay.io

### Docker:
```bash
# Instalace Dockeru (Ubuntu/Debian)
sudo apt update
sudo apt install docker.io docker-compose

# Spuštění služby
sudo systemctl start docker
sudo systemctl enable docker

# Přidání uživatele do docker skupiny
sudo usermod -aG docker $USER
# Restart session nebo: newgrp docker
```

### Git:
```bash
# Instalace Git
sudo apt install git

# Konfigurace (pokud ještě není)
git config --global user.name "Vaše jméno"
git config --global user.email "vase@email.cz"
```

## 🚀 Rychlý start

### 1. Stáhnout scripty:
```bash
# Ujistěte se, že máte práva
chmod +x deploy.sh deploy-simple.sh
```

### 2. Spustit deployment:
```bash
# Kompletní deployment
./deploy.sh

# Nebo zjednodušený
./deploy-simple.sh
```

### 3. Ověřit funkčnost:
```bash
# Kontrola kontejneru
docker ps

# Test aplikace
curl http://localhost:8080

# Logy
docker logs rez-jizdni-rad
```

## 🔍 Troubleshooting

### Časté problémy:

#### Docker daemon neběží:
```bash
sudo systemctl start docker
sudo systemctl status docker
```

#### Práva k Dockeru:
```bash
# Přidat uživatele do docker skupiny
sudo usermod -aG docker $USER
newgrp docker
```

#### Port je obsazen:
```bash
# Zkontrolovat co běží na portu 8080
sudo netstat -tuln | grep :8080

# Nebo použít jiný port
./deploy.sh -p 9090
```

#### Git pull selhal:
```bash
# Zkontrolovat Git status
git status

# Zkontrolovat remote
git remote -v

# Reset na origin/main
git fetch origin
git reset --hard origin/main
```

#### Docker build selhal:
```bash
# Zkontrolovat Dockerfile
cat Dockerfile

# Zkontrolovat disk space
df -h

# Cleanup Docker
docker system prune -a
```

## 📊 Monitoring

### Stav kontejneru:
```bash
docker ps -a | grep rez-jizdni-rad
```

### Logy:
```bash
docker logs rez-jizdni-rad
docker logs -f rez-jizdni-rad  # sledování v reálném čase
```

### Využití prostředků:
```bash
docker stats rez-jizdni-rad
```

### Stav aplikace:
```bash
curl -I http://localhost:8080
```

## 🔄 Automatizace

### Cron job (denní deployment):
```bash
# Otevřít crontab
crontab -e

# Přidat řádek pro denní deployment v 2:00
0 2 * * * cd /cesta/k/projektu && ./deploy.sh >> /var/log/deploy.log 2>&1
```

### CI/CD pipeline:
```bash
# Příklad pro GitHub Actions
# Vytvořit .github/workflows/deploy.yml
```

## 📝 Logy

### Deployment logy:
```bash
# Zobrazit poslední deployment
./deploy.sh 2>&1 | tee deploy.log

# Sledovat deployment v reálném čase
./deploy.sh 2>&1 | tee deploy.log | grep -E "(INFO|SUCCESS|ERROR|WARNING)"
```

## 🎯 Doporučení

1. **Vždy testujte** na testovacím prostředí před production
2. **Používejte tagy** pro verze (v1.0.0, v1.1.0, atd.)
3. **Monitorujte logy** po deploymentu
4. **Mějte backup** před velkými změnami
5. **Dokumentujte** změny v deploymentu

## 🆘 Podpora

Pokud máte problémy s deploymentem:

1. **Zkontrolujte logy**: `docker logs rez-jizdni-rad`
2. **Ověřte Docker**: `docker info`
3. **Zkontrolujte Git**: `git status`
4. **Restartujte Docker**: `sudo systemctl restart docker`

---

**Autor**: AI Assistant  
**Verze**: 1.0.0  
**Datum**: 2025-09-03
