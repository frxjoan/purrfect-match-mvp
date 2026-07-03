import { useNavigate } from 'react-router-dom'
import MessageCenter from '../components/messages/MessageCenter.jsx'

function CustomerMessagesPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <button className="text-sm font-semibold" onClick={() => navigate(-1)} type="button">Back</button>
      <MessageCenter preferredRole="customer" subtitle="Customer messages" title="Messages" />
    </div>
  )
}

export default CustomerMessagesPage