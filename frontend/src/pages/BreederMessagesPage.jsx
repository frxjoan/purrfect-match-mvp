import MessageCenter from '../components/messages/MessageCenter.jsx'
import { usePageTitle } from '../components/Seo.jsx'

function BreederMessagesPage() {
  usePageTitle('Breeder messages')
  return <MessageCenter preferredRole="breeder" subtitle="Breeder messages" title="Messages" />
}

export default BreederMessagesPage