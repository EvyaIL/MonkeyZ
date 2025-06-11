import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../lib/apiService'; // For fetching users if needed

const OrderForm = ({ order: initialOrder, onSubmit, onCancel, allProducts = [], loading, error }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    user_id: '', // Optional: ID of an existing user
    selectedUserName: '', // Added to store the name of the linked user for display
    status: 'Pending',
    items: [],
    total: 0,
    notes: '',
  });

  const [users, setUsers] = useState([]); // For user selection dropdown
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // State for adding a new item
  const [currentItem, setCurrentItem] = useState({
    productId: '',
    name: '', // Will be auto-filled or manually entered if product not found
    quantity: 1,
    price: 0,
  });

  const calculateTotal = useCallback((items) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  }, []);

  useEffect(() => {
    const initForm = async () => {
      if (initialOrder) {
        let userNameToDisplay = '';
        if (initialOrder.user_id) {
          // Attempt to find user in the local list first
          const existingUser = users.find(u => u.id === initialOrder.user_id || u._id === initialOrder.user_id);
          if (existingUser) {
            userNameToDisplay = `${existingUser.username} (${existingUser.email})`;
          } else if (initialOrder.selectedUserName) {
            // Fallback to a pre-populated selectedUserName if available (e.g. from parent)
            userNameToDisplay = initialOrder.selectedUserName;
          } else {
            // Optionally, you could add a fetch here if users list might not be populated yet
            // For now, we'll just use the ID as a fallback if no name is found
            userNameToDisplay = initialOrder.user_id;
          }
        }
        setFormData({
          customerName: initialOrder.customerName || '',
          email: initialOrder.email || '',
          phone: initialOrder.phone || '',
          user_id: initialOrder.user_id || '',
          selectedUserName: userNameToDisplay,
          status: initialOrder.status || 'Pending',
          items: initialOrder.items || [],
          total: initialOrder.total || calculateTotal(initialOrder.items || []),
          notes: initialOrder.notes || '',
          id: initialOrder.id || initialOrder._id || null
        });
      } else {
        // Reset for new order
        setFormData({
          customerName: '', email: '', phone: '', user_id: '', selectedUserName: '', status: 'Pending', items: [], total: 0, notes: ''
        });
      }
    };
    initForm();
  }, [initialOrder, calculateTotal, users]); // Added users to dependency array

  // Helper function to fetch user name if editing an order with a user_id
  const fetchUserName = async (userId) => {
    // This function assumes you might need to fetch user details if only ID is present
    // For now, if users array is populated, we try to find it there.
    // This might need adjustment based on how `initialOrder` is populated.
    const existingUser = users.find(u => u.id === userId || u._id === userId);
    if (existingUser) {
      return `${existingUser.username} (${existingUser.email})`;
    }
    // Optionally, fetch from API if not in local list:
    // try {
    //   const response = await apiService.get(`/admin/users/${userId}`);
    //   if (response.data) {
    //     return `${response.data.username} (${response.data.email})`;
    //   }
    // } catch (err) {
    //   console.error("Failed to fetch user name:", err);
    // }
    return userId; // Fallback to ID if name not found
  };

  useEffect(() => {
    // Fetch users for the dropdown (optional feature)
    const fetchUsers = async () => {
      try {
        const response = await apiService.get('/admin/users'); // Assuming an endpoint to get users
        if (response.data) {
          setUsers(response.data);
          setFilteredUsers(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
        // Handle error (e.g., notify admin)
      }
    };
    // fetchUsers(); // Uncomment if you have the /admin/users endpoint
  }, []);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(
        users.filter(user =>
          (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }
  }, [searchTerm, users]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserSelect = (userId) => {
    const selectedUser = users.find(u => u.id === userId || u._id === userId);
    if (selectedUser) {
      setFormData(prev => ({
        ...prev,
        user_id: selectedUser.id || selectedUser._id,
        selectedUserName: `${selectedUser.username} (${selectedUser.email})`, // Store name for display
        // Optionally pre-fill customerName and email if they are empty
        customerName: prev.customerName || selectedUser.username || '',
        email: prev.email || selectedUser.email || '',
      }));
      setSearchTerm(''); // Clear search
      setFilteredUsers(users); // Reset filtered users to show all or none depending on your preference
    }
  };

  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'quantity' || name === 'price') {
      processedValue = parseFloat(value) || 0;
    }
    setCurrentItem(prev => ({ ...prev, [name]: processedValue }));

    if (name === 'productId') {
      const selectedProduct = allProducts.find(p => p.id === value || p._id === value);
      if (selectedProduct) {
        setCurrentItem(prev => ({
          ...prev,
          name: selectedProduct.name?.en || selectedProduct.name?.he || selectedProduct.name, // Adjust based on product name structure
          price: selectedProduct.price,
        }));
      } else {
         setCurrentItem(prev => ({ ...prev, name: '' })); // Clear name if product not found
      }
    }
  };

  const handleAddItem = () => {
    if (!currentItem.productId || currentItem.quantity <= 0 || currentItem.price < 0) {
      alert(t('admin.orderForm.invalidItem')); // Replace with a proper notification
      return;
    }
    const newItem = { ...currentItem, name: currentItem.name || `Product ID: ${currentItem.productId}` };
    const updatedItems = [...formData.items, newItem];
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      total: calculateTotal(updatedItems),
    }));
    setCurrentItem({ productId: '', name: '', quantity: 1, price: 0 }); // Reset for next item
  };

  const handleRemoveItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      total: calculateTotal(updatedItems),
    }));
  };
  
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert(t('admin.orderForm.atLeastOneItem')); // Replace with a proper notification
      return;
    }
    // Ensure user_id is null if empty string, or backend handles it
    const dataToSubmit = { ...formData, user_id: formData.user_id || null };
    onSubmit(dataToSubmit);
  };

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div className="my-6 p-6 bg-white dark:bg-gray-800 shadow-xl rounded-lg">
      <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
        {initialOrder ? t('admin.orderForm.editOrder') : t('admin.orderForm.createNewOrder')}
      </h3>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="customerName" className={labelClass}>{t('admin.orderForm.customerName')}</label>
            <input type="text" name="customerName" id="customerName" value={formData.customerName} onChange={handleInputChange} className={inputClass} required />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>{t('admin.orderForm.email')}</label>
            <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} className={inputClass} required />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>{t('admin.orderForm.phone')}</label>
            <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="status" className={labelClass}>{t('admin.orderForm.status')}</label>
            <select name="status" id="status" value={formData.status} onChange={handleInputChange} className={inputClass}>
              <option value="Pending">{t('admin.statusPending')}</option>
              <option value="Processing">{t('admin.statusProcessing')}</option>
              <option value="Shipped">{t('admin.statusShipped')}</option>
              <option value="Completed">{t('admin.statusCompleted')}</option>
              <option value="Cancelled">{t('admin.statusCancelled')}</option>
            </select>
          </div>
        </div>

        {/* User Linking (Optional) */}
        {/* This is a basic example. You might want a more sophisticated user search/select component */}
        <div>
          <label htmlFor="user_search" className={labelClass}>{t('admin.orderForm.linkToUserOptional')}</label>
          <input
            type="text"
            id="user_search"
            placeholder={t('admin.orderForm.searchUserPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputClass} mb-1`}
            aria-describedby="user-search-description"
            aria-autocomplete="list"
            aria-controls="user-suggestions-list"
          />
          <p id="user-search-description" className="sr-only">{t('admin.orderForm.searchUserDescription')}</p>
          
          {searchTerm && filteredUsers.length > 0 && (
            <ul id="user-suggestions-list" className="border border-gray-300 dark:border-gray-600 rounded-md max-h-40 overflow-y-auto bg-white dark:bg-gray-700 shadow-lg z-10" role="listbox" aria-label={t('admin.orderForm.suggestedUsers')}>
              {filteredUsers.map(user => (
                <li 
                  key={user.id || user._id} 
                  onClick={() => handleUserSelect(user.id || user._id)}
                  className="p-3 hover:bg-indigo-100 dark:hover:bg-indigo-700 cursor-pointer text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:bg-indigo-100 dark:focus:bg-indigo-700"
                  role="option"
                  tabIndex={0} // Make it focusable
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleUserSelect(user.id || user._id); }}
                  aria-selected={formData.user_id === (user.id || user._id)}
                >
                  <span className="font-medium">{user.username}</span> - <span className="text-gray-500 dark:text-gray-400">{user.email}</span>
                </li>
              ))}
            </ul>
          )}
          {formData.user_id && formData.selectedUserName && (
            <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-md">
              <p className="text-sm text-green-700 dark:text-green-200">
                <span className="font-semibold">{t('admin.orderForm.linkedToUserLabel')}</span> {formData.selectedUserName}
              </p>
            </div>
          )}
        </div>

        {/* Order Items Section */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-xl font-medium mb-4 text-gray-900 dark:text-white">{t('admin.orderForm.orderItems')}</h4>
          {/* Current item input */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border dark:border-gray-600 rounded-md">
            <div>
              <label htmlFor="productId" className={labelClass}>{t('admin.orderForm.product')}</label>
              <select name="productId" id="productId" value={currentItem.productId} onChange={handleItemInputChange} className={inputClass}>
                <option value="">{t('admin.orderForm.selectProduct')}</option>
                {allProducts.map(p => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.name?.en || p.name?.he || p.name} (ID: {p.id || p._id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="quantity" className={labelClass}>{t('admin.orderForm.quantity')}</label>
              <input type="number" name="quantity" id="quantity" value={currentItem.quantity} onChange={handleItemInputChange} min="1" className={inputClass} />
            </div>
            <div>
              <label htmlFor="price" className={labelClass}>{t('admin.orderForm.pricePerItem')}</label>
              <input type="number" name="price" id="price" value={currentItem.price} onChange={handleItemInputChange} min="0" step="0.01" className={inputClass} />
            </div>
            <div className="self-end">
              <button type="button" onClick={handleAddItem} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md shadow-sm">
                {t('admin.orderForm.addItem')}
              </button>
            </div>
             {currentItem.productId && currentItem.name && <p className="md:col-span-4 text-xs text-gray-500 dark:text-gray-400 mt-1">{t('admin.orderForm.selectedItemName')}: {currentItem.name}</p>}
          </div>

          {/* Added items list */}
          {formData.items.length > 0 && (
            <div className="space-y-3 mb-4">
              {formData.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{item.name || `Product ID: ${item.productId}`}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('admin.orderForm.quantity')}: {item.quantity} @ ${item.price?.toFixed(2)}
                    </p>
                  </div>
                  <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 font-medium">
                    {t('admin.orderForm.remove')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Total and Notes */}
        <div>
          <label htmlFor="total" className={labelClass}>{t('admin.orderForm.totalAmount')}</label>
          <input type="number" name="total" id="total" value={formData.total.toFixed(2)} onChange={handleInputChange} min="0" step="0.01" className={inputClass} />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('admin.orderForm.totalCalculatedInfo')}</p>
        </div>

        <div>
          <label htmlFor="notes" className={labelClass}>{t('admin.orderForm.notesOptional')}</label>
          <textarea name="notes" id="notes" value={formData.notes} onChange={handleInputChange} rows="3" className={inputClass}></textarea>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            {t('admin.cancelButton')}
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
            {loading ? t('admin.savingButton') : (initialOrder ? t('admin.orderForm.updateOrderButton') : t('admin.orderForm.createOrderButton'))}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
