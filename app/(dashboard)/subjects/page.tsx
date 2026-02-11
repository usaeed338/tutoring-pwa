'use client'

import { useEffect, useState } from 'react'
import { supabase, Subject } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  
  const [formData, setFormData] = useState({
    subject_name: '',
    default_fee: '',
  })

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .order('subject_name')
    if (data) setSubjects(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingSubject) {
      await supabase
        .from('subjects')
        .update({
          subject_name: formData.subject_name,
          default_fee: parseFloat(formData.default_fee),
        })
        .eq('id', editingSubject.id)
    } else {
      await supabase.from('subjects').insert({
        subject_name: formData.subject_name,
        default_fee: parseFloat(formData.default_fee),
      })
    }

    fetchSubjects()
    closeModal()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure? This will remove the subject from all students.')) {
      await supabase.from('subjects').delete().eq('id', id)
      fetchSubjects()
    }
  }

  const openModal = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject)
      setFormData({
        subject_name: subject.subject_name,
        default_fee: subject.default_fee.toString(),
      })
    } else {
      setEditingSubject(null)
      setFormData({ subject_name: '', default_fee: '' })
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingSubject(null)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="spinner"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Subjects</h1>
        <Button onClick={() => openModal()}>
          <Plus size={20} className="mr-2" />
          Add Subject
        </Button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Default Fee</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 py-8">
                    No subjects found
                  </td>
                </tr>
              ) : (
                subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className="font-semibold">{subject.subject_name}</td>
                    <td>{formatCurrency(subject.default_fee)}</td>
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(subject)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(subject.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Subject Name"
            value={formData.subject_name}
            onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
            required
          />
          <Input
            label="Default Fee (AUD)"
            type="number"
            step="0.01"
            value={formData.default_fee}
            onChange={(e) => setFormData({ ...formData, default_fee: e.target.value })}
            required
          />

          <div className="flex space-x-3">
            <Button type="submit" className="flex-1">
              {editingSubject ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
