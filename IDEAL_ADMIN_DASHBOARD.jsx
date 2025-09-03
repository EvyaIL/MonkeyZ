// Modern Admin Dashboard Implementation

// 1. Real-time Analytics Dashboard
const AdvancedAnalyticsDashboard = () => {
  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => apiService.get('/admin/analytics/realtime'),
    refetchInterval: 5000 // Real-time updates
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Key Metrics Cards */}
      <MetricCard
        title="Revenue Today"
        value={`$${analytics?.todayRevenue?.toLocaleString()}`}
        change={analytics?.revenueChange}
        icon="💰"
        trend={analytics?.revenueTrend}
      />
      
      <MetricCard
        title="Orders Today"
        value={analytics?.todayOrders}
        change={analytics?.ordersChange}
        icon="📦"
      />
      
      <MetricCard
        title="Active Users"
        value={analytics?.activeUsers}
        change={analytics?.usersChange}
        icon="👥"
        realTime={true}
      />
      
      <MetricCard
        title="Conversion Rate"
        value={`${analytics?.conversionRate}%`}
        change={analytics?.conversionChange}
        icon="📈"
      />

      {/* Advanced Charts */}
      <div className="col-span-full grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Sales Trends</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveLineChart
              data={analytics?.salesTrend}
              xAxis="date"
              yAxis="revenue"
              height={300}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Top Products</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveBarChart
              data={analytics?.topProducts}
              xAxis="name"
              yAxis="sales"
              height={300}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 2. Drag-and-Drop Product Management
const DragDropProductManager = () => {
  const [products, setProducts] = useState([])
  const [categories] = useState(['Featured', 'New', 'Sale', 'Regular'])

  const handleDragEnd = (result) => {
    if (!result.destination) return

    const { source, destination } = result
    
    // Move product between categories
    if (source.droppableId !== destination.droppableId) {
      updateProductCategory.mutate({
        productId: result.draggableId,
        newCategory: destination.droppableId,
        newIndex: destination.index
      })
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {categories.map(category => (
          <div key={category} className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-4">{category}</h3>
            <Droppable droppableId={category}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="min-h-32"
                >
                  {products
                    .filter(p => p.category === category)
                    .map((product, index) => (
                      <Draggable
                        key={product.id}
                        draggableId={product.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white p-3 mb-2 rounded shadow border"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-10 h-10 rounded"
                              />
                              <div>
                                <div className="font-medium text-sm">
                                  {product.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ${product.price}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}

// 3. Bulk Operations Interface
const BulkOperationsToolbar = ({ selectedItems, onAction }) => {
  const bulkActions = [
    { id: 'activate', label: 'Activate', icon: '✅' },
    { id: 'deactivate', label: 'Deactivate', icon: '❌' },
    { id: 'delete', label: 'Delete', icon: '🗑️', danger: true },
    { id: 'export', label: 'Export', icon: '📤' },
    { id: 'duplicate', label: 'Duplicate', icon: '📋' }
  ]

  return (
    <AnimatePresence>
      {selectedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg p-4 border z-50"
        >
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {selectedItems.length} items selected
            </span>
            
            <div className="flex gap-2">
              {bulkActions.map(action => (
                <button
                  key={action.id}
                  onClick={() => onAction(action.id, selectedItems)}
                  className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${
                    action.danger 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  <span>{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => onAction('clear')}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 4. Advanced Reporting
const AdvancedReporting = () => {
  const [reportConfig, setReportConfig] = useState({
    type: 'sales',
    dateRange: 'last30days',
    groupBy: 'day',
    filters: {}
  })

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['report', reportConfig],
    queryFn: () => apiService.get('/admin/reports/generate', { 
      params: reportConfig 
    })
  })

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Report Configuration</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Report Type"
              value={reportConfig.type}
              onChange={(value) => setReportConfig(prev => ({ ...prev, type: value }))}
              options={[
                { value: 'sales', label: 'Sales Report' },
                { value: 'products', label: 'Product Performance' },
                { value: 'customers', label: 'Customer Analytics' },
                { value: 'inventory', label: 'Inventory Report' }
              ]}
            />
            
            <Select
              label="Date Range"
              value={reportConfig.dateRange}
              onChange={(value) => setReportConfig(prev => ({ ...prev, dateRange: value }))}
              options={[
                { value: 'today', label: 'Today' },
                { value: 'last7days', label: 'Last 7 Days' },
                { value: 'last30days', label: 'Last 30 Days' },
                { value: 'custom', label: 'Custom Range' }
              ]}
            />
            
            <Select
              label="Group By"
              value={reportConfig.groupBy}
              onChange={(value) => setReportConfig(prev => ({ ...prev, groupBy: value }))}
              options={[
                { value: 'hour', label: 'Hour' },
                { value: 'day', label: 'Day' },
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' }
              ]}
            />
            
            <button
              onClick={() => generateReport.mutate(reportConfig)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Generate Report
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {isLoading ? (
        <ReportSkeleton />
      ) : reportData ? (
        <ReportVisualization data={reportData} config={reportConfig} />
      ) : null}
    </div>
  )
}
