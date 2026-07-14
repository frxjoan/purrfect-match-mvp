import MessageCenter from '../components/messages/MessageCenter.jsx'

function AdminMessagesPage() {
  return <MessageCenter adminMode preferredRole="admin" subtitle="Admin messages" title="Messages" />
}

export default AdminMessagesPage