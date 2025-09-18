import { useState, useEffect } from 'react'
import { Users, UserCheck, BarChart3, Clock, Eye, RefreshCw } from 'lucide-react'
import { adminService } from '../services/api'

export function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [participants, setParticipants] = useState([])
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedParticipant, setSelectedParticipant] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsData, participantsData, checkinsData] = await Promise.all([
        adminService.getStats(),
        adminService.getParticipants(),
        adminService.getCheckins(100)
      ])
      
      setStats(statsData)
      setParticipants(participantsData.participants)
      setCheckins(checkinsData.checkins)
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewParticipantDetails = async (participantId) => {
    try {
      const details = await adminService.getParticipantDetails(participantId)
      setSelectedParticipant(details)
    } catch (error) {
      console.error('Error loading participant details:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600">Gerencie participantes e monitore check-ins</p>
        </div>
        <button
          onClick={loadData}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Participantes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalParticipants}</p>
              </div>
              <Users className="h-8 w-8 text-primary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Check-ins Realizados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCheckins}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Check-in</p>
                <p className="text-2xl font-bold text-gray-900">{stats.checkinRate}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reconhecimento Facial</p>
                <p className="text-2xl font-bold text-gray-900">{stats.checkinsByMethod.facial}</p>
                <p className="text-xs text-gray-500">Manual: {stats.checkinsByMethod.manual}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'participants'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Participantes
          </button>
          <button
            onClick={() => setActiveTab('checkins')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'checkins'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Check-ins Recentes
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Participantes por Tipo</h3>
            <div className="space-y-3">
              {['ADMIN', 'SPEAKER', 'SPONSOR', 'GUEST'].map(type => {
                const count = participants.filter(p => p.type === type).length
                const percentage = participants.length > 0 ? (count / participants.length * 100).toFixed(1) : 0
                return (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">{type}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900 w-12 text-right">{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Check-ins Recentes</h3>
            <div className="space-y-3">
              {checkins.slice(0, 5).map(checkin => (
                <div key={checkin.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{checkin.participant?.name}</p>
                    <p className="text-sm text-gray-500">{checkin.participant?.company}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      {new Date(checkin.timestamp).toLocaleTimeString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {checkin.method === 'FACIAL_RECOGNITION' ? 'Facial' : 'Manual'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'participants' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cadastro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants.map(participant => (
                  <tr key={participant.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                        <div className="text-sm text-gray-500">{participant.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {participant.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        participant.type === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        participant.type === 'SPEAKER' ? 'bg-blue-100 text-blue-800' :
                        participant.type === 'SPONSOR' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {participant.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(participant.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => viewParticipantDetails(participant.id)}
                        className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Ver</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'checkins' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {checkins.map(checkin => (
                  <tr key={checkin.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {checkin.participant?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {checkin.participant?.company || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(checkin.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        checkin.method === 'FACIAL_RECOGNITION' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {checkin.method === 'FACIAL_RECOGNITION' ? 'Facial' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        checkin.status === 'SUCCESS' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {checkin.status === 'SUCCESS' ? 'Sucesso' : 'Duplicado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Participant Details Modal */}
      {selectedParticipant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Detalhes do Participante</h3>
                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Informações Pessoais</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Nome:</strong> {selectedParticipant.participant.name}</p>
                    <p><strong>Email:</strong> {selectedParticipant.participant.email}</p>
                    <p><strong>Empresa:</strong> {selectedParticipant.participant.company}</p>
                    <p><strong>Tipo:</strong> {selectedParticipant.participant.type}</p>
                    {selectedParticipant.participant.phone && (
                      <p><strong>Telefone:</strong> {selectedParticipant.participant.phone}</p>
                    )}
                    {selectedParticipant.participant.position && (
                      <p><strong>Cargo:</strong> {selectedParticipant.participant.position}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Histórico de Check-ins</h4>
                  <div className="space-y-2">
                    {selectedParticipant.checkins.length > 0 ? (
                      selectedParticipant.checkins.map(checkin => (
                        <div key={checkin.id} className="text-sm bg-gray-50 p-2 rounded">
                          <p><strong>Data:</strong> {new Date(checkin.timestamp).toLocaleString('pt-BR')}</p>
                          <p><strong>Método:</strong> {checkin.method === 'FACIAL_RECOGNITION' ? 'Facial' : 'Manual'}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Nenhum check-in realizado</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
