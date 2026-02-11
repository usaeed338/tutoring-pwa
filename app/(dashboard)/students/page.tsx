'use client'

import { useEffect, useState } from 'react'
import { supabase, Student, Subject, StudentSubject } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Plus, Edit, Trash2, Search } from 'lucide-react'

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [formData, setFormData] = useState({
    student_name: '',
    parent_name: '',
    phone: '',
    email: '',
    grade: '',
    notes: '',
    selectedSubjects: [] as string[],
  })

  useEffect(() => {
    fetchStudents()
    fetchSubjects()
  }, [])

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('student_name')
    if (data) setStudents(data)
    setLoading(false)
  }

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*')
    if (data) setSubjects(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingStudent) {
      await supabase
        .from('students')
        .update({
          student_name: formData.student_name,
          parent_name: formData.parent_name,
          phone: formData.phone,
          email: formData.email,
          grade: formData.grade,
          notes: formData.notes,
        })
        .eq('id', editingStudent.id)

      // Update subjects
      await supabase.from('student_subjects').delete().eq('student_id', editingStudent.id)
      if (formData.selectedSubjects.length > 0) {
        await supabase.from('student_subjects').insert(
          formData.selectedSubjects.map(subjectId => ({
            student_id: editingStudent.id,
            subject_id: subjectId,
          }))
        )
      }
    } else {
      const { data: newStudent } = await supabase
        .from('students')
        .insert({
          student_name: formData.student_name,
          parent_name: formData.parent_name,
          phone: formData.phone,
          email: formData.email,
          grade: formData.grade,
          notes: formData.notes,
        })
        .select()
        .single()

      if (newStudent && formData.selectedSubjects.length > 0) {
        await supabase.from('student_subjects').insert(
          formData.selectedSubjects.map(subjectId => ({
            student_id: newStudent.id,
            subject_id: subjectId,
          }))
        )
      }
    }

    fetchStudents()
    closeModal()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      await supabase.from('students').delete().eq('id', id)
      fetchStudents()
    }
  }

  const openModal = async (student?: Student) => {
    if (student) {
      setEditingStudent(student)
      const { data: studentSubjects } = await supabase
        .from('student_subjects')
        .select('subject_id')
        .eq('student_id', student.id)
      
      setFormData({
        student_name: student.student_name,
        parent_name: student.parent_name || '',
        phone: student.phone || '',
        email: student.email || '',
        grade: student.grade || '',
        notes: student.notes || '',
        selectedSubjects: studentSubjects?.map(ss => ss.subject_id) || [],
      })
    } else {
      setEditingStudent(null)
      setFormData({
        student_name: '',
        parent_name: '',
        phone: '',
        email: '',
        grade: '',
        notes: '',
        selectedSubjects: [],
      })
    }
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingStudent(null)
  }

  const filteredStudents = students.filter(student =>
    student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.parent_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="spinner"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Students</h1>
        <Button onClick={() => openModal()}>
          <Plus size={20} className="mr-2" />
          Add Student
        </Button>
      </div>

      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Parent Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Grade</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="font-semibold">{student.student_name}</td>
                    <td>{student.parent_name || '-'}</td>
                    <td>{student.phone || '-'}</td>
                    <td>{student.email || '-'}</td>
                    <td>{student.grade || '-'}</td>
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(student)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
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
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
      >
        <form onSubmit={handleSubmit}>
          <Input
            label="Student Name"
            value={formData.student_name}
            onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
            required
          />
          <Input
            label="Parent Name"
            value={formData.parent_name}
            onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Grade"
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
          />
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subjects
            </label>
            <div className="space-y-2">
              {subjects.map((subject) => (
                <label key={subject.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.selectedSubjects.includes(subject.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          selectedSubjects: [...formData.selectedSubjects, subject.id],
                        })
                      } else {
                        setFormData({
                          ...formData,
                          selectedSubjects: formData.selectedSubjects.filter(id => id !== subject.id),
                        })
                      }
                    }}
                    className="mr-2"
                  />
                  <span>{subject.subject_name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows={3}
            />
          </div>

          <div className="flex space-x-3">
            <Button type="submit" className="flex-1">
              {editingStudent ? 'Update' : 'Create'}
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
