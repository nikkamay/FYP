# Importing
from django.urls import path
from django.http import JsonResponse  # Import JsonResponse
from .views import LoginView
from .views import DiscussionBoardView, PostView,JoinDiscussionBoardView, UserJoinedBoardsView,DiscussionBoardDetailView,BoardPostsView, CommentView, LikePostView, LikeCommentView
from .views import summarize_threads, register_user,user_profile,JoinedPostsView,board_members,DeletePostView,UpdatePostView,DownvoteCommentView,DownvotePostView,DeleteCommentView,UpdateCommentView,DeleteDiscussionBoardView,ModerationView, report_comment,report_post,approve_comment,approve_post,ai_flagged_moderation,moderate_content, search_content

# Default response for the core app root path
def core_root_view(request):
    return JsonResponse({"message": "Core app root!"})

# Define core app-specific URL patterns
urlpatterns = [
    path('', core_root_view),  # Root path for the core app
    path('login/', LoginView.as_view(), name='login'),  # Manages user login
    path('api/discussion-boards/', DiscussionBoardView.as_view(), name='discussion-board-list'), # Creates and lists discussion boards
    path('api/discussion-boards/<int:board_id>/', DiscussionBoardDetailView.as_view(), name='discussion-board-detail'), # Retrieves a specific discussion board
    path('api/posts/', PostView.as_view(), name='post-list'), # Lists all posts across boards
    path('api/posts/<int:board_id>/', BoardPostsView.as_view(), name='board-posts'),  # Retrieves or creates all posts within a specific board
    path('join-board/<int:board_id>/', JoinDiscussionBoardView.as_view(), name='join-board'), # Allows users to join a specific discussion board
    path('joined-boards/', UserJoinedBoardsView.as_view(), name='joined-boards'), # Retrieves all discussion boards a user is a member of
    path("api/posts/<int:post_id>/comments/", CommentView.as_view(), name="post-comments"), # Retrieves or creates comments and replies
    path('api/posts/<int:post_id>/like/', LikePostView.as_view(), name='like-post'), # Allows user to toggle like actions for posts
    path('api/posts/<int:post_id>/comments/<int:comment_id>/like/', LikeCommentView.as_view(), name='like-comment'), # Allows user to toggle like actions for comments
    path('api/summarize/', summarize_threads, name='summarize-posts'),  # Allows user to summarize discussion thread
    path('api/register/', register_user, name='register'), # For registering new users
    path('api/profile/', user_profile, name='user-profile'), # Retrieves user profile information
    path('api/joined-posts/', JoinedPostsView.as_view(), name='joined-posts'), # Retrieves all posts a user has joined
    path('api/discussion-boards/<int:board_id>/members/', board_members, name='board-members'), # Retrieves all members of a specific discussion board
    path('api/discussion-boards/<int:board_id>/members/<int:user_id>/', board_members, name='board-member-remove'), # Removes a user from a specific discussion board
    path('api/posts/<int:post_id>/delete/', DeletePostView.as_view(), name='delete-post'), # Deletes a specific post
    path('api/posts/<int:post_id>/edit/', UpdatePostView.as_view(), name='edit-post'), # Updates a specific post
    path('api/posts/<int:post_id>/downvote/', DownvotePostView.as_view(), name='downvote-post'), # Allows user to downvote a post
    path('api/posts/<int:post_id>/comments/<int:comment_id>/downvote/', DownvoteCommentView.as_view(), name='downvote-comment'), # Allows user to downvote a comment
    path('api/posts/<int:post_id>/comments/<int:comment_id>/delete/', DeleteCommentView.as_view(), name='delete-comment'), # Deletes a specific comment
    path('api/posts/<int:post_id>/comments/<int:comment_id>/edit/', UpdateCommentView.as_view(), name='edit-comment'), # Updates a specific comment
    path('api/discussion-boards/<int:board_id>/delete/', DeleteDiscussionBoardView.as_view(), name='delete-discussion-board'), # Deletes a specific discussion board
    path('api/moderation/<int:board_id>/', ModerationView.as_view(), name='moderation'), # Allows moderators to moderate content
    path('api/posts/<int:post_id>/report/', report_post, name='report-post'), # Reports a specific post
    path('api/posts/<int:post_id>/comments/<int:comment_id>/report/', report_comment, name='report-comment'), # Reports a specific comment
    path('api/posts/<int:post_id>/approve/', approve_post, name='approve-post'), # Approves a specific post (Moderator)
    path('api/posts/<int:post_id>/comments/<int:comment_id>/approve/', approve_comment, name='approve-comment'), # Approves a specific comment (Moderator)
    path('api/moderation/ai/<int:board_id>/',ai_flagged_moderation, name='ai_flagged_moderation'), # AI flagged moderation
    path('api/moderate/', moderate_content, name='moderate-content'), # Allows moderators to moderate content
    path('api/search/', search_content, name='search_content'), # Searches for content
    


    




]


