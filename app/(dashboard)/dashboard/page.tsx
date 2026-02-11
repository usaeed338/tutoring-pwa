'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { Users, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    monthRevenue: 0,
    outstandingBalance: 0,
    recentPayments: [] as any[],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Get total students
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })

      // Get this month's revenue
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0]
      
      const { data: monthPayments } = await supabase
        .from('payments')
        .select('amount')
        .gte('date', startOfMonth)

      const monthRevenue = monthPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

      // Get outstanding balance
      const { data: invoices } = await supabase
        .from('invoices')
        .select('balance')

      const outstandingBalance = invoices?.reduce((sum, i) => sum + Number(i.balance), 0) || 0

      // Get recent payments
      const { data: recentPayments } = await supabase
        .from('payments')
        .select(`
          *,
          students (student_name)
        `)
        .order('date', { ascending: false })
        .limit(5)

      setStats({
        totalStudents: studentCount || 0,
        monthRevenue,
        outstandingBalance,
        recentPayments: recentPayments || [],
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="spinner"></div></div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">This Month Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Outstanding Balance</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.outstandingBalance)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Recent Payments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recentPayments.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Recent Payments</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Amount</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-8">
                    No recent payments
                  </td>
                </tr>
              ) : (
                stats.recentPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{new Date(payment.date).toLocaleDateString()}</td>
                    <td>{payment.students?.student_name || 'N/A'}</td>
                    <td className="font-semibold">{formatCurrency(payment.amount)}</td>
                    <td>{payment.payment_method || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
