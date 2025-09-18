#!/bin/bash

echo "🚀 Iniciando ambiente de desenvolvimento..."

# Verificar se perfil AWS está configurado
if ! aws sts get-caller-identity --profile tdc > /dev/null 2>&1; then
    echo "❌ Perfil AWS 'tdc' não encontrado"
    echo "Execute primeiro: npm run setup"
    exit 1
fi

# Função para cleanup ao sair
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar backend em background
echo "🔧 Iniciando backend..."
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

# Aguardar backend inicializar
sleep 3

# Iniciar frontend em background
echo "🎨 Iniciando frontend..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Ambiente iniciado!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3001"
echo "☁️  AWS Profile: tdc (us-east-1)"
echo ""
echo "Pressione Ctrl+C para parar todos os serviços"

# Aguardar indefinidamente
wait
