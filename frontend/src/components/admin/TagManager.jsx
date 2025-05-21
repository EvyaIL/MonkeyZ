import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGlobalProvider } from '../../context/GlobalProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

const TagManager = ({ onTagSelect }) => {
  const { t } = useTranslation();
  const { notify } = useGlobalProvider();
  const [tags, setTags] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: { en: '', he: '' },
    color: '#000000'
  });

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/admin/tags', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newTag = await response.json();
        setTags(prev => [...prev, newTag]);
        setIsModalOpen(false);
        notify({ message: t('tag_created'), type: 'success' });
      } else {
        throw new Error('Failed to create tag');
      }
    } catch (error) {
      notify({ message: t('tag_create_failed'), type: 'error' });
    }
  };

  const handleDelete = async (tagId) => {
    if (!window.confirm(t('confirm_delete_tag'))) return;

    try {
      const response = await fetch(`/api/admin/tags/${tagId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setTags(prev => prev.filter(tag => tag.id !== tagId));
        notify({ message: t('tag_deleted'), type: 'success' });
      } else {
        throw new Error('Failed to delete tag');
      }
    } catch (error) {
      notify({ message: t('tag_delete_failed'), type: 'error' });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">{t('manage_tags')}</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-accent text-white px-3 py-1 rounded hover:bg-accent-dark transition-colors flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          {t('add_tag')}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {tags.map(tag => (
          <div
            key={tag.id}
            className="bg-gray-700 p-2 rounded flex items-center justify-between"
            style={{ borderLeft: `4px solid ${tag.color}` }}
          >
            <span className="text-white">{tag.name.en}</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(tag.id)}
                className="text-red-400 hover:text-red-300"
                title={t('delete')}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tag Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-6">{t('create_tag')}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white mb-1">{t('name_en')}</label>
                <input
                  type="text"
                  value={formData.name.en}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    name: { ...prev.name, en: e.target.value }
                  }))}
                  className="w-full bg-gray-700 text-white rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-white mb-1">{t('name_he')}</label>
                <input
                  type="text"
                  value={formData.name.he}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    name: { ...prev.name, he: e.target.value }
                  }))}
                  className="w-full bg-gray-700 text-white rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-white mb-1">{t('color')}</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    color: e.target.value
                  }))}
                  className="w-full bg-gray-700 rounded px-3 py-2"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-500 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-accent rounded hover:bg-accent-dark transition-colors"
                >
                  {t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagManager;
