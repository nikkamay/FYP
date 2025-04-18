// Importing react and hooks
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
// DiscBoardInfo.js style
import "../../css/discboardinfo.css";
// Import navigation function
import { useNavigate } from 'react-router-dom'; 
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
// Import profile and search components
import ProfileDropdown  from '../Profile/profiledropdown';
import SearchOverlay from '../Search/searchcontent';
import ManageBoardModal  from '../DiscussionBoard/manageboardmodal';

//Discussion board info page displaying board content
function DiscBoardInfo() {

  // State variables to store and update lists fetched from API

  // Discussion board and post state variables
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");

  
// Comment and replies
  const [comments, setComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [showCommentBox, setShowCommentBox] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});
  const [expandedComments, setShowAllComments] = useState({});

  const [showManageModal, setShowManageModal] = useState(false);


  const [showMembersList, setShowMembersList] = useState(false);
  const [members, setMembers] = useState([]); // Members of the board

  // User-related state variables
  const [userProfile, setUserProfile] = useState(null);
  const userToken = localStorage.getItem("authToken");
  const navigate = useNavigate()

  // Sweetalert initialisation
  const swal = withReactContent(Swal);

 // Search functionality
  const [searchInput, setSearchInput] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);
  const [isSearchOpen, setSearchOpen] = useState(false);

  // Post sorting state variable
  const [sortOption, setSortOption] = useState("recent");
  


  
  const fetchBoardDetails = useCallback(() => {
    fetch(`http://127.0.0.1:8000/api/api/discussion-boards/${boardId}/`, {
      headers: { Authorization: `Token ${userToken}` },
    })
      .then((response) => response.json())
      .then((data) => setBoard(data))
      .catch((error) => console.error("Error fetching discussion board:", error));
  }, [boardId, userToken]);

  const fetchComments = useCallback((postId) => {
    fetch(`http://127.0.0.1:8000/api/api/posts/${postId}/comments/`, {
      headers: { Authorization: `Token ${userToken}` },
    })
      .then((response) => response.json())
      .then((data) => {
        setComments((prevComments) => ({
          ...prevComments,
          [postId]: data,
        }));
      })
      .catch((error) => console.error("Error fetching comments:", error));
  }, [userToken]);

  useEffect(() => {
    if (!boardId) {
      console.error("No boardId provided!");
      return;
    }
    fetchBoardDetails();  

    

    fetch(`http://127.0.0.1:8000/api/api/posts/${boardId}/`, {
      headers: { Authorization: `Token ${userToken}` },
    })
      .then((response) => response.json())
      .then((data) => {
        setPosts(data.reverse());
        data.forEach((post) => fetchComments(post.id));
      })
      .catch((error) => console.error("Error fetching posts:", error));

      fetch('http://127.0.0.1:8000/api/api/profile/', {
        headers: { Authorization: `Token ${userToken}` },
      })
      .then((response) => response.json())
      .then((data) => {
        setUserProfile(data); 
      })
      .catch((error) => console.error("Error fetching profile:", error));
  }, [boardId, userToken,fetchComments,fetchBoardDetails]);



  const postSubmit = () => {
    if (!newPost.trim()) return;
  
   
    fetch('http://127.0.0.1:8000/api/api/moderate/', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${userToken}`,
      },
      body: JSON.stringify({ text: newPost }),
    })
    .then(response => response.json())
    .then(groqResult => {
     
      const flagged = groqResult.results[0].flagged;
      
      
      fetch(`http://127.0.0.1:8000/api/api/posts/${boardId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${userToken}`,
        },
        body: JSON.stringify({ content: newPost, content_moderation: flagged }),
      })
      .then((response) => response.json())
      .then((data) => {
        setPosts((prevPosts) => [data, ...prevPosts]);
        setNewPost("");
      })
      .catch((error) => console.error("Error posting:", error));
    })
    .catch((error) => console.error("Error moderating:", error));
  };

  const commentSubmit = (postId, parentId = null) => {
    const targetId = parentId || postId;
    if (!newComments[targetId]?.trim()) return;
  
    
    fetch('http://127.0.0.1:8000/api/api/moderate/', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${userToken}`,
      },
      body: JSON.stringify({ text: newComments[targetId] }),
    })
      .then(response => response.json())
      .then(groqResult => {
        const flagged = groqResult.results[0].flagged; 
  
      
        fetch(`http://127.0.0.1:8000/api/api/posts/${postId}/comments/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${userToken}`,
          },
          body: JSON.stringify({ 
            content: newComments[targetId], 
            parent: parentId,
            content_moderation: flagged,   
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            fetchComments(postId); // Refresh comments
  
            setNewComments((prev) => ({ ...prev, [targetId]: "" }));
            setShowCommentBox((prev) => ({ ...prev, [targetId]: false }));
          })
          .catch((error) => console.error("Error posting comment:", error));
      })
      .catch((error) => console.error("Error moderating comment:", error));
  };
  

  const toggleCommentBox = (postId, parentId = null) => {
    setShowCommentBox((prev) => ({
      ...prev,
      [parentId || postId]: !prev[parentId || postId],
    }));
  };

  const toggleShowComments = (postId) => {
    setShowAllComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };
  // Like or unlike a post depending on current state
  const likePost = (postId) => {
    // Send POST request to backend like endpoint for specific post
    fetch(`http://127.0.0.1:8000/api/api/posts/${postId}/like/`, {
      method: "POST",
      headers: { Authorization: `Token ${userToken}` },
    })
      .then((response) => response.json())
      .then((data) => {
        // Update post in local state with latest post like info
        setPosts((prevPosts) => // Keep posts for all other posts unchanged
          prevPosts.map((post) =>
            post.id === postId
              ? { ...post, 
                like_count: data.like_count, // Sets like count from backend
                liked_by_user: data.liked, // Marked as liked or unlike
                downvoted_by_user: false, // clears existing downvote 
                downvote_count: post.downvote_count > 0 ? post.downvote_count - 1 : 0 // adjust count visually 
               }
              : post // No changes to the post
          )
        );
      })
      .catch((error) => console.error("Error liking post:", error));
  };
  // Like or unlike a comment depending on current state
  const likeComment = (commentId, postId) => {
    // Send POST request to backend like endpoint for specific comment
    fetch(`http://127.0.0.1:8000/api/api/posts/${postId}/comments/${commentId}/like/`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Token ${userToken}` 
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to like comment");
        }
        return response.json();
      })
      .then((data) => {
         // Update the comment state based on latest comment like info
        setComments((prevComments) => ({ 
          ...prevComments, // Keep comments for all other posts unchanged
          [postId]: prevComments[postId].map((comment) =>
            // Check if it's the main comment
            comment.id === commentId
              ? { ...comment, 
                like_count: data.like_count, // Sets new like count from backend
                liked_by_user: data.liked } // Mark as liked or unlike
              : {
                  ...comment,
                  replies: comment.replies.map((reply) =>
                    reply.id === commentId
                      ? { ...reply, 
                        like_count: data.like_count, // update like count for reply
                        liked_by_user: data.liked, 
                        downvoted_by_user: false, // clears existing downvote 
                        downvote_count: reply.downvote_count > 0 ? reply.downvote_count - 1 : 0 // adjust count visually 
                      
                      } // update like status for reply
                      : reply
                  ),
                }
          ),
        }));
      })
      .catch((error) => console.error("Error liking comment:", error));
  };
  // Applies same logic as likePost but for downvotes instead
  const downvotePost = (postId) => {
    fetch(`http://127.0.0.1:8000/api/api/posts/${postId}/downvote/`, {
      method: "POST",
      headers: { Authorization: `Token ${userToken}` },
    })
      .then((response) => response.json())
      .then((data) => {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? { ...post, 
                downvote_count: data.downvote_count, 
                downvoted_by_user: data.downvoted,
                liked_by_user: false,
                like_count: post.like_count > 0 ? post.like_count - 1 : 0}
              : post
          )
        );
      })
      .catch((error) => console.error("Error downvoting post:", error));
  };
  // Applies same logic as likeComment but for downvotes instead
  const downvoteComment = (commentId, postId) => {
    fetch(`http://127.0.0.1:8000/api/api/posts/${postId}/comments/${commentId}/downvote/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${userToken}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setComments((prevComments) => ({
          ...prevComments,
          [postId]: prevComments[postId].map((comment) =>
            comment.id === commentId
              ? { ...comment, 
                downvote_count: data.downvote_count, 
                downvoted_by_user: data.downvoted,
                liked_by_user: false,
                like_count: comment.like_count > 0 ? comment.like_count - 1 : 0,

               }
              : {
                  ...comment,
                  replies: comment.replies.map((reply) =>
                    reply.id === commentId
                      ? { ...reply, 
                        downvote_count: data.downvote_count, 
                        downvoted_by_user: data.downvoted,
                        liked_by_user: false, 
                        like_count: reply.like_count > 0 ? reply.like_count - 1 : 0,
                       }
                      : reply
                  ),
                }
          ),
        }));
      })
      .catch((error) => console.error("Error downvoting comment:", error));
  };
  
  const summarizePosts = () => {
    const threads = posts.map((post) => ({
      post: post.content,
      comments: comments[post.id]?.map(comment => ({
        username: comment.username,
        content: comment.content
      })) || []
    }));
  
    fetch("http://127.0.0.1:8000/api/api/summarize/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${userToken}`,
      },
      body: JSON.stringify({ threads }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.summary) {
          navigate('/summary', { state: { summaryText: data.summary, board } });
        } else {
          swal.fire('No Summary', 'No summary was generated', 'info');
        }
      })
      .catch((err) => {
        console.error("Error during summarization:", err);
        swal.fire('Error', 'Failed to generate summary', 'error');
      });
  };
  
  const sortedPosts = [...posts].sort((a, b) => {
    if (sortOption === "mostLiked") {
      return b.like_count - a.like_count;
    } else if (sortOption === "mostDownvoted") {
      return b.downvote_count - a.downvote_count;
    } else {
      return new Date(b.date_posted) - new Date(a.date_posted); 
    }
  });
  
  
  // Render all comments and nested replies recursively under a post
  const renderComments = (postId, comments, isReply = false) => {
    return comments.flatMap((comment) => [
      // Each comment is placed inside a dv with class "commentTile"
      // If isReply is true, adds class "reply" for different styling
      <div 
        key={comment.id} 
        className={`commentTile ${isReply ? "reply" : ""}`}
      >
        <div className="postHeader">
          <div className="postUser">
          {comment.userImg ? (
              <img 
                src={`http://127.0.0.1:8000${comment.userImg}`} 
                alt="User" 
                className="postUserImg" 
              />
            ) : (
              <i className="fa-solid fa-circle-user fallbackIcon"></i>
            )}
            <h3 className="postUserName">{comment.username}</h3>
          </div>

          <div className="postHeaderRight">
            <div className="postActionsDropdown">
              <button className="dropdownToggle">
                <i className="fa-solid fa-ellipsis"></i>
              </button>
              <div className="dropdownContent">
                {userProfile && (
                  <>
                    {(comment.username === userProfile.username || board.creator === userProfile.id) && (
                      <>
                        <button onClick={() => editComment(postId, comment)}>Edit</button>
                        <button onClick={() => deleteComment(postId, comment.id)}>Delete</button>
                      </>
                    )}
                    {comment.username !== userProfile.username && (
                      <button onClick={() => reportComment(postId, comment.id)}>Report</button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>



          
        </div>
        {/* Timestamp of when comment was posted */}
        <p className="timestamp">{new Date(comment.date_posted).toLocaleString()}</p>
        {/* Main comment content/text */}
        <p className="postContent">{comment.content}</p>
        {/* Action buttons to upvote, downvote or reply to the comment*/}
        <div className="postButtons">
          <button 
            className={`likeBtn ${comment.liked_by_user ? "liked" : ""}`}  
            onClick={() => likeComment(comment.id, postId)}
          > {/* Heart icon changes if comment is liked */}
             <i className={comment.liked_by_user ? "fas fa-heart" : "far fa-heart"}></i>  {comment.like_count > 0 ? comment.like_count : ""}
          </button>
          <button
            className={`dislikeBtn ${comment.downvoted_by_user ? "disliked" : ""}`}
            onClick={() => downvoteComment(comment.id, postId)}// Thumbs down icon changes if comment is downvoted
          >
            <i className={comment.downvoted_by_user ? "fas fa-thumbs-down" : "far fa-thumbs-down"}></i> 
          </button>


          <button className="commentBtn" onClick={() => toggleCommentBox(postId, comment.id)}><i className="fa-regular fa-comment"></i></button>
        </div>
        {/* Shows reply input box if comment’s reply toggle is active*/}
        {showCommentBox[comment.id] && (
          <div className="commentSection nestedComment">
            <textarea 
              className="commentInput" 
              placeholder="Reply..."
              value={newComments[comment.id] || ""}
              onChange={(e) => setNewComments((prev) => ({ ...prev, [comment.id]: e.target.value }))} 
            />
            <button className="commentSubmit" onClick={() => commentSubmit(postId, comment.id)}>Reply</button>
          </div>
        )}
      {/* View Replies toggle button to show/hide nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <button 
            className="viewRepliesBtn" 
            onClick={() => setExpandedReplies((prev) => ({ ...prev, [comment.id]: !prev[comment.id] }))}
          >
            {expandedReplies[comment.id] ? "Hide Replies" : `View Replies (${comment.replies.length})`}
          </button>
        )}
      </div>,
      // renderComments being recursively called is replies are expanded
      expandedReplies[comment.id] && comment.replies.length > 0
        ? renderComments(postId, comment.replies, true)
        : null
    ]);
  };

  const fetchMembers = () => {
    fetch(`http://127.0.0.1:8000/api/api/discussion-boards/${boardId}/members/`, {
      
      headers: { Authorization: `Token ${userToken}` },
    })
      .then((response) => response.json())
      .then((data) => setMembers(data))
      .catch((error) => console.error("Error fetching members:", error));
  };

  const removeMember = (userId) => {
    swal.fire({
      title: 'Remove Member?',
      text: 'Are you sure you want to remove this member?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove'
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`http://127.0.0.1:8000/api/api/discussion-boards/${boardId}/members/${userId}/`, {
          method: "DELETE",
          headers: {
            Authorization: `Token ${userToken}`,
          },
        })
        .then((response) => {
          if (response.ok) {
            swal.fire('Removed!', 'The member has been removed.', 'success');
            fetchMembers(); 
          } else {
            swal.fire('Error', 'Failed to remove member', 'error');
          }
        })
        .catch((error) => {
          console.error("Error removing member:", error);
          swal.fire('Error', 'Something went wrong', 'error');
        });
      }
    });
  };
  // Enables deletion of posts with sweetalert confirmation
  const deletePost = (postId) => {
    swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        // Send delete request to the backend to remove post
        fetch(`http://127.0.0.1:8000/api/api/posts/${postId}/delete/`, {
          method: "DELETE",
          headers: {
            Authorization: `Token ${userToken}`,
          },
        })
          .then((response) => {
            if (response.ok) {
              // Post is removed, update the posts list
              setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
              swal.fire('Deleted!', 'Your post has been deleted', 'success');
            } else {
              swal.fire('Error', 'Failed to delete post.', 'error');
            }
          })
          .catch((error) => {
            console.error("Error deleting post:", error);
            swal.fire('Error', 'Something went wrong', 'error');
          });
      }
    });
  };
   // Enables editing of posts with sweetalert prompt
  const editPost = (post) => {
    swal.fire({
      title: 'Edit your post',
      input: 'textarea',
      inputLabel: 'Post Content',
      inputValue: post.content, // Shows current post content in textarea
      inputPlaceholder: 'Input your updated post here...',
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      // Update request is sent when user confirms and input is valid
      if (result.isConfirmed && result.value.trim() !== "") {
        fetch(`http://127.0.0.1:8000/api/api/posts/${post.id}/edit/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${userToken}`,
          },
          body: JSON.stringify({ content: result.value }),
        })
          .then((response) => {
            if (response.ok) {
              setPosts((prevPosts) =>
                prevPosts.map((p) =>
                  p.id === post.id ? { ...p, content: result.value } : p
                )
              );
              swal.fire('Updated!', 'Your post has been updated', 'success');
            } else {
              swal.fire('Error', 'Failed to update post.', 'error');
            }
          })
          .catch((error) => {
            console.error("Error updating post:", error);
            swal.fire('Error', 'Something went wrong', 'error');
          });
      }
    });
  };
  // Sends a report request to backend to flag specific post for moderation
  const reportPost = (postId) => {
    fetch(`http://127.0.0.1:8000/api/api/posts/${postId}/report/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${userToken}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          swal.fire('Reported!', 'Your report has been submitted', 'success');
         // Flags and updates the post as reported by setting content moderation to true
          setPosts((prevPosts) =>
            prevPosts.map((post) =>
              post.id === postId ? { ...post, content_moderation: true } : post
            )
          );
        } else {
          throw new Error('Failed to report post');
        }
      })
      .catch((error) => {
        console.error("Error reporting post:", error);
        swal.fire('Error', 'Something went wrong', 'error');
      });
  };
// Applies same logic as reportPost but for comments
  const reportComment = (postId, commentId) => {
    fetch(`http://127.0.0.1:8000/api/api/posts/${postId}/comments/${commentId}/report/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${userToken}`,
      },
    })
      .then((response) => {
        if (response.ok) {
          swal.fire('Reported!', 'Your report has been submitted.', 'success');

          setComments((prevComments) => ({
            ...prevComments,
            [postId]: prevComments[postId].map((comment) =>
              comment.id === commentId
                ? { ...comment, content_moderation: true }
                : {
                    ...comment,
                    replies: comment.replies.map((reply) =>
                      reply.id === commentId
                        ? { ...reply, content_moderation: true }
                        : reply
                    ),
                  }
            ),
          }));
        } else {
          throw new Error('Failed to report comment');
        }
      })
      .catch((error) => {
        console.error("Error reporting comment:", error);
        swal.fire('Error', 'Something went wrong.', 'error');
      });
  };
  
// Enables editing of comment with sweetalert prompt
  const editComment = (postId, comment) => {
    swal.fire({
      title: 'Edit your comment',
      input: 'textarea',
      inputLabel: 'Comment Content',
      inputValue: comment.content,
      inputPlaceholder: 'Input your updated comment here...',
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed && result.value.trim() !== "") {
        fetch(`http://127.0.0.1:8000/api/api/posts/${postId}/comments/${comment.id}/edit/`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${userToken}`,
          },
          body: JSON.stringify({ content: result.value }),
        })
          .then((response) => {
            if (response.ok) {
              fetchComments(postId); 
              swal.fire('Updated!', 'Your comment has been updated', 'success');
            } else {
              swal.fire('Error', 'Failed to update comment', 'error');
            }
          })
          .catch((error) => {
            console.error("Error updating comment:", error);
            swal.fire('Error', 'Something went wrong', 'error');
          });
      }
    });
  };
  // Applies same logic as deletePost but for comments
  const deleteComment = (postId, commentId) => {
    swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`http://127.0.0.1:8000/api/api/posts/${postId}/comments/${commentId}/delete/`, {
          method: "DELETE",
          headers: {
            Authorization: `Token ${userToken}`,
          },
        })
          .then((response) => {
            if (response.ok) {
              fetchComments(postId); // Refresh comments
              swal.fire('Deleted!', 'Your comment has been deleted', 'success');
            } else {
              swal.fire('Error', 'Failed to delete comment', 'error');
            }
          })
          .catch((error) => {
            console.error("Error deleting comment:", error);
            swal.fire('Error', 'Something went wrong', 'error');
          });
      }
    });
  };
  // Search request to backend and results are displayed in popup
  const search = () => {
    // Empty input and whitespace validation
    if (!searchInput.trim()) return;
    // Post search query to backend
    fetch("http://127.0.0.1:8000/api/api/search/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${userToken}`,
        },
        body: JSON.stringify({ query: searchInput }),
    })
    .then(res => res.json())
    .then(data => {
      // Store the returned search results and response include posts and boards that match the query
      setFilteredResults(data); 
      // Opens the popup to display the results
      setSearchOpen(true);
    })
    .catch(err => console.error("Search failed:", err));
};
  
  
  


  if (!board) return <p>Loading Discussion Board...</p>;

  return (
    <div className="discussionBoardContainer">
      <header className="headerBar">
        <h1 className="appLogo">AcademiQ&A</h1>
            <div className="middleContainer">
                <div className="searchContainer">
                    <input
                      type="text"
                      className="searchBox"
                      placeholder="Search Posts or Boards"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && search()}
                    />
                    <button className="searchBtn" onClick={search}>
                      <i className="fa fa-search"></i>
                    </button>
                  </div>
                </div>

                <ProfileDropdown />
              </header>

      <div className="mainSec">
        <aside className="sideNav">
          <nav>
            <ul>
              <li>
                <a href="/home">
                  <i className="fa-solid fa-house"></i> Home
                </a>
              </li>
              <li>
                <a href="/joined-boards">
                  <i className="fa-solid fa-users"></i> Joined Boards
                </a>
              </li>
              <li>
                <a href="/discussion-boards">
                  <i className="fa-solid fa-comments"></i> Discussion Boards
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        <div className="mainArea">
          <div className="boardHeader">
            {userProfile !== null && board !== null && userProfile.id === board.creator && (
            <div className="boardActions">
              <button className="manageBoardBtn" onClick={() => setShowManageModal(true)}>
                 Manage Board
              </button>
              <button 
                className="moderationBtn" 
                onClick={() => navigate(`/moderation/${boardId}`)}
                style={{ marginTop: '10px' }}
              >
                Moderate Content
              </button>
            </div>
          )}

          
            {board.board_image ? (
              <img src={`http://127.0.0.1:8000${board.board_image}`} alt={board.title} className="boardImageHeader" />
            ) : (
              <div className="noImage">No Image Available</div>
            )}
            <h2 className="boardTitle">{board.title}</h2>
          </div>

          <div className="askContainer">
            <input type="text" className="askInput" placeholder="Ask a question!" value={newPost} onChange={(e) => setNewPost(e.target.value)} />
            <button className="askButton" onClick={postSubmit}>ASK</button>
          </div>

          <div className="postsContainer">
          <button className="summarizeBtn" onClick={summarizePosts}>
            Summarize Discussion Board
          </button>

          <div className="sortContainer">
            <button className="sortButton">Sort</button>
            <div className="sortDropdown">
              <div onClick={() => setSortOption("recent")}>Recent</div>
              <div onClick={() => setSortOption("mostLiked")}>Most Liked</div>
              <div onClick={() => setSortOption("mostDownvoted")}>Most Downvoted</div>
            </div>
          </div>
          

          

          {sortedPosts.map((post) => (
              <div key={post.id} className="postTile">
                <div className="postHeader">
                  <div className="postHeaderLeft">
                    <div className="postUser">
                    {post.userImg ? (
                      <img 
                        src={`http://127.0.0.1:8000${post.userImg}`} 
                        alt="User" 
                        className="postUserImg" 
                      />
                    ) : (
                      <i className="fa-solid fa-circle-user fallbackIcon"></i>
                    )}
                      <h3 className="postUserName">{post.username}</h3>
                    </div>
                  </div>


                  <div className="postHeaderRight">
                    {userProfile && (
                      <div className="postActionsDropdown">
                        <button className="dropdownToggle">
                          <i className="fa-solid fa-ellipsis"></i>
                        </button>
                        <div className="dropdownContent">
                          {(post.username === userProfile.username || board.creator === userProfile.id) && (
                            <>
                              <button onClick={() => editPost(post)}>Edit</button>
                              <button onClick={() => deletePost(post.id)}>Delete</button>
                            </>
                          )}
                          {post.username !== userProfile.username && (
                            <button onClick={() => reportPost(post.id)}>Report</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              <p className="timestamp">{new Date(post.date_posted).toLocaleString()}</p>

                <p className="postContent">{post.content}</p>
                <div className="postButtons">
                <button
                  className={`likeBtn ${post.liked_by_user ? "liked" : ""}`}  
                  onClick={() => likePost(post.id)}
                >
                  <i className={post.liked_by_user ? "fas fa-heart" : "far fa-heart"}></i> {post.like_count > 0 ? post.like_count : ""}
                </button>

                <button
                  className={`dislikeBtn ${post.downvoted_by_user ? "disliked" : ""}`}
                  onClick={() => downvotePost(post.id)}
                >
                  <i className={post.downvoted_by_user ? "fas fa-thumbs-down" : "far fa-thumbs-down"}></i>
                </button>
                  <button className="commentBtn" onClick={() => toggleCommentBox(post.id)}><i className="fa-regular fa-comment"></i></button>
                </div>

                {showCommentBox[post.id] && (
                  <div className="commentSection">
                    <textarea className="commentInput" placeholder="Comment..."
                      value={newComments[post.id] || ""}
                      onChange={(e) => setNewComments((prev) => ({ ...prev, [post.id]: e.target.value }))} />
                    <button className="commentSubmit" onClick={() => commentSubmit(post.id)}>Reply</button>
                  </div>
                )}

              {comments[post.id] && comments[post.id].length > 0 && (
                <>
                  {comments[post.id].length > 1 && (
                    <button className="viewCommentsBtn" onClick={() => toggleShowComments(post.id)}>
                      {expandedComments[post.id] ? "Hide Comments" : `View Comments (${comments[post.id].length})`}
                    </button>
                  )}

                  {(expandedComments[post.id] || comments[post.id].length === 1) && (
                    <div className="commentsList">
                      {renderComments(post.id, comments[post.id])}
                    </div>
                  )}
                </>
              )}



              </div>
            ))}
          </div>
        </div>
      </div>


      
      <ManageBoardModal
        showManageModal={showManageModal}
        setShowManageModal={setShowManageModal}
        fetchMembers={fetchMembers}
        setShowMembersList={setShowMembersList}
        showMembersList={showMembersList}
        setShowMembersListFalse={() => setShowMembersList(false)}
        members={members}
        removeMember={removeMember}
        board={board}
        userToken={userToken}
        fetchBoardDetails={fetchBoardDetails} 
      />

      {isSearchOpen && (
        <SearchOverlay
          results={filteredResults} // Contains posts and boards that are matched
          onClose={() => setSearchOpen(false)} // Closes the search popup
          onNavigate={navigate} // Navigate to selected post or board user has clicked
        />
      )}
    </div>


    
  );
}

export default DiscBoardInfo;
