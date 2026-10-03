'use client'
import { API_URL, errorMessage, responseError } from '../../lib/api'
import TaskList from '../../components/TaskList'
import { useParams } from 'next/navigation'


export default function UserTasksPage() {
  const { userId } = useParams<{ userId: string }>() // gets usersId from link
  return <TaskList userId={userId} /> //creates tasks page with given userId
}