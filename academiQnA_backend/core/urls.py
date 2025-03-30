# Importing
from django.urls import path
from django.http import JsonResponse  # Import JsonResponse
from .views import LoginView
from .views import DiscussionBoardView, PostView,JoinDiscussionBoardView, UserJoinedBoardsView,DiscussionBoardDetailView,BoardPostsView, CommentView, LikePostView, LikeCommentView

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
    path('api/posts/<int:post_id>/comments/<int:comment_id>/like/', LikeCommentView.as_view(), name='like-comment'), #  # Allows user to toggle like actions for comments




]


