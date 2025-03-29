from django.db import models
from django.contrib.auth.models import AbstractUser

# User Model that inherit's Django's built in user authentication 
class User(AbstractUser):
    # A boolean field to differentiate between lecturers and students to manage role based access control
    is_lecturer = models.BooleanField(default=False) # False if user is a student, True if lecturer


    def __str__(self):
        return self.username # Returns username when the object is printed


# Discussion Board Model where the users can join and create posts and reply
class DiscussionBoard(models.Model):
    title = models.CharField(max_length=255) # Board title
    description = models.TextField() # Board description
    # References User model and enables deletion of related boards if user is removed
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='disc_boards') # related_name allows access to all boards created by use with user.disc_boards
    members = models.ManyToManyField(User, related_name='joined_boards', blank=True) # Many to many link to users that are members of the discussion board
    date_created = models.DateTimeField(auto_now_add=True) # Board creation timestamp
    board_image = models.ImageField(upload_to='disc_boards/', null=True, blank=True) # Images are saved to directory of 'disc_boards/' folder

    # String representation of DiscussionBoard model
    def __str__(self):
        # Returns board title
        return self.title


# Model for tracking and logging members of specific discussion boards
class JoinedBoard(models.Model):
    # Joined users
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="joined_disc_boards") 
    # Discussion boards they joined
    board = models.ForeignKey(DiscussionBoard, on_delete=models.CASCADE, related_name="joined_users") 
    # Records timestamp the user joined
    date_joined = models.DateTimeField(auto_now_add=True) 

    # Prevents a user from joining the same board multiple times
    class Meta:
        unique_together = ('user', 'board') 

    # Returns the user and their joined board
    def __str__(self):
        return f"{self.user.username} joined {self.board.title}"


# Model for Posts in a Discussion Board
class Post(models.Model):
    # References DiscussionBoard model and enables deletion of posts if board is removed
    board = models.ForeignKey(DiscussionBoard, on_delete=models.CASCADE, related_name='posts') 
    
    # User who created the post
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')

    # Text content or question of the post
    content = models.TextField() # Question content

    # Timestamp when post was created
    date_posted = models.DateTimeField(auto_now_add=True) 

    # Tracks users who liked this post, allowing multiple users to like it
    likes = models.ManyToManyField(User, related_name='liked_posts', blank=True) 

    # Returns the total number of post likes
    def like_count(self):
        return self.likes.count() 

    # String representation of Post model
    def __str__(self):
        return f"Posted by by {self.user.username} on {self.board.title}"


# Model for Comments on Posts with nested replies and like functionality
class Comment(models.Model):
    # The post to which this comment belongs, accessible through 'post.comments'
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments') 

    # The user who created the comment
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments') 

    # The text content of the comment
    content = models.TextField() 

    # Timestamp of when the comment was created
    date_posted = models.DateTimeField(auto_now_add=True)


    # References to a parent comment for nested replies
    parent = models.ForeignKey(  
        'self', 
        null=True, # Allows comments without a parent (top-level comments)
        blank=True, # Optional field when creating a new top-level comments
        on_delete=models.CASCADE, 
        related_name='replies'
    )

    # Users who liked the comment, accessible through 'liked_comments' on User
    likes = models.ManyToManyField(User, related_name='liked_comments', blank=True)

    # Returns the total number of likes on the comment
    def like_count(self):
        return self.likes.count()  
    
    # String representation of comment model 
    def __str__(self):
        if self.parent:
            # Returns a string to indicate the comment is a reply including author's username and parent comment ID
            return f"Reply by {self.user.username} on comment {self.parent.id}"
        
        # Returns a string to indicate the comment is a top-level comment including author's username and releated post ID
        return f"Comment by {self.user.username} on post {self.post.id}"
