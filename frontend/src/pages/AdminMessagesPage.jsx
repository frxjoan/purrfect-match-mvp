import { usePageTitle } from '../components/Seo.jsx'
﻿import MessageCenter from '../components/messages/MessageCenter.jsx'

function AdminMessagesPage() {
  usePageTitle('Admin messages')
  return <MessageCenter adminMode preferredRole="admin" subtitle="Admin messages" title="Messages" />
}

export default AdminMessagesPage