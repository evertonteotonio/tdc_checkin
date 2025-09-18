import { useState, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import QRCode from 'qrcode'
import { Camera, Mail, MessageCircle, CheckCircle, AlertCircle, QrCode, Download } from 'lucide-react'
import { checkinService } from '../services/api'

export function Checkin() {
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [assistanceQuery, setAssistanceQuery] = useState('')
  const [assistanceResponse, setAssistanceResponse] = useState(null)
  const [qrCodeUrl, setQrCodeUrl] = useState(null)
  const webcamRef = useRef(null)

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setCapturedImage(imageSrc)
      setShowCamera(false)
    }
  }, [webcamRef])

  const handleFaceCheckin = async () => {
    if (!capturedImage) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(capturedImage)
      const blob = await response.blob()
      const file = new File([blob], 'checkin-photo.jpg', { type: 'image/jpeg' })

      const checkinResult = await checkinService.faceCheckin(file)
      setResult(checkinResult)
      
      // Gerar QR Code com dados do check-in
      const qrData = {
        checkinId: checkinResult.checkin.id,
        participantId: checkinResult.participant.id,
        name: checkinResult.participant.name,
        company: checkinResult.participant.company,
        timestamp: checkinResult.checkin.timestamp,
        method: 'FACIAL_RECOGNITION'
      }
      
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeUrl(qrCodeDataUrl)
      
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao realizar check-in')
    } finally {
      setLoading(false)
    }
  }

  const handleManualCheckin = async (e) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const checkinResult = await checkinService.manualCheckin(email)
      setResult(checkinResult)
      setEmail('')
      
      // Gerar QR Code para check-in manual
      const qrData = {
        checkinId: checkinResult.checkin.id,
        participantId: checkinResult.participant.id,
        name: checkinResult.participant.name,
        company: checkinResult.participant.company,
        timestamp: checkinResult.checkin.timestamp,
        method: 'MANUAL'
      }
      
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeUrl(qrCodeDataUrl)
      
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao realizar check-in')
    } finally {
      setLoading(false)
    }
  }

  const handleAssistance = async (e) => {
    e.preventDefault()
    if (!assistanceQuery.trim() || !result) return

    try {
      const response = await checkinService.getAssistance(assistanceQuery, result.participant.id)
      setAssistanceResponse(response)
      setAssistanceQuery('')
    } catch (err) {
      console.error('Erro ao obter assistência:', err)
    }
  }

  const downloadQRCode = () => {
    if (qrCodeUrl && result) {
      const link = document.createElement('a')
      link.download = `qr-checkin-${result.participant.name.replace(/\s+/g, '-')}.png`
      link.href = qrCodeUrl
      link.click()
    }
  }

  const resetCheckin = () => {
    setResult(null)
    setError(null)
    setAssistanceResponse(null)
    setAssistanceQuery('')
    setCapturedImage(null)
    setShowCamera(false)
    setQrCodeUrl(null)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Check-in do Evento</h1>
        <p className="text-gray-600">Use reconhecimento facial ou digite seu email</p>
      </div>

      {result && (
        <div className="card bg-green-50 border border-green-200 mb-6">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-800 mb-2">Check-in realizado com sucesso!</h3>
            <p className="text-green-700 mb-4">
              Bem-vindo(a), <strong>{result.participant.name}</strong>!
            </p>
            
            {/* QR Code */}
            {qrCodeUrl && (
              <div className="bg-white p-6 rounded-lg border-2 border-green-200 mb-4 inline-block">
                <div className="text-center mb-4">
                  <QrCode className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-medium">Seu QR Code de Check-in</p>
                </div>
                <img src={qrCodeUrl} alt="QR Code do Check-in" className="mx-auto mb-4" />
                <button
                  onClick={downloadQRCode}
                  className="btn-secondary flex items-center space-x-2 mx-auto"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar QR Code</span>
                </button>
              </div>
            )}
            
            {result.greeting && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800 font-medium">{result.greeting.greeting}</p>
                {result.greeting.tip && (
                  <p className="text-blue-700 text-sm mt-2">{result.greeting.tip}</p>
                )}
              </div>
            )}

            {/* Assistência IA */}
            <div className="mt-6">
              <h4 className="text-lg font-medium text-gray-800 mb-3">Precisa de ajuda?</h4>
              <form onSubmit={handleAssistance} className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={assistanceQuery}
                    onChange={(e) => setAssistanceQuery(e.target.value)}
                    placeholder="Pergunte sobre agenda, localização, WiFi..."
                    className="input-field flex-1"
                  />
                  <button
                    type="submit"
                    disabled={!assistanceQuery.trim()}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Perguntar</span>
                  </button>
                </div>
              </form>

              {assistanceResponse && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                  <p className="text-gray-800">{assistanceResponse}</p>
                </div>
              )}
            </div>

            <button
              onClick={resetCheckin}
              className="btn-secondary mt-6"
            >
              Novo Check-in
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="card bg-red-50 border border-red-200 mb-6">
          <div className="flex items-center space-x-2 text-red-800 mb-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Erro no check-in</span>
          </div>
          <p className="text-red-700 mt-2">{error}</p>
          <button
            onClick={resetCheckin}
            className="btn-secondary mt-4"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {!result && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Reconhecimento Facial */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Reconhecimento Facial
            </h2>

            {!showCamera && !capturedImage && (
              <div className="text-center">
                <div className="w-64 h-48 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4">
                  <Camera className="h-12 w-12 text-gray-400" />
                </div>
                <button
                  onClick={() => setShowCamera(true)}
                  className="btn-primary flex items-center space-x-2 mx-auto"
                >
                  <Camera className="h-4 w-4" />
                  <span>Iniciar Câmera</span>
                </button>
              </div>
            )}

            {showCamera && (
              <div className="text-center">
                <div className="inline-block rounded-lg overflow-hidden mb-4">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    width={320}
                    height={240}
                    videoConstraints={{
                      width: 320,
                      height: 240,
                      facingMode: "user"
                    }}
                  />
                </div>
                <div className="space-x-4">
                  <button
                    onClick={capture}
                    className="btn-primary"
                  >
                    Capturar
                  </button>
                  <button
                    onClick={() => setShowCamera(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {capturedImage && (
              <div className="text-center">
                <div className="inline-block rounded-lg overflow-hidden mb-4">
                  <img
                    src={capturedImage}
                    alt="Foto capturada"
                    className="w-64 h-48 object-cover"
                  />
                </div>
                <div className="space-x-4">
                  <button
                    onClick={handleFaceCheckin}
                    disabled={loading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {loading ? 'Processando...' : 'Fazer Check-in'}
                  </button>
                  <button
                    onClick={() => {
                      setCapturedImage(null)
                      setShowCamera(true)
                    }}
                    className="btn-secondary"
                  >
                    Nova Foto
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Check-in Manual */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Check-in Manual
            </h2>

            <form onSubmit={handleManualCheckin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email cadastrado
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'Processando...' : 'Fazer Check-in'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={resetCheckin}
                className="btn-secondary"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
