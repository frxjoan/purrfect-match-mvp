import { Link } from 'react-router-dom'

function FloatingMessageButton() {
  return (
    <Link
      aria-label="Open customer messages"
      className="fixed bottom-12 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-lg border-4 border-black bg-white text-3xl shadow-sm transition hover:bg-purple-50"
      to="/customer/messages"
    >
      ···
    </Link>
  )
}

export default FloatingMessageButton
