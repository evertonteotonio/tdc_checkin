import { useState, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Camera, User, Mail, Building, UserCheck, RotateCcw } from 'lucide-react'
import { participantService } from '../services/api'

export function Registration() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    type: 'GUEST',
    phone: '',
    position: ''
  })
  const [capturedImage, setCapturedImage] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)
  const webcamRef = useRef(null)

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setCapturedImage(imageSrc)
      setShowCamera(false)
    }
  }, [webcamRef])

  const retakePhoto = () => {
    setCapturedImage(null)
    setShowCamera(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!capturedImage) {
        setError('Foto é obrigatória para o cadastro')
        return
      }

      // Convert base64 to blob
      const response = await fetch(capturedImage)
      const blob = await response.blob()
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' })

      const submitData = new FormData()
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key])
      })
      submitData.append('photo', file)

      const result = await participantService.register(submitData)
      setSuccess(result)
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        company: '',
        type: 'GUEST',
        phone: '',
        position: ''
      })
      setCapturedImage(null)
      
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao cadastrar participante')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cadastro de Participante</h1>
        <p className="text-gray-600">Preencha seus dados e tire uma foto para o reconhecimento facial</p>
      </div>

      {success && (
        <div className="card bg-green-50 border border-green-200 mb-6">
          <div className="flex items-center space-x-2 text-green-800">
            <UserCheck className="h-5 w-5" />
            <span className="font-medium">Cadastro realizado com sucesso!</span>
          </div>
          <p className="text-green-700 mt-2">
            Olá {success.participant.name}! Você já pode fazer check-in no evento.
          </p>
        </div>
      )}

      {error && (
        <div className="card bg-red-50 border border-red-200 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Nome Completo *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-1" />
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="h-4 w-4 inline mr-1" />
              Empresa *
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Participante
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="input-field"
            >
              <option value="GUEST">Convidado</option>
              <option value="SPEAKER">Palestrante</option>
              <option value="SPONSOR">Patrocinador</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cargo
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              className="input-field"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Camera className="h-4 w-4 inline mr-1" />
            Foto para Reconhecimento Facial *
          </label>
          
          {!showCamera && !capturedImage && (
            <div className="text-center">
              <div className="w-64 h-48 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4">
                <Camera className="h-12 w-12 text-gray-400" />
              </div>
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="btn-primary flex items-center space-x-2 mx-auto"
              >
                <Camera className="h-4 w-4" />
                <span>Tirar Foto</span>
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
                  type="button"
                  onClick={capture}
                  className="btn-primary"
                >
                  Capturar Foto
                </button>
                <button
                  type="button"
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
                  type="button"
                  onClick={retakePhoto}
                  className="btn-secondary flex items-center space-x-2 mx-auto"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Tirar Nova Foto</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setFormData({
                name: '',
                email: '',
                company: '',
                type: 'GUEST',
                phone: '',
                position: ''
              })
              setCapturedImage(null)
              setShowCamera(false)
            }}
            className="btn-secondary"
          >
            Limpar
          </button>
          
          <button
            type="submit"
            disabled={loading || !capturedImage}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </div>
  )
}
