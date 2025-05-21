from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from ..models.blog.comment import BlogComment, BlogCommentInDB
from ..mongodb.blog_comment_collection import BlogCommentCollection
from ..lib.token_handler import get_current_user

router = APIRouter()
blog_collection = BlogCommentCollection()

@router.post("/posts/{post_id}/comments")
async def create_comment(post_id: str, comment: BlogComment, current_user: dict = Depends(get_current_user)):
    try:
        comment.user_id = current_user["id"]
        result = await blog_collection.create_comment(post_id, comment)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str, current_user: dict = Depends(get_current_user)):
    try:
        comments = await blog_collection.get_post_comments(post_id)
        return comments
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/comments/{comment_id}/like")
async def toggle_like(comment_id: str, current_user: dict = Depends(get_current_user)):
    try:
        # Check if user has already liked the comment
        comment = await blog_collection.get_comment_by_id(comment_id)
        user_id = current_user["id"]
        
        if user_id in comment.likes:
            success = await blog_collection.remove_like(comment_id, user_id)
            action = "removed from"
        else:
            success = await blog_collection.add_like(comment_id, user_id)
            action = "added to"
        
        if success:
            return {"message": f"Like {action} comment successfully"}
        raise HTTPException(status_code=400, detail="Failed to update like")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
