'use client'

import { useEffect, useState } from 'react'
import { supabase, Student, Payment } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Plus, Trash2, Filter } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [filterStudent, setFilterStudent] = useState('')
  
  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
    payment_method: 'Cash',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: paymentsData } = await supabase
      .from('payments')
      .select(`
        *,
        students(student_name)
      `)
      .order('date', { ascending: false })

    const { data: studentsData } = await supabase
      .from('students')
      .select('*')
      .order('student_name')

    if (paymentsData) setPayments(paymentsData)
    if (studentsData) setStudents(studentsData)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    await supabase.from('payments').insert({
      student_id: formData.student_id,
      amount: parseFloat(formData.amount),
      payment_method: formData.payment_method,
      date: formData.date,
      notes: formData.notes,
    })

    fetchData()
    closeModal()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this payment?')) {
      await supabase.from('payments').delete().eq('id', id)
      fetchData()
    }
  }

  const openModal = () => {
    setFormData({
      student_id: '',
      amount: '',
      payment_method: 'Cash',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
  }

  const filteredPayments = filterStudent
    ? payments.filter(p => p.student_id === filterStudent)
    : payments

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="spinner"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <Button onClick={openModal}>
          <Plus size={20} className="mr-2" />
          Record Payment
        </Button>
      </div>

      <div className="card">
        <div className="flex items-center space-x-2">
          <Filter size={20} className="text-gray-500" />
          <select
            value={filterStudent}
            onChange={(e) => setFilterStudent(e.target.value)}
            className="input"
          >
            <option value="">All Students</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.student_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatDate(payment.date)}</td>
                    <td className="font-semibold">{payment.students?.student_name}</td>
                    <td className="text-green-600 font-semibold">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td>{payment.payment_method || '-'}</td>
                    <td>{payment.notes || '-'}</td>
                    <td>
                      <button
                        onClick={() => handleDelete(payment.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title="Record Payment">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student
            </label>
            <select
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              className="input"
              required
            >
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.student_name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Amount (AUD)"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="input"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Credit Card">Credit Card</option>
              <option value="PayPal">PayPal</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

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
              Record Payment
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
