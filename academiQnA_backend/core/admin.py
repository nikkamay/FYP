from django.contrib import admin
from .models import User,DiscussionBoard, Post

# Adds User model to admin interface
admin.site.register(User)
# Adds DiscussionBoard model to admin interface
admin.site.register(DiscussionBoard)
# Adds Post model to admin interface
admin.site.register(Post)
