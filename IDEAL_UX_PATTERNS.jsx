// Modern UX Patterns Implementation
// frontend/src/components/modern-ux/

// 1. Optimistic UI Updates
const useOptimisticUpdate = (mutationFn, queryKey) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn,
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })
      
      // Snapshot previous value  
      const previousData = queryClient.getQueryData(queryKey)
      
      // Optimistically update
      queryClient.setQueryData(queryKey, old => ({
        ...old,
        ...newData
      }))
      
      return { previousData }
    },
    onError: (err, newData, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKey, context.previousData)
    },
    onSettled: () => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey })
    }
  })
}

// 2. Skeleton Loading States
const ProductCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 h-48 w-full rounded-lg mb-4"></div>
    <div className="space-y-2">
      <div className="bg-gray-200 h-4 w-3/4 rounded"></div>
      <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
    </div>
  </div>
)

// 3. Real-time Notifications
const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([])
  
  const addNotification = (notification) => {
    const id = Date.now()
    setNotifications(prev => [...prev, { ...notification, id }])
    
    // Auto-remove after delay
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, notification.duration || 5000)
  }
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="bg-white shadow-lg rounded-lg p-4 border-l-4 border-blue-500"
          >
            {notification.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// 4. Smooth Page Transitions
const PageTransition = ({ children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className={className}
  >
    {children}
  </motion.div>
)

// 5. Smart Error Boundaries
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              We're sorry, but something unexpected happened.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }
    
    return this.props.children
  }
}
