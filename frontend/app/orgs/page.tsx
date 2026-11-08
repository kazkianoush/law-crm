import OrgPicker from '../components/OrgPicker'
import RequireAuth from '../components/RequireAuth'

// Where you land after logging in: welcome + choose an organization.
export default function OrgsPage() {
  return (
    <RequireAuth>
      <OrgPicker />
    </RequireAuth>
  )
}
