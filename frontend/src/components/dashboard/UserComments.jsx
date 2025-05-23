import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function UserComments() {  const [comments, setComments] = useState([]);  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchComments();
    }
  }, [isAuthenticated]);

  const fetchComments = async () => {
    try {
      const response = await fetch('/api/user/comments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetch(`/api/user/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setComments(comments.filter(comment => comment.id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Your Comments</h2>
      
      {comments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No comments yet</h3>
          <p className="mt-1 text-gray-500">Your comments on blog posts will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div>
                  <a
                    href={`/blog/${comment.postSlug}`}
                    className="text-lg font-medium text-blue-600 hover:text-blue-800"
                  >
                    {comment.postTitle}
                  </a>
                  <p className="mt-2 text-gray-600">{comment.content}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    Posted on {new Date(comment.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
              
              {comment.likes > 0 && (
                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <svg className="h-4 w-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  {comment.likes} {comment.likes === 1 ? 'like' : 'likes'}
                </div>
              )}
              
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 pl-4 border-l-2 border-gray-200">
                  <p className="text-sm text-gray-500">{comment.replies.length} replies</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
