from django.db import models
from django.contrib.auth.models import AbstractUser

# User Model that inherit's Django's built in user authentication 
class User(AbstractUser):
    # Additional fields can be added to extended functionality
    pass


# Discussion Board Model
class DiscussionBoard(models.Model):
    title = models.CharField(max_length=255) # Board title
    description = models.TextField() # Board description
    # References User model and enables deletion of related boards if user is removed
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='disc_boards') # related_name allows access to all boards created by use with user.disc_boards
    date_created = models.DateTimeField(auto_now_add=True) # Board creation timestamp
    board_image = models.ImageField(upload_to='disc_boards/', null=True, blank=True) # Images are saved to directory of 'disc_boards/' folder

    # Conversion of DiscussionBoard model to string representation
    def __str__(self):
        # Returns board title
        return self.title


# Model for Posts in a Discussion Board
class Post(models.Model):
    # References DiscussionBoard model and enables deletion of posts if board is removed
    board = models.ForeignKey(DiscussionBoard, on_delete=models.CASCADE, related_name='posts') # Access posts with 'board.posts'
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField() # Question content
    date_posted = models.DateTimeField(auto_now_add=True) # Post created timestamp

    # Conversion of Post model to string representation
    def __str__(self):
        return f"Posted by by {self.user.username} on {self.board.title}"