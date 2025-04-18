from django.test import TestCase
from rest_framework.authtoken.models import Token
from .models import DiscussionBoard, Post, Comment, JoinedBoard
from django.contrib.auth import get_user_model
User = get_user_model()


class SystemTestCase(TestCase):
    # Creating account as lecturer to grant all action priveleges for AcademiQ&A
    def setUp(self):
        self.user = User.objects.create_user(username="testLec", password="passLec", is_lecturer=True )
        self.token = Token.objects.create(user=self.user)
        self.auth = {"HTTP_AUTHORIZATION": f"Token {self.token.key}"}

        self.board = DiscussionBoard.objects.create(
            title="Board 1", description="Test", creator=self.user
        )
        self.board.members.add(self.user)

    def test_register_user(self):
         # Check if new user can register and token is returned
        response = self.client.post("/api/api/register/", {
            "username": "newuser",
            "password": "newpass123",
            "first_name": "New",
            "last_name": "User",
            "email": "newuser@mytudublin.ie"
        })
        self.assertEqual(response.status_code, 201)
        self.assertIn("token", response.json())

    def test_login_user(self):
        # Check if login works for existing user
        response = self.client.post("/api/login/", {
            "username": "testLec",
            "password": "passLec"
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.json())

    def test_create_post(self):
        # Make post to the board and check content
        response = self.client.post(f"/api/api/posts/{self.board.id}/", {
            "content": "Test system post"
        }, **self.auth)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["content"], "Test system post")

    def test_create_comment(self):
        # Add a comment to a post and confirm it was succesful 
        post = Post.objects.create(content="Test post", user=self.user, board=self.board)
        response = self.client.post(f"/api/api/posts/{post.id}/comments/", {
            "content": "Test comment"
        }, **self.auth)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["content"], "Test comment")

    def test_join_board(self):
        # Join a different board
        new_board = DiscussionBoard.objects.create(
            title="Another Board", description="...", creator=self.user
        )
        response = self.client.post(f"/api/join-board/{new_board.id}/", **self.auth)
        self.assertEqual(response.status_code, 200)

    def test_search(self):
        # Search for a specific keyword in post content
        Post.objects.create(content="Searchable post", user=self.user, board=self.board)
        response = self.client.post("/api/api/search/", {
            "query": "Searchable"
        }, **self.auth)
        self.assertEqual(response.status_code, 200)
        self.assertIn("posts", response.json())



    def test_like_and_downvote_post(self):
        # Like and downvote actions on a post
        post = Post.objects.create(content="Vote post", user=self.user, board=self.board)
        like_resp = self.client.post(f"/api/api/posts/{post.id}/like/", **self.auth)
        downvote_resp = self.client.post(f"/api/api/posts/{post.id}/downvote/", **self.auth)

        self.assertEqual(like_resp.status_code, 200)
        self.assertEqual(downvote_resp.status_code, 200)

    def test_edit_and_delete_post(self):
        # Editing and then deleting a post
        post = Post.objects.create(content="Editable post", user=self.user, board=self.board)
        edit_resp = self.client.put(f"/api/api/posts/{post.id}/edit/", {"content": "Edited!"}, content_type='application/json', **self.auth)
        delete_resp = self.client.delete(f"/api/api/posts/{post.id}/delete/", **self.auth)

        self.assertEqual(edit_resp.status_code, 200)
        self.assertEqual(delete_resp.status_code, 200)

    def test_report_post(self):
         # Report a post for moderation
        post = Post.objects.create(content="Inappropriate", user=self.user, board=self.board)
        report_resp = self.client.post(f"/api/api/posts/{post.id}/report/", **self.auth)
        self.assertEqual(report_resp.status_code, 200)

    def test_comment_edit_delete_downvote_report(self):
        # Comment actions test to edit, downvote, report, delete
        post = Post.objects.create(content="Parent", user=self.user, board=self.board)
        comment = Comment.objects.create(content="Comment", user=self.user, post=post)

        edit = self.client.put(f"/api/api/posts/{post.id}/comments/{comment.id}/edit/", {"content": "Updated"}, content_type='application/json', **self.auth)
        downvote = self.client.post(f"/api/api/posts/{post.id}/comments/{comment.id}/downvote/", **self.auth)
        report = self.client.post(f"/api/api/posts/{post.id}/comments/{comment.id}/report/", **self.auth)
        delete = self.client.delete(f"/api/api/posts/{post.id}/comments/{comment.id}/delete/", **self.auth)

        self.assertEqual(edit.status_code, 200)
        self.assertEqual(downvote.status_code, 200)
        self.assertEqual(report.status_code, 200)
        self.assertEqual(delete.status_code, 200)


    def test_edit_and_delete_board(self):
        # Test if lecturer which is a board creator can edit and delete board
        edit = self.client.put(f"/api/api/discussion-boards/{self.board.id}/", {
            "title": "Testing modification"
        }, content_type='application/json', **self.auth)

        delete = self.client.delete(f"/api/api/discussion-boards/{self.board.id}/delete/", **self.auth)

        self.assertEqual(edit.status_code, 200)
        self.assertEqual(delete.status_code, 200)

    def test_remove_member_from_board(self):
        # Remove a member from board by creator
        member = User.objects.create_user(username="student", password="passStudent")
        self.board.members.add(member)
        JoinedBoard.objects.create(user=member, board=self.board)

        remove_resp = self.client.delete(f"/api/api/discussion-boards/{self.board.id}/members/{member.id}/", **self.auth)
        self.assertEqual(remove_resp.status_code, 200)


    def test_moderation_view_and_approve(self):
        # Approve flagged post and comment
        post = Post.objects.create(content="Flagged", user=self.user, board=self.board, content_moderation=True)
        comment = Comment.objects.create(content="Flagged comment", user=self.user, post=post, content_moderation=True)

        mod_resp = self.client.get(f"/api/api/moderation/{self.board.id}/", **self.auth)
        approve_post = self.client.put(f"/api/api/posts/{post.id}/approve/", **self.auth)
        approve_comment = self.client.put(f"/api/api/posts/{post.id}/comments/{comment.id}/approve/", **self.auth)

        self.assertEqual(mod_resp.status_code, 200)
        self.assertEqual(approve_post.status_code, 200)
        self.assertEqual(approve_comment.status_code, 200)

    def test_moderation_view_and_delete(self):
        # Delete flagged post and comment from moderation queue
        post = Post.objects.create(content="Flagged for deletion", user=self.user, board=self.board, content_moderation=True)
        comment = Comment.objects.create(content="Flagged comment", user=self.user, post=post, content_moderation=True)

        # Get moderation queue
        mod_resp = self.client.get(f"/api/api/moderation/{self.board.id}/", **self.auth)

        # Delete the flagged content
        delete_comment = self.client.delete(f"/api/api/posts/{post.id}/comments/{comment.id}/delete/", **self.auth)
        delete_post = self.client.delete(f"/api/api/posts/{post.id}/delete/", **self.auth)
        

        self.assertEqual(mod_resp.status_code, 200)
        self.assertEqual(delete_post.status_code, 200)
        self.assertEqual(delete_comment.status_code, 200)


    def test_summarize_threads(self):
        # Call summarize endpoint on a post
        post = Post.objects.create(content="Summarize this", user=self.user, board=self.board)
        threads = [{"post": post.content, "comments": []}] 
        response = self.client.post("/api/api/summarize/", {"threads": threads}, content_type='application/json', **self.auth)
        self.assertIn(response.status_code, [200, 500])


    def test_not_creator_cannot_moderate(self):
        # Student user should not be able to approve flagged posts
        post = Post.objects.create(content="Flag me", user=self.user, board=self.board, content_moderation=True)
        
        # Another user tries to moderate
        other_user = User.objects.create_user(username="student", password="pass")
        token = Token.objects.create(user=other_user)
        headers = {"HTTP_AUTHORIZATION": f"Token {token.key}"}

        resp = self.client.put(f"/api/api/posts/{post.id}/approve/", **headers)
        self.assertEqual(resp.status_code, 403)


    def test_not_creator_cannot_delete_board(self):
        # Other user shouldn't be allowed to delete board
        other_user = User.objects.create_user(username="other", password="pass")
        token = Token.objects.create(user=other_user)
        headers = {"HTTP_AUTHORIZATION": f"Token {token.key}"}

        resp = self.client.delete(f"/api/api/discussion-boards/{self.board.id}/delete/", **headers)
        self.assertEqual(resp.status_code, 403)

    def test_lecturer_but_not_creator_cannot_moderate(self):
        # Another lecturer should not moderate if not creator of board
        other_lecturer = User.objects.create_user(username="lec2", password="pass", is_lecturer=True)
        token = Token.objects.create(user=other_lecturer)
        headers = {"HTTP_AUTHORIZATION": f"Token {token.key}"}

        resp = self.client.get(f"/api/api/moderation/{self.board.id}/", **headers)
        self.assertEqual(resp.status_code, 403)


