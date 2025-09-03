#!/bin/bash

# 🚀 Automatický Deployment Script pro Jízdní řád z a do Řeže
# Autor: AI Assistant
# Verze: 1.0.0

set -e  # Zastavit při chybě

# 🎨 Barvy pro výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 📋 Konfigurace
IMAGE_NAME="quay.io/rh-ee-jkryhut/nerad"
CONTAINER_NAME="rez-jizdni-rad"
LOCAL_PORT="8080"
CONTAINER_PORT="80"
TAG="latest"

# 🔍 Funkce pro logování
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 🛡️ Kontrola předpokladů
check_prerequisites() {
    log_info "Kontroluji předpoklady..."
    
    # Kontrola Dockeru
    if ! command -v docker &> /dev/null; then
        log_error "Docker není nainstalován nebo není v PATH"
        exit 1
    fi
    
    # Kontrola Git
    if ! command -v git &> /dev/null; then
        log_error "Git není nainstalován nebo není v PATH"
        exit 1
    fi
    
    # Kontrola Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon neběží nebo nemáte práva"
        exit 1
    fi
    
    log_success "Všechny předpoklady jsou splněny"
}

# 🔄 Git pull
git_pull() {
    log_info "Aktualizuji kód z Git repozitáře..."
    
    if git pull origin main; then
        log_success "Git pull úspěšný"
    else
        log_error "Git pull selhal"
        exit 1
    fi
}

# 🏗️ Docker build
docker_build() {
    log_info "Sestavuji Docker image..."
    
    if docker build -t ${IMAGE_NAME}:${TAG} .; then
        log_success "Docker build úspěšný"
    else
        log_error "Docker build selhal"
        exit 1
    fi
}

# 📤 Docker push
docker_push() {
    log_info "Pushuji image na Quay.io..."
    
    if docker push ${IMAGE_NAME}:${TAG}; then
        log_success "Docker push úspěšný"
    else
        log_error "Docker push selhal"
        exit 1
    fi
}

# 🛑 Zastavení starého kontejneru
stop_old_container() {
    log_info "Zastavuji starý kontejner..."
    
    if docker ps -q -f name=${CONTAINER_NAME} | grep -q .; then
        log_info "Zastavuji kontejner ${CONTAINER_NAME}..."
        docker stop ${CONTAINER_NAME}
        log_success "Kontejner zastaven"
    else
        log_info "Žádný běžící kontejner nenalezen"
    fi
}

# 🗑️ Odstranění starého kontejneru
remove_old_container() {
    log_info "Odstraňuji starý kontejner..."
    
    if docker ps -aq -f name=${CONTAINER_NAME} | grep -q .; then
        log_info "Odstraňuji kontejner ${CONTAINER_NAME}..."
        docker rm ${CONTAINER_NAME}
        log_success "Kontejner odstraněn"
    else
        log_info "Žádný kontejner k odstranění"
    fi
}

# 🚀 Spuštění nového kontejneru
docker_run() {
    log_info "Spouštím nový kontejner..."
    
    if docker run -d \
        --name ${CONTAINER_NAME} \
        -p ${LOCAL_PORT}:${CONTAINER_PORT} \
        --restart unless-stopped \
        -e TZ=Europe/Prague \
        ${IMAGE_NAME}:${TAG}; then
        log_success "Kontejner úspěšně spuštěn"
    else
        log_error "Spuštění kontejneru selhalo"
        exit 1
    fi
}

# ✅ Ověření deploymentu
verify_deployment() {
    log_info "Ověřuji deployment..."
    
    # Počkat na spuštění
    sleep 5
    
    # Kontrola, zda kontejner běží
    if docker ps -q -f name=${CONTAINER_NAME} | grep -q .; then
        log_success "Kontejner běží"
    else
        log_error "Kontejner neběží"
        exit 1
    fi
    
    # Kontrola portu
    if netstat -tuln | grep -q ":${LOCAL_PORT} "; then
        log_success "Port ${LOCAL_PORT} je otevřený"
    else
        log_warning "Port ${LOCAL_PORT} není otevřený"
    fi
    
    # Kontrola aplikace
    if curl -s http://localhost:${LOCAL_PORT} > /dev/null; then
        log_success "Aplikace odpovídá na http://localhost:${LOCAL_PORT}"
    else
        log_warning "Aplikace neodpovídá na http://localhost:${LOCAL_PORT}"
    fi
}

# 📊 Zobrazení informací
show_info() {
    log_info "=== Informace o deploymentu ==="
    echo "Image: ${IMAGE_NAME}:${TAG}"
    echo "Kontejner: ${CONTAINER_NAME}"
    echo "Port: ${LOCAL_PORT}:${CONTAINER_PORT}"
    echo "URL: http://localhost:${LOCAL_PORT}"
    echo ""
    
    log_info "=== Stav kontejnerů ==="
    docker ps -a | grep ${CONTAINER_NAME} || echo "Žádné kontejnery"
    echo ""
    
    log_info "=== Poslední logy ==="
    docker logs --tail 10 ${CONTAINER_NAME} 2>/dev/null || echo "Žádné logy"
}

# 🧹 Cleanup
cleanup() {
    log_info "Čistím nepoužívané Docker objekty..."
    docker system prune -f
    log_success "Cleanup dokončen"
}

# 📋 Hlavní funkce
main() {
    echo -e "${BLUE}🚀 Spouštím automatický deployment...${NC}"
    echo ""
    
    # Kontrola předpokladů
    check_prerequisites
    
    # Git pull
    git_pull
    
    # Docker build
    docker_build
    
    # Docker push
    docker_push
    
    # Zastavení a odstranění starého kontejneru
    stop_old_container
    remove_old_container
    
    # Spuštění nového kontejneru
    docker_run
    
    # Ověření deploymentu
    verify_deployment
    
    # Cleanup
    cleanup
    
    # Zobrazení informací
    show_info
    
    echo ""
    log_success "🎉 Deployment úspěšně dokončen!"
    log_info "Aplikace je dostupná na: http://localhost:${LOCAL_PORT}"
}

# 🚨 Error handling
trap 'log_error "Script byl přerušen"; exit 1' INT TERM

# 📖 Help
show_help() {
    echo "Použití: $0 [OPTIONS]"
    echo ""
    echo "OPTIONS:"
    echo "  -h, --help     Zobrazit tuto nápovědu"
    echo "  -t, --tag      Specifikovat tag (default: latest)"
    echo "  -p, --port     Specifikovat port (default: 8080)"
    echo "  --no-push      Přeskočit push na Quay.io"
    echo "  --no-cleanup   Přeskočit cleanup"
    echo ""
    echo "Příklady:"
    echo "  $0                    # Standardní deployment"
    echo "  $0 -t v1.0.0         # Deployment s tagem v1.0.0"
    echo "  $0 -p 9090           # Deployment na port 9090"
    echo "  $0 --no-push         # Bez push na Quay.io"
}

# 🔧 Parsování argumentů
SKIP_PUSH=false
SKIP_CLEANUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -p|--port)
            LOCAL_PORT="$2"
            shift 2
            ;;
        --no-push)
            SKIP_PUSH=true
            shift
            ;;
        --no-cleanup)
            SKIP_CLEANUP=true
            shift
            ;;
        *)
            log_error "Neznámý argument: $1"
            show_help
            exit 1
            ;;
    esac
done

# 🚀 Spuštění hlavní funkce
main
