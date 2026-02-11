'use client'

import { useEffect, useState } from 'react'
import { supabase, Student } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { Plus, Download, FileText, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate, generateInvoiceNumber } from '@/lib/utils'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  const [formData, setFormData] = useState({
    student_id: '',
    start_date: '',
    end_date: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: invoicesData } = await supabase
      .from('invoices')
      .select(`
        *,
        students(student_name)
      `)
      .order('created_at', { ascending: false })

    const { data: studentsData } = await supabase
      .from('students')
      .select('*')
      .order('student_name')

    if (invoicesData) setInvoices(invoicesData)
    if (studentsData) setStudents(studentsData)
    setLoading(false)
  }

  const calculateInvoice = async (studentId: string, startDate: string, endDate: string) => {
    // Get student's subjects and fees
    const { data: studentSubjects } = await supabase
      .from('student_subjects')
      .select(`
        *,
        subjects(default_fee)
      `)
      .eq('student_id', studentId)

    // Get attendance for the period
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'Present')
      .gte('date', startDate)
      .lte('date', endDate)

    // Calculate total based on attendance
    let totalAmount = 0
    attendance?.forEach((record) => {
      const studentSubject = studentSubjects?.find(ss => ss.subject_id === record.subject_id)
      const fee = studentSubject?.custom_fee || studentSubject?.subjects?.default_fee || 0
      totalAmount += fee
    })

    // Get payments made in this period
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('student_id', studentId)
      .gte('date', startDate)
      .lte('date', endDate)

    const paidAmount = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
    const balance = totalAmount - paidAmount

    return {
      totalAmount,
      paidAmount,
      balance,
      sessionCount: attendance?.length || 0,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)

    const invoiceCalc = await calculateInvoice(
      formData.student_id,
      formData.start_date,
      formData.end_date
    )

    const invoiceNumber = generateInvoiceNumber()

    await supabase.from('invoices').insert({
      invoice_number: invoiceNumber,
      student_id: formData.student_id,
      start_date: formData.start_date,
      end_date: formData.end_date,
      total_amount: invoiceCalc.totalAmount,
      paid_amount: invoiceCalc.paidAmount,
      balance: invoiceCalc.balance,
      status: invoiceCalc.balance > 0 ? 'Unpaid' : 'Paid',
    })

    fetchData()
    setGenerating(false)
    closeModal()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      await supabase.from('invoices').delete().eq('id', id)
      fetchData()
    }
  }

  const downloadPDF = async (invoice: any) => {
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice }),
      })
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice.invoice_number}.pdf`
      a.click()
    } catch (error) {
      alert('Error generating PDF')
    }
  }

  const downloadDOCX = async (invoice: any) => {
    try {
      const response = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice }),
      })
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice.invoice_number}.docx`
      a.click()
    } catch (error) {
      alert('Error generating DOCX')
    }
  }

  const openModal = () => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    setFormData({
      student_id: '',
      start_date: firstDay.toISOString().split('T')[0],
      end_date: lastDay.toISOString().split('T')[0],
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="spinner"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <Button onClick={openModal}>
          <Plus size={20} className="mr-2" />
          Generate Invoice
        </Button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Student</th>
                <th>Period</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-gray-500 py-8">
                    No invoices found
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="font-mono text-sm">{invoice.invoice_number}</td>
                    <td className="font-semibold">{invoice.students?.student_name}</td>
                    <td className="text-sm">
                      {formatDate(invoice.start_date)} - {formatDate(invoice.end_date)}
                    </td>
                    <td>{formatCurrency(invoice.total_amount)}</td>
                    <td className="text-green-600">{formatCurrency(invoice.paid_amount)}</td>
                    <td className={invoice.balance > 0 ? 'text-red-600 font-semibold' : ''}>
                      {formatCurrency(invoice.balance)}
                    </td>
                    <td>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        invoice.status === 'Paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => downloadPDF(invoice)}
                          className="text-primary-600 hover:text-primary-800"
                          title="Download PDF"
                        >
                          <FileText size={18} />
                        </button>
                        <button
                          onClick={() => downloadDOCX(invoice)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Download Word"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id)}
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

      <Modal isOpen={modalOpen} onClose={closeModal} title="Generate Invoice">
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
            label="Start Date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />

          <Input
            label="End Date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            required
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              Invoice will be generated based on attendance records and payments within the selected period.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button type="submit" className="flex-1" disabled={generating}>
              {generating ? 'Generating...' : 'Generate Invoice'}
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
