import { useState, useRef, useEffect } from 'react'
import Webcam from 'react-webcam'
import { Send, Camera, Bot, User, CheckCircle, Loader } from 'lucide-react'

export function ConversationalRegistration() {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [awaitingPhoto, setAwaitingPhoto] = useState(false)
  
  const webcamRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    startConversation()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const startConversation = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat-registration/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSessionId(data.sessionId)
        setMessages([{
          id: Date.now(),
          type: 'bot',
          content: data.response.message,
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error)
      setMessages([{
        id: Date.now(),
        type: 'error',
        content: 'Erro ao iniciar conversa. Tente recarregar a página.',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (message = inputMessage) => {
    if (!message.trim() || !sessionId || loading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat-registration/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message
        })
      })

      const data = await response.json()

      if (data.success) {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: data.response.message,
          timestamp: new Date()
        }

        setMessages(prev => [...prev, botMessage])

        // Verificar se precisa abrir câmera
        if (data.response.needsCamera) {
          setAwaitingPhoto(true)
          setTimeout(() => {
            setShowCamera(true)
          }, 1000)
        }

        // Verificar se cadastro foi completado
        if (data.response.type === 'registration_complete') {
          setRegistrationComplete(true)
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'error',
        content: 'Erro ao processar mensagem. Tente novamente.',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const capturePhoto = async () => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (!imageSrc) return

    setCapturedImage(imageSrc)
    setShowCamera(false)

    // Converter para blob e enviar
    try {
      const response = await fetch(imageSrc)
      const blob = await response.blob()
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' })

      const formData = new FormData()
      formData.append('sessionId', sessionId)
      formData.append('photo', file)

      setLoading(true)

      const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL}/chat-registration/photo`, {
        method: 'POST',
        body: formData
      })

      const data = await uploadResponse.json()

      if (data.success) {
        const botMessage = {
          id: Date.now(),
          type: 'bot',
          content: data.response.message,
          timestamp: new Date()
        }

        setMessages(prev => [...prev, botMessage])

        if (data.response.type === 'registration_complete') {
          setRegistrationComplete(true)
          
          // Adicionar mensagem de sucesso
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: Date.now() + 1,
              type: 'success',
              content: '🎉 Cadastro realizado com sucesso! Bem-vindo ao evento!',
              timestamp: new Date()
            }])
          }, 1000)
        }

        setAwaitingPhoto(false)
      }
    } catch (error) {
      console.error('Erro ao processar foto:', error)
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        content: 'Erro ao processar foto. Vamos tentar novamente?',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const resetChat = () => {
    setMessages([])
    setSessionId(null)
    setRegistrationComplete(false)
    setAwaitingPhoto(false)
    setShowCamera(false)
    setCapturedImage(null)
    startConversation()
  }

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cadastro Conversacional</h1>
        <p className="text-gray-600">Converse com nosso assistente para se cadastrar no evento</p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-lg shadow-lg flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg flex items-start space-x-2 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.type === 'error'
                    ? 'bg-red-100 text-red-800'
                    : message.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.type === 'bot' && <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                {message.type === 'user' && <User className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                {message.type === 'success' && <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                
                <div className="flex-1">
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg flex items-center space-x-2">
                <Loader className="h-4 w-4 animate-spin" />
                <span className="text-sm">Digitando...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-center">Capturar Foto</h3>
              
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
                    onClick={capturePhoto}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Capturar</span>
                  </button>
                  <button
                    onClick={() => setShowCamera(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        {!registrationComplete && !awaitingPhoto && (
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !inputMessage.trim()}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>Enviar</span>
              </button>
            </div>
          </div>
        )}

        {/* Registration Complete Actions */}
        {registrationComplete && (
          <div className="border-t p-4 text-center">
            <button
              onClick={resetChat}
              className="btn-secondary"
            >
              Novo Cadastro
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">Como funciona:</h3>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Converse naturalmente com o assistente</li>
          <li>• Responda as perguntas conforme solicitado</li>
          <li>• A câmera abrirá automaticamente quando precisar da foto</li>
          <li>• O cadastro será finalizado automaticamente</li>
        </ul>
      </div>
    </div>
  )
}
