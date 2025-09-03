// Advanced E-commerce Features Implementation

// 1. Smart Product Recommendations
const ProductRecommendations = ({ currentProduct, userId }) => {
  const { data: recommendations } = useQuery({
    queryKey: ['recommendations', currentProduct.id, userId],
    queryFn: async () => {
      // AI-powered recommendations based on:
      // - User purchase history
      // - Similar products
      // - Trending items
      // - Category preferences
      const response = await apiService.get(
        `/products/recommendations?productId=${currentProduct.id}&userId=${userId}`
      )
      return response.data
    }
  })

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold mb-6">You might also like</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {recommendations?.map(product => (
          <ProductCard 
            key={product.id} 
            product={product}
            showRecommendationReason={true}
          />
        ))}
      </div>
    </div>
  )
}

// 2. Advanced Search & Filtering
const AdvancedProductSearch = () => {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    priceRange: [0, 1000],
    inStock: true,
    rating: 0,
    tags: []
  })

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => apiService.get('/products/search', { params: filters }),
    keepPreviousData: true
  })

  return (
    <div className="flex gap-8">
      {/* Filters Sidebar */}
      <div className="w-80 bg-white p-6 rounded-lg shadow">
        <h3 className="font-bold mb-4">Filters</h3>
        
        {/* Search Input with autocomplete */}
        <SearchInput
          value={filters.search}
          onChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
          suggestions={searchSuggestions}
          placeholder="Search products..."
        />

        {/* Category Filter */}
        <CategoryFilter
          selected={filters.category}
          onChange={(category) => setFilters(prev => ({ ...prev, category }))}
        />

        {/* Price Range Slider */}
        <PriceRangeSlider
          value={filters.priceRange}
          onChange={(range) => setFilters(prev => ({ ...prev, priceRange: range }))}
          min={0}
          max={1000}
        />

        {/* Stock Filter */}
        <Toggle
          label="In Stock Only"
          checked={filters.inStock}
          onChange={(checked) => setFilters(prev => ({ ...prev, inStock: checked }))}
        />
      </div>

      {/* Products Grid */}
      <div className="flex-1">
        {isLoading ? (
          <ProductGridSkeleton />
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </div>
  )
}

// 3. Customer Reviews System
const ProductReviews = ({ productId }) => {
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' })
  
  const { data: reviews } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => apiService.get(`/products/${productId}/reviews`)
  })

  const submitReview = useMutation({
    mutationFn: (review) => apiService.post(`/products/${productId}/reviews`, review),
    onSuccess: () => {
      queryClient.invalidateQueries(['reviews', productId])
      setNewReview({ rating: 5, comment: '' })
    }
  })

  return (
    <div className="mt-12">
      <h3 className="text-2xl font-bold mb-6">Customer Reviews</h3>
      
      {/* Review Form */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h4 className="font-semibold mb-4">Write a Review</h4>
        <StarRating
          value={newReview.rating}
          onChange={(rating) => setNewReview(prev => ({ ...prev, rating }))}
        />
        <textarea
          value={newReview.comment}
          onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
          placeholder="Share your experience..."
          className="w-full mt-4 p-3 border rounded-lg"
          rows="4"
        />
        <button
          onClick={() => submitReview.mutate(newReview)}
          disabled={submitReview.isLoading}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          Submit Review
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews?.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
}

// 4. Real-time Order Tracking
const OrderTracking = ({ orderId }) => {
  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => apiService.get(`/orders/${orderId}`),
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  const trackingSteps = [
    { id: 'pending', label: 'Order Placed', icon: '📝' },
    { id: 'processing', label: 'Processing', icon: '⚙️' },
    { id: 'partial', label: 'Partial Delivery', icon: '📦' },
    { id: 'completed', label: 'Completed', icon: '✅' }
  ]

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-bold mb-6">Order Status</h3>
      
      <div className="flex items-center justify-between mb-8">
        {trackingSteps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
              isStepCompleted(order.status, step.id) 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-400'
            }`}>
              {step.icon}
            </div>
            <span className="text-sm mt-2 text-center">{step.label}</span>
            {index < trackingSteps.length - 1 && (
              <div className={`h-1 w-24 mt-4 ${
                isStepCompleted(order.status, step.id) ? 'bg-green-400' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Order Details */}
      <div className="border-t pt-6">
        <h4 className="font-semibold mb-4">Order Details</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>Order ID: {order.id}</div>
          <div>Date: {new Date(order.createdAt).toLocaleDateString()}</div>
          <div>Total: ${order.total}</div>
          <div>Status: {order.status}</div>
        </div>
      </div>
    </div>
  )
}
