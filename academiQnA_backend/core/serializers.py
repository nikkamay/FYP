from rest_framework import serializers
from .models import DiscussionBoard, Post, User, Comment

# Serializers to transform model instances into JSON format for API responses

# User Serializer
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # Includes only key user details for API responses
        fields = ['id','username','is_lecturer']

# DiscussionBoard Serializer
class DiscussionBoardSerializer(serializers.ModelSerializer):
    # Serializing the creator's username
    creator_username = serializers.CharField(source='creator.username', read_only=True)

    # Enables assigning members by referencing user IDs
    members = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all(),required=False)
    
    # Defines the model and specifies which fields should be included in API response
    class Meta:
        model = DiscussionBoard
        # Fields to serialize and included in the API response
        fields = ['id', 'title', 'description', 'creator','creator_username','date_created','board_image','members']


# Post Serializer
class PostSerializer(serializers.ModelSerializer):
    # Retrieves the username of the post's author from User model
    username = serializers.CharField(source='user.username', read_only=True)
    # Retrieves board title the post is associated from DiscussionBoard model
    board_title = serializers.CharField(source='board.title', read_only=True)  
    
# Defines the model and specifies which fields should be included in API response
    class Meta:
        model = Post
        # Fields to serialize and included in the API response
        fields = ['id', 'board', 'board_title', 'user', 'username', 'content', 'date_posted']

        # Fields as read-only to prevent modification through API
        read_only_fields = ['board', 'user', 'board_title', 'username', 'date_posted']

    # Custom method to overview if the authernticated user has liked the post
    def get_liked_by_user(self, obj):
        """Determine whether the authenticated user has liked the post"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False


# Comment Serializer
class CommentSerializer(serializers.ModelSerializer):
    # Retrieves username of the comment's author from User model
    username = serializers.CharField(source='user.username', read_only=True)

    # Retrieves the of the comment's author from User model
    replies = serializers.SerializerMethodField() 
    class Meta:
        model = Comment
        fields = ['id', 'post', 'user', 'username', 'content', 'date_posted', 'parent', 'replies','like_count']
        read_only_fields = ['post', 'user', 'username', 'date_posted']


    def get_liked_by_user(self, obj):
        """Determine whether the authenticated user has liked the comment."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

    # Custom method to return the total number of likes on a comment 
    def get_like_count(self, obj):
        return obj.likes.count()

    # Custom method to return the total number of likes on a reply 
    def get_replies(self, obj):
        replies = obj.replies.all().order_by("date_posted")
        return CommentSerializer(replies, many=True).data 
