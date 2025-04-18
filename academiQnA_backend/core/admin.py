from django.contrib import admin
from .models import User, DiscussionBoard, Post



# Custom Admin Panel for DiscussionBoard
class DiscussionBoardAdmin(admin.ModelAdmin):

    list_display = ('title', 'creator', 'date_created','display_members')  # Show important fields
    search_fields = ('title', 'creator__username')  # Search by title and creator

    filter_horizontal = ('members',)
    def display_members(self, obj):
        return ", ".join([member.username for member in obj.members.all()])
    display_members.short_description = 'Members'

# Adds Post, User, DiscussionBoard model to admin interface
admin.site.register(User)
admin.site.register(Post)
admin.site.register(DiscussionBoard, DiscussionBoardAdmin)  # Register with custom admin
