import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGlobalProvider } from '../context/GlobalProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { formatDistanceToNow } from 'date-fns';

const BlogCommentSection = ({ postId }) => {
  const { t } = useTranslation();
  const { user, notify } = useGlobalProvider();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ comment: newComment })
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [data, ...prev]);
        setNewComment('');
        notify({ message: t('comment_added'), type: 'success' });
      } else {
        throw new Error('Failed to post comment');
      }
    } catch (error) {
      notify({ message: t('comment_failed'), type: 'error' });
    }
  };

  const handleToggleLike = async (commentId) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchComments(); // Refresh comments to get updated likes
        notify({ message: t('like_updated'), type: 'success' });
      } else {
        throw new Error('Failed to update like');
      }
    } catch (error) {
      notify({ message: t('like_failed'), type: 'error' });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-24 bg-gray-700 rounded-lg"></div>;
  }

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold text-white mb-6">{t('comments')}</h3>
      
      {/* Comment Form */}
      {user && (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder={t('add_comment')}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-accent focus:ring-1 focus:ring-accent"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
              disabled={!newComment.trim()}
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.comment_id} className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-white">{comment.comment}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleLike(comment.comment_id)}
                  className={`flex items-center gap-1 text-sm ${
                    comment.likes.includes(user?.id) ? 'text-red-500' : 'text-gray-400'
                  } hover:text-red-500 transition-colors`}
                >
                  <FontAwesomeIcon icon={faHeart} />
                  <span>{comment.likes.length}</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center">{t('no_comments')}</p>
        )}
      </div>
    </div>
  );
};

export default BlogCommentSection;
