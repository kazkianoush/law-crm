import RequireAuth from '../components/RequireAuth'
import TaskList from '../components/TaskList'

export default function TasksPage() {
  return (
    <RequireAuth>
      <TaskList />
    </RequireAuth>
  )
}
