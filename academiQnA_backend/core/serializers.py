from rest_framework import serializers
from .models import DiscussionBoard, Post, User
# In order to use in API responses, the following models need to be serialize:

# DiscussionBoard Serializer
class DiscussionBoardSerializer(serializers.ModelSerializer):
    # Defines model and its fields
    class Meta:
        model = DiscussionBoard
        # Fields defined to include in responses
        fields = ['id', 'title', 'description', 'creator', 'date_created','board_image']

# DiscussionBoard Serializer
class PostSerializer(serializers.ModelSerializer):
    # Username field from User model is used to include in posts
    username = serializers.CharField(source='user.username', read_only=True)
    # Adding board title
    board_title = serializers.CharField(source='board.title', read_only=True)  
    
    # Defines model and its fields
    class Meta:
        model = Post
        # Fields defined to include in responses
        fields = ['id', 'board','board_title' ,'user', 'username', 'content', 'date_posted']


