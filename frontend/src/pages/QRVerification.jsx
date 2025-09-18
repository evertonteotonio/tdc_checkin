import { useState, useRef, useEffect } from 'react'
import QrScanner from 'qr-scanner'
import { Camera, CheckCircle, AlertCircle, QrCode, User, Building, Clock, Eye } from 'lucide-react'

export function QRVerification() {
  const [scanning, setScanning] = useState(false)
  const [scannedData, setScannedData] = useState(null)
  const [error, setError] = useState(null)
  const [qrScanner, setQrScanner] = useState(null)
  const videoRef = useRef(null)

  useEffect(() => {
    return () => {
      if (qrScanner) {
        qrScanner.stop()
        qrScanner.destroy()
      }
    }
  }, [qrScanner])

  const startScanning = async () => {
    try {
      setError(null)
      setScannedData(null)
      
      // Verificar se a câmera está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Câmera não disponível neste dispositivo ou navegador')
        return
      }

      // Solicitar permissão da câmera primeiro
      try {
        await navigator.mediaDevices.getUserMedia({ video: true })
      } catch (permissionError) {
        setError('Permissão da câmera negada. Clique no ícone da câmera na barra de endereços e permita o acesso.')
        return
      }

      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          try {
            const data = JSON.parse(result.data)
            // Verificar se é um QR code válido do sistema
            if (data.checkinId && data.participantId && data.name) {
              setScannedData(data)
              setScanning(false)
              scanner.stop()
            } else {
              setError('QR Code inválido - não é um check-in do evento')
            }
          } catch (err) {
            setError('QR Code inválido - formato não reconhecido')
          }
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment' // Usar câmera traseira se disponível
        }
      )

      await scanner.start()
      setQrScanner(scanner)
      setScanning(true)
    } catch (err) {
      console.error('Scanner error:', err)
      if (err.name === 'NotAllowedError') {
        setError('Permissão da câmera negada. Permita o acesso à câmera e tente novamente.')
      } else if (err.name === 'NotFoundError') {
        setError('Nenhuma câmera encontrada no dispositivo.')
      } else if (err.name === 'NotSupportedError') {
        setError('Câmera não suportada neste navegador. Use Chrome, Firefox ou Safari.')
      } else {
        setError(`Erro ao iniciar scanner: ${err.message || 'Erro desconhecido'}`)
      }
    }
  }

  const stopScanning = () => {
    if (qrScanner) {
      qrScanner.stop()
      setScanning(false)
    }
  }

  const resetVerification = () => {
    setScannedData(null)
    setError(null)
    if (qrScanner) {
      qrScanner.stop()
      setScanning(false)
    }
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMethodLabel = (method) => {
    return method === 'FACIAL_RECOGNITION' ? 'Reconhecimento Facial' : 'Check-in Manual'
  }

  const getMethodColor = (method) => {
    return method === 'FACIAL_RECOGNITION' ? 'text-blue-600' : 'text-green-600'
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Verificação de QR Code</h1>
        <p className="text-gray-600">Escaneie QR codes de check-in para verificar participantes</p>
      </div>

      {scannedData && (
        <div className="card bg-green-50 border border-green-200 mb-6">
          <div className="text-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-800 mb-2">QR Code Válido!</h3>
            <p className="text-green-700">Check-in verificado com sucesso</p>
          </div>

          <div className="bg-white rounded-lg p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Participante</p>
                <p className="font-semibold text-gray-900">{scannedData.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Empresa</p>
                <p className="font-medium text-gray-700">{scannedData.company}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Data/Hora do Check-in</p>
                <p className="font-medium text-gray-700">{formatTimestamp(scannedData.timestamp)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Eye className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Método de Check-in</p>
                <p className={`font-medium ${getMethodColor(scannedData.method)}`}>
                  {getMethodLabel(scannedData.method)}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">ID do Check-in</p>
                  <p className="font-mono text-xs text-gray-700 break-all">{scannedData.checkinId}</p>
                </div>
                <div>
                  <p className="text-gray-500">ID do Participante</p>
                  <p className="font-mono text-xs text-gray-700 break-all">{scannedData.participantId}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={resetVerification}
              className="btn-primary"
            >
              Verificar Outro QR Code
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="card bg-red-50 border border-red-200 mb-6">
          <div className="flex items-center space-x-2 text-red-800 mb-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Erro na verificação</span>
          </div>
          <p className="text-red-700">{error}</p>
          <button
            onClick={resetVerification}
            className="btn-secondary mt-4"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {!scannedData && !error && (
        <div className="card">
          <div className="text-center">
            <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Scanner de QR Code</h2>
            
            {!scanning && (
              <div>
                <p className="text-gray-600 mb-6">
                  Clique no botão abaixo para iniciar o scanner e verificar QR codes de check-in
                </p>
                <button
                  onClick={startScanning}
                  className="btn-primary flex items-center space-x-2 mx-auto"
                >
                  <Camera className="h-4 w-4" />
                  <span>Iniciar Scanner</span>
                </button>
              </div>
            )}

            {scanning && (
              <div>
                <div className="relative inline-block rounded-lg overflow-hidden mb-4">
                  <video
                    ref={videoRef}
                    className="w-80 h-60 object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                    <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-blue-500"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-blue-500"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-blue-500"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-blue-500"></div>
                  </div>
                </div>
                
                <p className="text-blue-600 font-medium mb-4">
                  Posicione o QR code dentro da área de escaneamento
                </p>
                
                <button
                  onClick={stopScanning}
                  className="btn-secondary"
                >
                  Parar Scanner
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">Como usar:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Clique em "Iniciar Scanner" para ativar a câmera</li>
          <li>• <strong>Permita o acesso à câmera</strong> quando solicitado pelo navegador</li>
          <li>• Posicione o QR code do check-in na área de escaneamento</li>
          <li>• O sistema verificará automaticamente os dados do participante</li>
          <li>• Apenas QR codes gerados pelo sistema de check-in são válidos</li>
        </ul>
      </div>

      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-800 mb-2">Problemas com a câmera?</h3>
        <ul className="text-yellow-700 text-sm space-y-1">
          <li>• Certifique-se de que está usando HTTPS ou localhost</li>
          <li>• Clique no ícone da câmera na barra de endereços e permita o acesso</li>
          <li>• Use navegadores modernos: Chrome, Firefox, Safari ou Edge</li>
          <li>• Verifique se outra aplicação não está usando a câmera</li>
        </ul>
      </div>
    </div>
  )
}
