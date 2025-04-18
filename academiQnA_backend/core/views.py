from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework import status
from django.http import JsonResponse
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from .models import DiscussionBoard, Post, User, Comment
from django.shortcuts import get_object_or_404
from .models import DiscussionBoard, JoinedBoard
from .serializers import DiscussionBoardSerializer, PostSerializer, UserSerializer, CommentSerializer, ProfileUserSerializer
from rest_framework.authtoken.models import Token 
from rest_framework.authentication import TokenAuthentication
from django.conf import settings
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import traceback
from openai import OpenAI
from django.contrib.auth.hashers import make_password
from rest_framework.generics import ListCreateAPIView
from django.conf import settings
import requests
from django.contrib.postgres.search import SearchVector, SearchQuery
from rest_framework.permissions import AllowAny


# API endpoint to handle login requests, checking the username and password and compares db
class LoginView(APIView):
    def post(self, request):
        # Getting the username and password from request
        username = request.data.get("username")
        password = request.data.get("password")

        # User model used
        user = authenticate(username=username, password=password)

        # Authenticating that credential matches with db
        if user is not None:
            # Retrieve or create authentication token
            token, created = Token.objects.get_or_create(user=user)

            return Response({
                "statMsg": "Login successful!",
                "token": token.key  # Include token in response
            }, status=status.HTTP_200_OK)
        else:
            # When invalid, returns an error message of 400 HTTP status
            return Response({
                "statMsg": "Invalid username or password"
            }, status=status.HTTP_400_BAD_REQUEST)


# API endpoint for listing discussion boards
class DiscussionBoardView(ListCreateAPIView):
    # Retrieves all discussion boards
    queryset = DiscussionBoard.objects.all()
    # Serialize for JSON conversion
    serializer_class = DiscussionBoardSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]


    
    def perform_create(self, serializer):   # Keep it perform_create
        serializer.save(creator=self.request.user)

# API endpoint for listing discussion threads
class DiscussionBoardDetailView(APIView):
    queryset = DiscussionBoard.objects.all()
    serializer_class = DiscussionBoardSerializer
    def get(self, request, board_id):
        board = get_object_or_404(DiscussionBoard, id=board_id)
        serializer = DiscussionBoardSerializer(board)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request, board_id):
        board = get_object_or_404(DiscussionBoard, id=board_id)
        serializer = DiscussionBoardSerializer(board, data=request.data, partial=True)  # partial=True lets you update only title/description
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# API endpoint for listing dposts
class PostView(ListAPIView):
    # Retrieves all posts
    queryset = Post.objects.all()
    # Serialize for JSON conversion
    serializer_class = PostSerializer

from rest_framework.authentication import TokenAuthentication

# Join a board
class JoinDiscussionBoardView(APIView):
    authentication_classes = [TokenAuthentication]  
    permission_classes = [IsAuthenticated]  

    def post(self, request, board_id):
        user = request.user
        board = get_object_or_404(DiscussionBoard, id=board_id)

        #  Checking if user exists in JoinedBoard
        if JoinedBoard.objects.filter(user=user, board=board).exists():
            return Response({"statMsg": "Already joined this board."}, status=status.HTTP_400_BAD_REQUEST)

        #  Creating JoinedBoard entry
        JoinedBoard.objects.create(user=user, board=board)

        #  User added to ManyToManyField members
        board.members.add(user)  
        board.save()

        return Response({"statMsg": f"Successfully joined {board.title}"}, status=status.HTTP_200_OK)
    
# Get boards joined by user
class UserJoinedBoardsView(APIView):
    authentication_classes = [TokenAuthentication]  
    permission_classes = [IsAuthenticated] 

    def get(self, request):
        user = request.user
        joined_boards = DiscussionBoard.objects.filter(members=user)
        serializer = DiscussionBoardSerializer(joined_boards, many=True)
        return Response(serializer.data)


# Get or create posts in a specific board
class BoardPostsView(APIView):
    authentication_classes = [TokenAuthentication]  
    permission_classes = [IsAuthenticated] 

    def get(self, request, board_id):
        board = get_object_or_404(DiscussionBoard, id=board_id)
        posts = Post.objects.filter(board=board)
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, board_id):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

        board = get_object_or_404(DiscussionBoard, id=board_id)
        serializer = PostSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            serializer.save(user=request.user, board=board)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
        
            return Response({"detail": "Invalid data", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


# Allows users to add or retrieve comments on a post
class CommentView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, post_id):
        post = get_object_or_404(Post, id=post_id)
        
      
        comments = Comment.objects.filter(post=post, parent=None).order_by("date_posted")  
        serializer = CommentSerializer(comments, many=True, context={'request': request})

        
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, post_id):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

        post = get_object_or_404(Post, id=post_id)
        parent_comment_id = request.data.get("parent")  

        if parent_comment_id:
            parent_comment = Comment.objects.filter(id=parent_comment_id, post=post).first()
            if not parent_comment:
                return Response({"detail": "Parent comment not found."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            parent_comment = None  # If no parent, it's a top-level comment

        serializer = CommentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(user=request.user, post=post, parent=parent_comment)  #  Save with parent reference
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response({"detail": "Invalid data", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
# Like or unlike a post also applies mutual exclusivity for downvotes
class LikePostView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        post = get_object_or_404(Post, id=post_id)
        user = request.user

        if post.downvotes.filter(id=user.id).exists():
            post.downvotes.remove(user)
        
        if post.likes.filter(id=request.user.id).exists():
            post.likes.remove(request.user) 
            liked = False
        else:
            post.likes.add(request.user)  
            liked = True

        return Response({
            "liked": liked,
            "like_count": post.likes.count(),
            "downvote_count": post.downvotes.count()
        }, status=status.HTTP_200_OK)

# Like or unlike a comment
class LikeCommentView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id, comment_id):
   

        comment = get_object_or_404(Comment, id=comment_id, post_id=post_id)
        user = request.user

        # Remove downvote if exists
        if comment.downvotes.filter(id=user.id).exists():
            comment.downvotes.remove(user)

        if comment.likes.filter(id=request.user.id).exists():
            comment.likes.remove(request.user)
            liked = False
        else:
            comment.likes.add(request.user)
            liked = True

        print(f"Updated like count: {comment.likes.count()} for comment {comment_id}")

        return Response({
            "liked": liked,
            "like_count": comment.likes.count(),
            "downvote_count": comment.downvotes.count()
        }, status=status.HTTP_200_OK)

# Downvote or remove downvote on a post
class DownvotePostView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        post = get_object_or_404(Post, id=post_id)
        user = request.user
      
    
        if post.likes.filter(id=user.id).exists():
            post.likes.remove(user)
            

        if post.downvotes.filter(id=request.user.id).exists():
            post.downvotes.remove(request.user) 
            downvoted = False
        else:
            post.downvotes.add(request.user)  
            downvoted = True
        return Response({
            "downvoted": downvoted,
            "downvote_count": post.downvotes.count(),
            "like_count": post.likes.count()
        }, status=status.HTTP_200_OK)
    
# Downvote or remove downvote on a comment.
class DownvoteCommentView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    

    def post(self, request, post_id, comment_id):
        comment = get_object_or_404(Comment, id=comment_id, post_id=post_id)
        user = request.user
        
        if comment.likes.filter(id=user.id).exists():
            comment.likes.remove(user)

        if comment.downvotes.filter(id=request.user.id).exists():
            comment.downvotes.remove(request.user)  # Remove downvote
            downvoted = False
        else:
            comment.downvotes.add(request.user)  # Add downvote
            downvoted = True

        return Response({
            "downvoted": downvoted,
            "downvote_count": comment.downvotes.count(),
            "like_count": comment.likes.count()
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def summarize_threads(request):
    try:
        threads = request.data.get("threads", [])
        if not threads:
            return Response({"error": "No threads provided."}, status=400)

       
        full_text = ""
        for thread in threads:
            post = thread.get("post", "")
            comments = thread.get("comments", [])
            full_text += f"Post: {post}\n"
            for comment in comments:
                username = comment.get("username", "Anonymous")
                content = comment.get("content", "")
                full_text += f"- {username}: {content}\n"
            full_text += "\n"

       
        client = OpenAI(
            api_key=settings.GROQ_API_KEY,
            base_url=settings.GROQ_API_BASE,  # https://api.groq.com/openai/v1
        )

       
        response = client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[
            {
            "role": "system",
            "content": (
                "You are an academic assistant that summarizes discussion threads clearly and concisely. "
                "Group similar discussions into major topics or themes. "
                "Format the summary in clean HTML. Use headings (<h3>), paragraphs (<p>), and bullet points (<ul><li>). "
                "Make sure the output is properly structured HTML without <html> or <body> tags."
                "Write in a way that is useful for students (to understand key points) and lecturers (to identify student needs)."
            )
        },
        {
            "role": "user",
            "content": f"Summarize and group the following forum discussions by themes:\n\n{full_text}"
        }
        ],
        temperature=0.5,
        max_tokens=500
    )

        summary = response.choices[0].message.content
        return Response({"summary": summary})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def moderate_content(request):
    try:
        text = request.data.get('text')
        if not text:
            return Response({'error': 'No text provided.'}, status=400)

        # Create Groq client
        client = OpenAI(
            api_key=settings.GROQ_API_KEY,
            base_url=settings.GROQ_API_BASE, 
        )

  
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a strict content moderator. "
                        "Detect if the input text contains any of the following: "
                        "hate speech, violence, harassment, spam, self-harm, sexual content, misinformation, "
                        "offensive jokes, bullying, discrimination (race, gender, religion), academic dishonesty, "
                        "keyboard smashes (like 'asdkjhasd'), or anything irrelevant to academic discussion forums. "
                        "Even mild or indirect examples should be flagged. "
                        "If it violates guidelines, reply ONLY 'true'. If it is safe, reply ONLY 'false'. No explanation."
                    ),
                },
                {"role": "user", "content": text}
            ],
            temperature=0,
            max_tokens=1,
        )

        moderation_decision = response.choices[0].message.content.strip().lower()
        
  
        flagged = moderation_decision == "true"

        return Response({'results': [{'flagged': flagged}]})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    try:
        data = request.data

        username = data.get("username")
        first_name = data.get("first_name")
        last_name = data.get("last_name")
        email = data.get("email")
        password = data.get("password")
        is_lecturer = data.get("is_lecturer", False)

        # Field are all required
        if not username or not password or not first_name or not last_name or not email:
            return Response({"error": "All input fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        # Validation of email strictly university accounts
        if not (email.endswith('@mytudublin.ie') or email.endswith('@tudublin.ie')):
            return Response({"error": "Please use the university email address."}, status=400)

        # Duplication of usernames check
        if User.objects.filter(username=username).exists():
            return Response({"error": "Username is already taken."}, status=400)

        # Create the user
        user = User.objects.create(
            username=username,
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=make_password(password),
            is_lecturer=is_lecturer
        )

        # Authentication token creation
        token = Token.objects.create(user=user)

        return Response({"token": token.key}, status=201)

    except Exception as e:
        return Response({"error": f"Internal server error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['GET', 'PUT'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def user_profile(request):
    if request.method == 'GET':
        serializer = ProfileUserSerializer(request.user)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = ProfileUserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        

class JoinedPostsView(ListAPIView):
    serializer_class = PostSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        joined_board_ids = JoinedBoard.objects.filter(user=user).values_list('board_id', flat=True)
        return Post.objects.filter(board_id__in=joined_board_ids)
    


@api_view(['GET', 'DELETE'])
@authentication_classes([TokenAuthentication]) 
@permission_classes([IsAuthenticated])
def board_members(request, board_id, user_id=None):
    board = get_object_or_404(DiscussionBoard, id=board_id)

    if request.method == 'GET':
        members = board.members.all()
        data = [{"id": user.id, "username": user.username} for user in members]
        return Response(data)

    elif request.method == 'DELETE':
        if user_id is None:
            return Response({"error": "User ID required"}, status=400)

        user_to_remove = get_object_or_404(User, id=user_id)

        # Remove from board members
        board.members.remove(user_to_remove)

        # Also delete from JoinedBoard
        JoinedBoard.objects.filter(user=user_to_remove, board=board).delete()

        return Response({"message": "User removed successfully"})

class DeletePostView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, post_id):
        post = get_object_or_404(Post, id=post_id)
        board = post.board  # Post has a board relation

 
        if post.user != request.user and board.creator != request.user and not request.user.is_lecturer:
            return Response({"error": "You are not authorized to delete this post."}, status=status.HTTP_403_FORBIDDEN)

        post.delete()
        return Response({"message": "Post deleted successfully."}, status=status.HTTP_200_OK)
    

class UpdatePostView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request, post_id):
        post = get_object_or_404(Post, id=post_id)
        board = post.board

      
        if post.user != request.user and board.creator != request.user and not request.user.is_lecturer:
            return Response({"error": "You are not authorized to edit this post."}, status=status.HTTP_403_FORBIDDEN)

        new_content = request.data.get('content')
        if not new_content:
            return Response({"error": "Content cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        post.content = new_content
        post.save()

        return Response({"message": "Post updated successfully."}, status=status.HTTP_200_OK)


class DeleteCommentView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, post_id, comment_id):
        comment = get_object_or_404(Comment, id=comment_id, post_id=post_id)
        board = comment.post.board  

        if comment.user != request.user and board.creator != request.user and not request.user.is_lecturer:
            return Response({"error": "You are not authorized to delete this comment."}, status=status.HTTP_403_FORBIDDEN)

        comment.delete()
        return Response({"message": "Comment deleted successfully."}, status=status.HTTP_200_OK)


class UpdateCommentView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request, post_id, comment_id):
        comment = get_object_or_404(Comment, id=comment_id, post_id=post_id)
        board = comment.post.board

        if comment.user != request.user and board.creator != request.user and not request.user.is_lecturer:
            return Response({"error": "You are not authorized to edit this comment."}, status=status.HTTP_403_FORBIDDEN)

        new_content = request.data.get('content')
        if not new_content:
            return Response({"error": "Content cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        comment.content = new_content
        comment.save()

        return Response({"message": "Comment updated successfully."}, status=status.HTTP_200_OK)
    

class DeleteDiscussionBoardView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, board_id):
        board = get_object_or_404(DiscussionBoard, id=board_id)

        # Only the creator can delete
        if board.creator != request.user:
            return Response({"error": "You can only delete boards you created."}, status=status.HTTP_403_FORBIDDEN)

        board.delete()
        return Response({"message": "Board deleted successfully."}, status=status.HTTP_200_OK)
    

class ModerationView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    

    def get(self, request, board_id):
        try:
            board = DiscussionBoard.objects.get(id=board_id)
        except DiscussionBoard.DoesNotExist:
            return Response({'error': 'Discussion Board not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Only allow the lecturer who created the board
        if board.creator != request.user:
            return Response({'error': 'You are not authorized to moderate this board.'}, status=status.HTTP_403_FORBIDDEN)

        # Get all reported posts
        reported_posts = Post.objects.filter(board=board, content_moderation=True)
        # Get all reported comments
        reported_comments = Comment.objects.filter(post__board=board, content_moderation=True)

        posts_data = PostSerializer(reported_posts, many=True, context={'request': request}).data
        comments_data = CommentSerializer(reported_comments, many=True, context={'request': request}).data

        return Response({
            'reported_posts': posts_data,
            'reported_comments': comments_data
        }, status=status.HTTP_200_OK)
    




@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def report_post(request, post_id):
    try:
        post = get_object_or_404(Post, id=post_id)
        post.content_moderation = True
        post.save()
        return Response({"message": "Post reported successfully."}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def report_comment(request, post_id, comment_id):
    try:
        comment = get_object_or_404(Comment, id=comment_id, post_id=post_id)
        comment.content_moderation = True
        comment.save()
        return Response({"message": "Comment reported successfully"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

@api_view(['PUT'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def approve_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    board = post.board
    
    if board.creator != request.user and not request.user.is_lecturer:
        return Response({"error": "You are not authorized to approve this post."}, status=status.HTTP_403_FORBIDDEN)

    post.content_moderation = False
    post.save()
    return Response({"message": "Post approved successfully."}, status=status.HTTP_200_OK)


@api_view(['PUT'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def approve_comment(request, post_id, comment_id):
    comment = get_object_or_404(Comment, id=comment_id, post_id=post_id)
    board = comment.post.board
    
    if board.creator != request.user and not request.user.is_lecturer:
        return Response({"error": "You are not authorized to approve this comment."}, status=status.HTTP_403_FORBIDDEN)

    comment.content_moderation = False
    comment.save()
    return Response({"message": "Comment approved successfully."}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ai_flagged_moderation(request, board_id):
    posts = Post.objects.filter(board_id=board_id, content_moderation=True)
    comments = Comment.objects.filter(post__board_id=board_id, content_moderation=True)

    post_serializer = PostSerializer(posts, many=True)
    comment_serializer = CommentSerializer(comments, many=True)

    return Response({
        'flagged_posts': post_serializer.data,
        'flagged_comments': comment_serializer.data,
    })



@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def search_content(request):
    query = request.data.get("query", "").strip()
    user = request.user

    if not query:
        return Response({"posts": [], "boards": []})

    search_query = SearchQuery(query)

   
    joined_board_ids = JoinedBoard.objects.filter(user=user).values_list('board_id', flat=True)

  
    posts = Post.objects.filter(board_id__in=joined_board_ids)\
        .annotate(search=SearchVector('content'))\
        .filter(search=search_query)


    boards = DiscussionBoard.objects.filter(id__in=joined_board_ids)\
        .annotate(search=SearchVector('title', 'description'))\
        .filter(search=search_query)

    post_data = PostSerializer(posts, many=True, context={'request': request}).data
    board_data = DiscussionBoardSerializer(boards, many=True).data

    return Response({"posts": post_data, "boards": board_data})