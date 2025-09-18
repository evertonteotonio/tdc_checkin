import { Link } from 'react-router-dom'
import { UserPlus, Camera, Settings, Sparkles } from 'lucide-react'

export function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Sistema de Check-in Inteligente
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Reconhecimento facial + IA para uma experiência única em eventos
        </p>
        <div className="flex items-center justify-center space-x-2 text-primary-600">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium">Powered by AWS AI Services</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <Link to="/register" className="card hover:shadow-lg transition-shadow">
          <div className="text-center">
            <UserPlus className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Cadastro</h3>
            <p className="text-gray-600 mb-4">
              Registre-se no evento com foto para reconhecimento facial
            </p>
            <span className="btn-primary inline-block">Começar Cadastro</span>
          </div>
        </Link>

        <Link to="/checkin" className="card hover:shadow-lg transition-shadow">
          <div className="text-center">
            <Camera className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Check-in</h3>
            <p className="text-gray-600 mb-4">
              Faça check-in instantâneo com reconhecimento facial
            </p>
            <span className="btn-primary inline-block">Fazer Check-in</span>
          </div>
        </Link>

        <Link to="/admin" className="card hover:shadow-lg transition-shadow">
          <div className="text-center">
            <Settings className="h-12 w-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Administração</h3>
            <p className="text-gray-600 mb-4">
              Dashboard com estatísticas e gerenciamento
            </p>
            <span className="btn-secondary inline-block">Acessar Admin</span>
          </div>
        </Link>
      </div>

      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Como funciona?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-primary-700 font-bold">1</span>
            </div>
            <h4 className="font-semibold mb-2">Cadastre-se</h4>
            <p className="text-sm text-gray-600">Envie seus dados e uma foto clara do seu rosto</p>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-primary-700 font-bold">2</span>
            </div>
            <h4 className="font-semibold mb-2">Chegue ao evento</h4>
            <p className="text-sm text-gray-600">Aproxime-se de qualquer estação de check-in</p>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-primary-700 font-bold">3</span>
            </div>
            <h4 className="font-semibold mb-2">Check-in automático</h4>
            <p className="text-sm text-gray-600">Seja reconhecido instantaneamente e receba boas-vindas personalizadas</p>
          </div>
        </div>
      </div>
    </div>
  )
}
