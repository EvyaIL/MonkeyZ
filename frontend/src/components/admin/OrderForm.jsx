import React, { useState, useEffect, useCallback } from 'react';

const OrderForm = ({ order: initialOrder, onSubmit, onCancel, allProducts = [], allUsers = [], loading, error, t }) => {
  // const { t } = useTranslation(); // t is now passed as a prop
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    user_id: '', 
    selectedUserName: '', 
    status: 'Pending',
    items: [],
    // Values related to coupons and totals
    coupon_code: '', // New field for coupon code
    original_total: 0, // Will be calculated from items, or from initialOrder
    discount_amount: 0, // From initialOrder, or 0
    total: 0, // final total: original_total - discount_amount
    notes: '',
  });
  const [users, setUsers] = useState(allUsers);
  // Removed unused: loadingUsers, setLoadingUsers, coupons, setCoupons
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

  const calculateAndSetTotals = useCallback((items, couponCode = formData.coupon_code, discountAmount = formData.discount_amount) => {
    const currentOriginalTotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    // For now, discount_amount is primarily managed by backend logic after submission.
    // The form will display it if initialOrder has it, or if we implement client-side preview later.
    // For simplicity, if a coupon code is present but discount is 0 (e.g. new coupon entered),
    // we don't calculate discount here. Backend does it.
    // If editing, discountAmount comes from initialOrder.
    const currentDiscountAmount = initialOrder?.coupon_code === couponCode ? initialOrder?.discount_amount || 0 : (couponCode ? discountAmount : 0) ;
    const currentFinalTotal = currentOriginalTotal - currentDiscountAmount;

    setFormData(prev => ({
      ...prev,
      original_total: currentOriginalTotal,
      discount_amount: currentDiscountAmount, // Keep existing discount if coupon code hasn't changed
      total: currentFinalTotal,
    }));
  }, [initialOrder, formData.coupon_code, formData.discount_amount]); // Dependencies for recalculation logic

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
        const items = initialOrder.items || [];
        const originalTotal = initialOrder.original_total !== undefined ? initialOrder.original_total : calculateTotal(items);
        const discountAmount = initialOrder.discount_amount || 0;
        const finalTotal = initialOrder.total !== undefined ? initialOrder.total : originalTotal - discountAmount;

        setFormData({
          customerName: initialOrder.customerName || '',
          email: initialOrder.email || '',
          phone: initialOrder.phone || '',
          user_id: initialOrder.user_id || '',
          selectedUserName: userNameToDisplay,
          status: initialOrder.status || 'Pending',
          items: items,
          coupon_code: initialOrder.coupon_code || '',
          original_total: originalTotal,
          discount_amount: discountAmount,
          total: finalTotal,
          notes: initialOrder.notes || '',
          id: initialOrder.id || initialOrder._id || null
        });
      } else {
        // Reset for new order
        setFormData({
          customerName: '', email: '', phone: '', user_id: '', selectedUserName: '', status: 'Pending', 
          items: [], coupon_code: '', original_total: 0, discount_amount: 0, total: 0, notes: ''
        });
      }
    };
    initForm();
  }, [initialOrder, users, calculateTotal]);

  // Recalculate original_total and final_total whenever items change
  useEffect(() => {
    calculateAndSetTotals(formData.items, formData.coupon_code, formData.discount_amount);
  }, [formData.items, formData.coupon_code, formData.discount_amount, calculateAndSetTotals]);

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
    if (name === 'quantity') {
      processedValue = parseInt(value, 10);
      if (isNaN(processedValue) || processedValue < 1) { // Ensure it's a valid number, default to 1 or handle error
        processedValue = 1; 
      }
    } else if (name === 'price') {
      processedValue = parseFloat(value);
      if (isNaN(processedValue) || processedValue < 0) { // Ensure it's a valid number, default to 0 or handle error
        processedValue = 0;
      }
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
      alert(t('admin.orderForm.invalidItem', "Please select a product and ensure quantity/price are valid.")); 
      return;
    }
    const newItem = { ...currentItem, name: currentItem.name || `Product ID: ${currentItem.productId}` };
    const updatedItems = [...formData.items, newItem];
    // setFormData(prev => ({ // Total calculation is now handled by useEffect watching items
    //   ...prev,
    //   items: updatedItems,
    // }));
    // calculateAndSetTotals will be triggered by the state update of formData.items
    setFormData(prev => ({ ...prev, items: updatedItems }));
    setCurrentItem({ productId: '', name: '', quantity: 1, price: 0 }); 
  };

  const handleRemoveItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    // setFormData(prev => ({ // Total calculation is now handled by useEffect watching items
    //   ...prev,
    //   items: updatedItems,
    // }));
    // calculateAndSetTotals will be triggered by the state update of formData.items
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };
  
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formData.items.length === 0 && !initialOrder) { // Allow empty items if editing (e.g. to cancel all items)
      alert(t('admin.orderForm.atLeastOneItem', "Order must have at least one item.")); 
      return;
    }
    const dataToSubmit = { 
      ...formData, 
      user_id: formData.user_id || null,
      // Ensure numeric values are numbers, not strings, if changed by input type="number"
      original_total: parseFloat(formData.original_total) || 0,
      discount_amount: parseFloat(formData.discount_amount) || 0,
      total: parseFloat(formData.total) || 0,
      // Always send both couponCode and coupon_code for backend compatibility
      ...(formData.coupon_code ? { couponCode: formData.coupon_code, coupon_code: formData.coupon_code } : {}),
    };
    onSubmit(dataToSubmit);
  };

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  useEffect(() => {
    setUsers(allUsers);
  }, [allUsers]);

  useEffect(() => {
    if (searchTerm && users.length > 0) {
      const lower = searchTerm.toLowerCase();
      setFilteredUsers(users.filter(u =>
        (u.username && u.username.toLowerCase().includes(lower)) ||
        (u.email && u.email.toLowerCase().includes(lower))
      ));
    } else {
      setFilteredUsers([]);
    }
  }, [searchTerm, users]);

  return (
    <div className="my-6 p-6 bg-white dark:bg-gray-800 shadow-xl rounded-lg">
      <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
        {initialOrder ? t('admin.orderForm.editOrderTitle', 'Edit Order') : t('admin.orderForm.createNewOrderTitle', 'Create New Order')}
      </h3>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Customer Information */}
        <fieldset className="border p-4 rounded-md dark:border-gray-600">
          <legend className="text-lg font-medium text-gray-900 dark:text-white px-2">{t('admin.orderForm.customerInformationSection', 'Customer Information')}</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <label htmlFor="customerName" className={labelClass}>{t('admin.orderForm.customerNameLabel', 'Customer Name')}</label>
              <input type="text" name="customerName" id="customerName" value={formData.customerName} onChange={handleInputChange} className={inputClass} required />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>{t('admin.orderForm.emailLabel', 'Email Address')}</label>
              <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} className={inputClass} required />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>{t('admin.orderForm.phoneLabel', 'Phone Number')}</label>
              <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="status" className={labelClass}>{t('admin.orderForm.statusLabel', 'Order Status')}</label>
              <select name="status" id="status" value={formData.status} onChange={handleInputChange} className={inputClass}>
                <option value="Pending">{t('admin.orderStatus.pending', 'Pending')}</option>
                <option value="Processing">{t('admin.orderStatus.processing', 'Processing')}</option>
                <option value="Completed">{t('admin.orderStatus.completed', 'Completed')}</option>
                <option value="Cancelled">{t('admin.orderStatus.cancelled', 'Cancelled')}</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* User Linking */}
        <fieldset className="border p-4 rounded-md dark:border-gray-600">
          <legend className="text-lg font-medium text-gray-900 dark:text-white px-2">{t('admin.orderForm.linkUserSection', 'Link to Registered User (Optional)')}</legend>
          <div className="mt-4">
            <label htmlFor="user_search" className={labelClass}>{t('admin.orderForm.searchUserLabel', 'Search User')}</label>
            <input
              type="text"
              id="user_search"
              placeholder={t('admin.orderForm.searchUserPlaceholder', 'Start typing name or email to search...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${inputClass} mb-1`}
              aria-describedby="user-search-description"
              aria-autocomplete="list"
              aria-controls="user-suggestions-list"
            />
            <p id="user-search-description" className="sr-only">{t('admin.orderForm.searchUserDescription', 'Type to search for registered users and link them to this order. This can pre-fill customer details.')}</p>
            
            {searchTerm && filteredUsers.length > 0 && (
              <ul id="user-suggestions-list" className="border border-gray-300 dark:border-gray-600 rounded-md max-h-40 overflow-y-auto bg-white dark:bg-gray-700 shadow-lg z-10" role="listbox" aria-label={t('admin.orderForm.suggestedUsersListLabel', 'Suggested Users')}>
                {filteredUsers.map(user => (
                  <li 
                    key={user.id || user._id} 
                    onClick={() => handleUserSelect(user.id || user._id)}
                    className="p-3 hover:bg-indigo-100 dark:hover:bg-indigo-700 cursor-pointer text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:bg-indigo-100 dark:focus:bg-indigo-700"
                    role="option"
                    tabIndex={0}
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
                  <span className="font-semibold">{t('admin.orderForm.linkedUserConfirmationLabel', 'Linked to User:')}</span> {formData.selectedUserName}
                </p>
              </div>
            )}
          </div>
        </fieldset>

        {/* Order Items Section */}
        <fieldset className="border p-4 rounded-md dark:border-gray-600">
          <legend className="text-lg font-medium text-gray-900 dark:text-white px-2">{t('admin.orderForm.orderItemsSection', 'Order Items')}</legend>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-4 mb-4 mt-4 p-4 border dark:border-gray-600 rounded-md items-end">
            <div className="md:col-span-1"> {/* Product selection takes more space */}
              <label htmlFor="productId" className={labelClass}>{t('admin.orderForm.productLabel', 'Product')}</label>
              <select name="productId" id="productId" value={currentItem.productId} onChange={handleItemInputChange} className={inputClass}>
                <option value="">{t('admin.orderForm.selectProductPlaceholder', '-- Select Product --')}</option>
                {allProducts.map(p => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.name?.en || p.name?.he || p.name} (ID: {p.id || p._id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="quantity" className={labelClass}>{t('admin.orderForm.quantityLabel', 'Quantity')}</label>
              <input type="number" name="quantity" id="quantity" value={currentItem.quantity} onChange={handleItemInputChange} min="1" step="1" className={`${inputClass} w-24`} />
            </div>
            <div>
              <label htmlFor="price" className={labelClass}>{t('admin.orderForm.pricePerItemLabel', 'Price/Item')}</label>
              <input type="number" name="price" id="price" value={currentItem.price} onChange={handleItemInputChange} min="0" step="0.01" className={`${inputClass} w-28`} />
            </div>
            <div className="self-end">
              <button type="button" onClick={handleAddItem} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md shadow-sm whitespace-nowrap">
                {t('admin.orderForm.addItemButton', 'Add Item')}
              </button>
            </div>
             {currentItem.productId && currentItem.name && <p className="md:col-span-4 text-xs text-gray-500 dark:text-gray-400 mt-1">{t('admin.orderForm.selectedItemInfo', 'Selected Item')}: {currentItem.name}</p>}
          </div>

          {/* Added items list */}
          {formData.items.length > 0 && (
            <div className="space-y-3 mb-4">
              <h5 className="text-md font-medium text-gray-800 dark:text-gray-200">{t('admin.orderForm.currentItemsInOrderTitle', 'Current Items in Order:')}</h5>
              {formData.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 border dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{item.name || `${t('admin.orderForm.productIdFallback', 'Product ID')}: ${item.productId}`}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {/* Correctly display quantity and price */}
                      {item.quantity} x ₪{typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
                    </p>
                  </div>
                  <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 font-medium">
                    {t('admin.orderForm.removeItemButton', 'Remove')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </fieldset>
        
        {/* Coupon and Totals Section */}
        <fieldset className="border p-4 rounded-md dark:border-gray-600">
          <legend className="text-lg font-medium text-gray-900 dark:text-white px-2">{t('admin.orderForm.summaryAndCouponSection', 'Summary & Coupon')}</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <label htmlFor="coupon_code" className={labelClass}>{t('admin.orderForm.couponCodeLabel', 'Coupon Code (Optional)')}</label>
              <input 
                type="text" 
                name="coupon_code" 
                id="coupon_code" 
                value={formData.coupon_code} 
                onChange={handleInputChange} 
                className={inputClass} 
                placeholder={t('admin.orderForm.enterCouponPlaceholder', 'Enter coupon code if any')}
              />
            </div>
            <div className="space-y-3"> {/* Totals on the right */}
              <div>
                <span className={labelClass}>{t('admin.orderForm.originalTotalLabel', 'Subtotal:')}</span>
                <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">₪{formData.original_total.toFixed(2)}</p>
              </div>

              {formData.coupon_code && (
                <div>
                  <span className={labelClass}>{t('admin.orderForm.discountAppliedLabel', 'Discount Applied ({couponCode}):', { couponCode: formData.coupon_code })}</span>
                  <p className="mt-1 text-lg font-medium text-green-600 dark:text-green-400">- ₪{formData.discount_amount.toFixed(2)}</p>
                </div>
              )}

              <div>
                <span className={`${labelClass} font-bold text-xl`}>{t('admin.orderForm.finalTotalLabel', 'Grand Total:')}</span>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">₪{formData.total.toFixed(2)}</p>
                {formData.coupon_code && formData.discount_amount === 0 && initialOrder?.coupon_code !== formData.coupon_code && (
                     <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">{t('admin.orderForm.couponValidationMessage', 'Note: New coupon discount will be calculated upon saving.')}</p>
                )}
                 {formData.coupon_code && initialOrder?.coupon_code === formData.coupon_code && formData.discount_amount === 0 && formData.original_total > 0 && (
                     <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">{t('admin.orderForm.couponNoDiscountMessage', 'This coupon did not result in a discount. It might be invalid or not applicable.')}</p>
                )}
              </div>
            </div>
          </div>
        </fieldset>

        <div>
          <label htmlFor="notes" className={labelClass}>{t('admin.orderForm.notesLabel', 'Order Notes (Optional)')}</label>
          <textarea name="notes" id="notes" value={formData.notes} onChange={handleInputChange} rows="3" className={inputClass} placeholder={t('admin.orderForm.notesPlaceholder', 'Add any internal notes for this order...')}></textarea>
        </div>

        {error && <p className="text-red-500 text-sm p-2 bg-red-100 dark:bg-red-900/30 rounded-md">{t('admin.orderForm.errorMessage', 'Error: {formError}', {formError: error})}</p>}

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-8">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            {t('admin.buttons.cancel', 'Cancel')}
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
            {loading ? t('admin.buttons.saving', 'Saving...') : (initialOrder ? t('admin.orderForm.updateOrderButtonLabel', 'Update Order') : t('admin.orderForm.createOrderButtonLabel', 'Create Order'))}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
