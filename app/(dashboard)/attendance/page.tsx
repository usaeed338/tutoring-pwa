'use client'

import { useEffect, useState } from 'react'
import { supabase, Student, Subject } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { Calendar, Check, X } from 'lucide-react'

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchAttendance()
    }
  }, [selectedDate])

  const fetchData = async () => {
    const { data: studentsData } = await supabase
      .from('students')
      .select('*')
      .order('student_name')
    
    const { data: subjectsData } = await supabase
      .from('subjects')
      .select('*')
      .order('subject_name')

    if (studentsData) setStudents(studentsData)
    if (subjectsData) setSubjects(subjectsData)
    setLoading(false)
  }

  const fetchAttendance = async () => {
    const { data } = await supabase
      .from('attendance')
      .select(`
        *,
        students(student_name),
        subjects(subject_name)
      `)
      .eq('date', selectedDate)

    if (data) setAttendance(data)
  }

  const markAttendance = async (status: 'Present' | 'Absent') => {
    if (!selectedStudent || !selectedSubject) {
      alert('Please select both student and subject')
      return
    }

    const { error } = await supabase
      .from('attendance')
      .upsert({
        student_id: selectedStudent,
        subject_id: selectedSubject,
        date: selectedDate,
        status,
      }, {
        onConflict: 'student_id,subject_id,date'
      })

    if (!error) {
      fetchAttendance()
      setSelectedStudent('')
      setSelectedSubject('')
    }
  }

  const deleteAttendance = async (id: string) => {
    await supabase.from('attendance').delete().eq('id', id)
    fetchAttendance()
  }

  if (loading) {
    return <div className="flex justify-center items-center h-full"><div className="spinner"></div></div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Attendance Tracking</h1>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Mark Attendance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="input"
            >
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.student_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input"
            >
              <option value="">Select Subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.subject_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end space-x-2">
            <Button
              onClick={() => markAttendance('Present')}
              className="flex-1"
            >
              <Check size={18} className="mr-1" />
              Present
            </Button>
            <Button
              onClick={() => markAttendance('Absent')}
              variant="danger"
              className="flex-1"
            >
              <X size={18} className="mr-1" />
              Absent
            </Button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">
          Attendance for {new Date(selectedDate).toLocaleDateString('en-AU', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-8">
                    No attendance records for this date
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record.id}>
                    <td>{record.students?.student_name}</td>
                    <td>{record.subjects?.subject_name}</td>
                    <td>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        record.status === 'Present' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => deleteAttendance(record.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={18} />
                      </button>
                    </td>
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
