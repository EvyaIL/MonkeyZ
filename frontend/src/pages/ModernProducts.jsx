// Modern Products Page with Advanced Filtering and UX
// frontend/src/pages/ModernProducts.jsx

import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Typography, 
  Button, 
  Card, 
  Input,
  Select,
  Checkbox,
  Badge,
  LoadingBarAdvanced,
  Alert
} from '../components/ui'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../lib/apiService'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

// Icons (using simple SVGs for now)
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
  </svg>
)

const GridIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
)

const ListIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
)

const ModernProductCard = ({ product, viewMode, index }) => {
  const navigate = useNavigate()
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.05,
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.2 }
    }
  }
  
  if (viewMode === 'list') {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        layout
        whileHover={{ scale: 1.02 }}
        className="w-full"
      >
        <Card className="p-6 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <img
                src={product.image || '/placeholder-product.jpg'}
                alt={product.name}
                className="w-24 h-24 object-cover rounded-lg"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Typography variant="h6" className="font-semibold text-gray-900 dark:text-white">
                    {product.name}
                  </Typography>
                  <Typography variant="body2" className="text-gray-600 dark:text-gray-400 line-clamp-2">
                    {product.description}
                  </Typography>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{product.category}</Badge>
                    {product.discount && (
                      <Badge variant="accent" className="bg-red-500">
                        -{product.discount}%
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="text-right space-y-2">
                  <Typography variant="h5" className="font-bold text-primary">
                    ${product.price}
                  </Typography>
                  {product.originalPrice && (
                    <Typography variant="body2" className="text-gray-500 line-through">
                      ${product.originalPrice}
                    </Typography>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      whileHover={{ y: -8 }}
      className="h-full"
    >
      <Card className="h-full overflow-hidden group bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
        <div className="relative overflow-hidden">
          <img
            src={product.image || '/placeholder-product.jpg'}
            alt={product.name}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {product.discount && (
            <Badge 
              variant="accent" 
              className="absolute top-3 right-3 bg-red-500"
            >
              -{product.discount}%
            </Badge>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <div className="p-6 space-y-4 flex flex-col h-full">
          <div className="space-y-2 flex-1">
            <Typography variant="h6" className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
              {product.name}
            </Typography>
            <Typography variant="body2" className="text-gray-600 dark:text-gray-400 line-clamp-3">
              {product.description}
            </Typography>
            <Badge variant="secondary">{product.category}</Badge>
          </div>
          
          <div className="flex items-center justify-between pt-4">
            <div className="space-y-1">
              <Typography variant="h5" className="font-bold text-primary">
                ${product.price}
              </Typography>
              {product.originalPrice && (
                <Typography variant="body2" className="text-gray-500 line-through">
                  ${product.originalPrice}
                </Typography>
              )}
            </div>
            
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/product/${product.id}`)}
              className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary transform hover:scale-105 transition-all duration-200"
            >
              View Details
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

const FilterSidebar = ({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange, 
  categories, 
  priceRange 
}) => {
  const { t } = useTranslation()
  
  const sortOptions = [
    { value: 'featured', label: t('sort_featured', 'Featured') },
    { value: 'price-asc', label: t('sort_price_low_high', 'Price: Low to High') },
    { value: 'price-desc', label: t('sort_price_high_low', 'Price: High to Low') },
    { value: 'name-asc', label: t('sort_name_a_z', 'Name: A to Z') },
    { value: 'name-desc', label: t('sort_name_z_a', 'Name: Z to A') }
  ]
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 z-50 shadow-2xl lg:relative lg:w-full lg:shadow-none overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between lg:hidden">
                <Typography variant="h6" className="font-semibold">
                  {t('filters', 'Filters')}
                </Typography>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  ✕
                </Button>
              </div>
              
              {/* Search */}
              <div className="space-y-2">
                <Typography variant="body1" className="font-medium">
                  {t('search', 'Search')}
                </Typography>
                <Input
                  placeholder={t('search_products', 'Search products...')}
                  value={filters.search}
                  onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                  icon={<SearchIcon />}
                />
              </div>
              
              {/* Sort */}
              <div className="space-y-2">
                <Typography variant="body1" className="font-medium">
                  {t('sort_by', 'Sort By')}
                </Typography>
                <Select
                  value={filters.sortBy}
                  onChange={(value) => onFiltersChange({ ...filters, sortBy: value })}
                  options={sortOptions}
                />
              </div>
              
              {/* Categories */}
              <div className="space-y-3">
                <Typography variant="body1" className="font-medium">
                  {t('categories', 'Categories')}
                </Typography>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories?.map((category) => (
                    <Checkbox
                      key={category}
                      label={category}
                      checked={filters.categories.includes(category)}
                      onChange={(checked) => {
                        const newCategories = checked
                          ? [...filters.categories, category]
                          : filters.categories.filter(c => c !== category)
                        onFiltersChange({ ...filters, categories: newCategories })
                      }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Price Range */}
              <div className="space-y-3">
                <Typography variant="body1" className="font-medium">
                  {t('price_range', 'Price Range')}
                </Typography>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange.min}
                      onChange={(e) => onFiltersChange({
                        ...filters,
                        priceRange: { ...filters.priceRange, min: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full"
                    />
                    <span className="text-gray-500">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange.max}
                      onChange={(e) => onFiltersChange({
                        ...filters,
                        priceRange: { ...filters.priceRange, max: parseInt(e.target.value) || 1000 }
                      })}
                      className="w-full"
                    />
                  </div>
                  <Typography variant="body2" className="text-gray-500">
                    ${filters.priceRange.min} - ${filters.priceRange.max}
                  </Typography>
                </div>
              </div>
              
              {/* Clear Filters */}
              <Button
                variant="secondary"
                onClick={() => onFiltersChange({
                  search: '',
                  sortBy: 'featured',
                  categories: [],
                  priceRange: { min: 0, max: 1000 }
                })}
                className="w-full"
              >
                {t('clear_filters', 'Clear All Filters')}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

const ModernProducts = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // State
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    sortBy: searchParams.get('sort') || 'featured',
    categories: searchParams.get('categories')?.split(',').filter(Boolean) || [],
    priceRange: {
      min: parseInt(searchParams.get('min_price')) || 0,
      max: parseInt(searchParams.get('max_price')) || 1000
    }
  })
  
  // Fetch products
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.sortBy) params.set('sort', filters.sortBy)
      if (filters.categories.length) params.set('categories', filters.categories.join(','))
      params.set('min_price', filters.priceRange.min.toString())
      params.set('max_price', filters.priceRange.max.toString())
      
      const { data, error } = await apiService.get(`/products?${params.toString()}`)
      if (error) throw new Error(error)
      return data
    }
  })
  
  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await apiService.get('/categories')
      if (error) throw new Error(error)
      return data
    }
  })
  
  // Update URL when filters change
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters)
    
    const params = new URLSearchParams()
    if (newFilters.search) params.set('search', newFilters.search)
    if (newFilters.sortBy !== 'featured') params.set('sort', newFilters.sortBy)
    if (newFilters.categories.length) params.set('categories', newFilters.categories.join(','))
    if (newFilters.priceRange.min > 0) params.set('min_price', newFilters.priceRange.min.toString())
    if (newFilters.priceRange.max < 1000) params.set('max_price', newFilters.priceRange.max.toString())
    
    setSearchParams(params)
  }, [setSearchParams])
  
  const filteredProductsCount = products?.length || 0
  
  return (
    <>
      <Helmet>
        <title>{t('products_title', 'Products - MonkeyZ')}</title>
        <meta name="description" content={t('products_description', 'Browse our extensive collection of premium digital products and software solutions.')} />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <Typography variant="display" className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {t('our_products', 'Our Products')}
              </Typography>
              <Typography variant="h6" className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {t('products_subtitle', 'Discover our comprehensive collection of digital products and software solutions.')}
              </Typography>
            </motion.div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="hidden lg:block">
                <Card className="p-6">
                  <Typography variant="h6" className="font-semibold mb-6">
                    {t('filters', 'Filters')}
                  </Typography>
                  <FilterSidebar
                    isOpen={true}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    categories={categories}
                  />
                </Card>
              </div>
              
              {/* Mobile filter button */}
              <div className="lg:hidden mb-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowFilters(true)}
                  icon={<FilterIcon />}
                  className="w-full"
                >
                  {t('show_filters', 'Show Filters')}
                </Button>
              </div>
            </div>
            
            {/* Main content */}
            <div className="flex-1 space-y-6">
              {/* Toolbar */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Typography variant="body1" className="text-gray-600 dark:text-gray-400">
                      {isLoading ? (
                        <LoadingBarAdvanced progress={50} size="sm" />
                      ) : (
                        t('products_count', '{{count}} products found', { count: filteredProductsCount })
                      )}
                    </Typography>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      icon={<GridIcon />}
                    />
                    <Button
                      variant={viewMode === 'list' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      icon={<ListIcon />}
                    />
                  </div>
                </div>
              </Card>
              
              {/* Products Grid/List */}
              {isLoading ? (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-xl h-64" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <Alert variant="error">
                  {error.message}
                </Alert>
              ) : products?.length === 0 ? (
                <div className="text-center py-12">
                  <Typography variant="h5" className="mb-4">
                    {t('no_products_found', 'No products found')}
                  </Typography>
                  <Typography variant="body1" className="text-gray-600 dark:text-gray-400 mb-6">
                    {t('try_different_filters', 'Try adjusting your filters or search terms.')}
                  </Typography>
                  <Button
                    variant="primary"
                    onClick={() => handleFiltersChange({
                      search: '',
                      sortBy: 'featured',
                      categories: [],
                      priceRange: { min: 0, max: 1000 }
                    })}
                  >
                    {t('clear_filters', 'Clear All Filters')}
                  </Button>
                </div>
              ) : (
                <motion.div
                  className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}
                  layout
                >
                  <AnimatePresence mode="wait">
                    {products?.map((product, index) => (
                      <ModernProductCard
                        key={product.id}
                        product={product}
                        viewMode={viewMode}
                        index={index}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile filters sidebar */}
        <FilterSidebar
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          categories={categories}
        />
      </div>
    </>
  )
}

export default ModernProducts
