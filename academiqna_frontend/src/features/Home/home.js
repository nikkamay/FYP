// Importing react and hooks
import React, { useState, useEffect} from 'react';
// Import navigation function
import { useNavigate } from "react-router-dom";
// Home.js style
import '../../css/home.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
// Import profile and search components
import ProfileDropdown  from '../Profile/profiledropdown';
import SearchOverlay from '../Search/searchcontent';


// Main homepage displaying easy access to joined discussion boards and posts
function Home() {

    // State variables to store and update lists fetched from API

    // User-related state variables
    const [userProfile, setUserProfile] = useState(null);
    const userToken = localStorage.getItem("authToken"); 
    const navigate = useNavigate(); 

    // Discussion board and post state variables
    const [boards, setBoards] = useState([]); 
    const [joinedBoards, setJoinedBoards] = useState([]); 
    const [posts, setPosts] = useState([]); 

    // Post sorting state variable
    const [sortOption, setSortOption] = useState("recent");

    // Comment and replies
    const [comments, setComments] = useState({}); 
    const [newComments, setNewComments] = useState({}); 
    const [commentBox, setCommentBox] = useState({}); 
    const [expandedComments, setExpandedComments] = useState({});
    const [expandedReplies, setExpandedReplies] = useState({});

    // Search functionality
    const [searchInput, setSearchInput] = useState("");
    const [filteredResults, setFilteredResults] = useState([]);
    const [isSearchOpen, setSearchOpen] = useState(false);

    // Sweetalert initialisation
    const swal = withReactContent(Swal);
    
    // Fetch data on page load
    useEffect(() => {
        // Unauthorized access is prevented
        if (!userToken) {
          swal.fire({
            icon: "warning",
            title: "Access Denied",
            text: "Please log in to access this page",
          });
            return;
        }

        // Fetch logged in user's profile
        if (userToken) {
            fetch("http://127.0.0.1:8000/api/api/profile/", {
              headers: { Authorization: `Token ${userToken}` },
            })
              .then((response) => response.json())
              .then((data) => {
                // Saving user profile in state
                setUserProfile(data);
              })
              .catch((error) => console.error("Error fetching profile:", error));
          }

        // Retrieves all discussion boards available from API
        fetch('http://127.0.0.1:8000/api/api/discussion-boards/', {
            headers: { Authorization: `Token ${userToken}` },
        })
        .then((response) => response.json()) // JSON conversion
        .then((data) => setBoards(data)) // Refreshes boards with retrieved data

        .catch((error) => console.error('Error fetching discussion boards:', error));

        // Retrieves user's list of joined discussion boards
        fetch('http://127.0.0.1:8000/api/joined-boards/', {
            headers: { Authorization: `Token ${userToken}` },
        })
        .then((response) => response.json())
        .then((data) => setJoinedBoards(data.map(board => board.id))) 
        .catch((error) => console.error('Error fetching joined boards:', error));

        // Fetches joined board posts from API
        fetch('http://127.0.0.1:8000//api/api/joined-posts/', {
            headers: { Authorization: `Token ${userToken}` },
        })
        .then((response) => response.json())  // JSON conversion
        .then((data) => {
            setPosts(data);  // Refreshes posts with retrieved data
            // Fetch comments
            data.forEach((post) => retrieveComments(post.id));
        })
        .catch((error) => console.error('Error fetching posts:', error));


        
      }, [userToken]); // Re-runs when userToken changes

    // Render all comments and nested replies recursively under a post
    const renderComments = (postId, comments, isReply = false) => {
        return comments.flatMap((comment) => [
          // Each comment is placed inside a dv with class "commentTile"
          // If isReply is true, adds class "reply" for different styling
          <div key={comment.id} className={`commentTile ${isReply ? "reply" : ""}`}>
            
            {/* Comment content with user image, username, dropdown actions */}
            <div className="commentHeader">
              <div className="commentHeaderLeft">
              {comment.userImg ? (
                  <img 
                    src={`http://127.0.0.1:8000${comment.userImg}`} 
                    alt="User" 
                    className="postUserImg" 
                  />
                ) : (
                  <i className="fa-solid fa-circle-user fallbackIcon"></i>
                )}
                <div>
                  <h3 className="postUserName">{comment.username}</h3>
                </div>
              </div>


              {/* Right-side dropdown menu with edit, delete, report actions */}
              <div className="commentHeaderRight">
                <div className="postActionsDropdown">
                  <button className="dropdownToggle">
                    <i className="fa-solid fa-ellipsis"></i>
                  </button>
                  <div className="dropdownContent">
                    {userProfile && (
                      <>
                        {comment.username === userProfile.username ? (
                          // If user is the owner of the comment, enables edit and delete
                          <>
                            <button onClick={() => editComment(postId, comment)}>Edit</button>
                            <button onClick={() => deleteComment(postId, comment.id)}>Delete</button>
                          </>
                        ) : posts.find(p => p.id === postId)?.board_creator === userProfile.id ? (
                          // If user is the board creator but not the owner of the comment, enables edit, delete, report 
                          <>
                            <button onClick={() => editComment(postId, comment)}>Edit</button>
                            <button onClick={() => deleteComment(postId, comment.id)}>Delete</button>
                            <button onClick={() => reportComment(postId, comment.id)}>Report</button>
                          </>
                        ) : (
                            // If user is not the owner of the comment or the board creator, only enables report
                          <> 
                            <button onClick={() => reportComment(postId, comment.id)}>Report</button>
                          </>
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
                    className={`upvoteBtn ${comment.liked_by_user ? "liked" : ""}`}
                    onClick={() => likeComment(comment.id, postId)}
                    > {/* Heart icon changes if comment is liked */}
                    <i className={comment.liked_by_user ? "fas fa-heart" : "far fa-heart"}></i> {comment.like_count > 0 ? comment.like_count : ""}
                    </button>

                    <button 
                        className={`downvoteBtn ${comment.downvoted_by_user ? "disliked" : ""}`}
                        onClick={() => downvoteComment(comment.id, postId)}
                        > {/* Thumbs down icon changes if comment is downvoted */}
                        <i className={comment.downvoted_by_user ? "fas fa-thumbs-down" : "far fa-thumbs-down"}></i>
                        </button>

                <button className="answerBtn" onClick={() => toggleReplyInput(postId, comment.id)}>
                    <i className="fa-regular fa-comment-dots"></i> Reply
                </button>
                </div>
      
            {/* Shows reply input box if comment’s reply toggle is active*/}
            {commentBox[`comment-${comment.id}`] && (
              <div className="commentSection nestedComment">
                <textarea
                  className="commentInput"
                  placeholder="Reply..."
                  value={newComments[`comment-${comment.id}`] || ""}
                  onChange={(e) => setNewComments((prev) => ({ ...prev, [`comment-${comment.id}`]: e.target.value }))}
                />
                <button className="commentSubmit" onClick={() => submitComment(postId, comment.id)}>Reply</button>
              </div>
            )}
      
            {/* View Replies toggle button to show/hide nested replies */}
            {comment.replies && comment.replies.length > 0 && (
              <button
                className="viewRepliesBtn"
                onClick={() => setExpandedReplies((prev) => ({
                  ...prev,
                  [comment.id]: !prev[comment.id]
                }))}
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

    // Retrieves all comments for a given post
    const retrieveComments = (postId) => {
        fetch(`http://127.0.0.1:8000/api/api/posts/${postId}/comments/`, {
            headers: { Authorization: `Token ${userToken}` },
        })
        .then((response) => response.json())
        // Update comment state 
        .then((data) => {
            setComments((prevComments) => ({
                ...prevComments, // Keep existing comments
                [postId]: data  // Add new comments for the post
            }));
        })
        // Log error during fetching comments
        .catch((error) => console.error("Error fetching comments:", error));
    };

    // Submits new comment on a specific post or reply to another comment
    const submitComment = (postId, parentId = null) => {
      // Checks if comment is top level or reply
      const commentInputKey = parentId ? `comment-${parentId}` : `post-${postId}`;

      // If input is empty, return without submitting
      if (!newComments[commentInputKey]?.trim()) return;
  
      // Enables moderation on the submitted content and sends to moderation endpoint before saving
      fetch('http://127.0.0.1:8000/api/api/moderate/', {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${userToken}`,
          },
          // Sends the text comment content to moderation
          body: JSON.stringify({ text: newComments[commentInputKey] }),
      })
      .then(response => response.json())
      .then(groqResult => {
        // Extract whether comment is flagged via moderation of Groq prompt
          const flagged = groqResult.results[0]?.flagged || false;
  
          // Submit the comment to backend with moderation flag
          return fetch(`http://127.0.0.1:8000/api/api/posts/${postId}/comments/`, {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  Authorization: `Token ${userToken}`,
              },
              body: JSON.stringify({
                  content: newComments[commentInputKey], // Comment text
                  parent: parentId || null, // Set parent if it's a reply
                  content_moderation: flagged, // Flagged status is saved
              }),
          });
      })
      .then((response) => response.json())
      .then((data) => {
        // Refresh comments after submitting a new comment
          retrieveComments(postId);
          // After submitting a new comment, clears the input field
          setNewComments((prev) => ({ ...prev, [commentInputKey]: "" }));
          // Comment or reply box is closed
          setCommentBox((prev) => ({ ...prev, [commentInputKey]: false }));
      })
      .catch((error) => console.error("Error moderating or posting comment:", error));
  };
    
    // Manages the comment box state of showing and hiding replies
    const toggleReplyInput = (postId, parentId = null) => {
      // identifies the inpux for reply or top level comment
        const replyToggleKey = parentId ? `comment-${parentId}` : `post-${postId}`;
        // Toggles the input reply box visibility
        setCommentBox((prev) => ({
            ...prev, // Current comment/reply state
            [replyToggleKey]: !prev[replyToggleKey], // Toggle visibility for reply or top level comment
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
          headers: { Authorization: `Token ${userToken}` },
        })
          .then((response) => response.json())
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
                      ...comment, // if not, check its replies
                      replies: comment.replies.map((reply) =>
                        reply.id === commentId
                          ? { ...reply, 
                            like_count: data.like_count, // update like count for reply
                            liked_by_user: data.liked, // update like status for reply
                            downvoted_by_user: false, // clears existing downvote 
                            downvote_count: reply.downvote_count > 0 ? reply.downvote_count - 1 : 0 // adjust count visually 
                          } 
                          : reply // No changes to the reply
                      ),
                    }
              )
            }));
          })
          .catch((error) => console.error("Error liking comment:", error));
    };
    // Enables editing of posts with sweetalert prompt
    const editPost = (post) => {
        swal.fire({
          title: "Edit your post",
          input: "textarea",
          inputValue: post.content, // Shows current post content in textarea
          showCancelButton: true,
          confirmButtonText: "Save",
          preConfirm: (newContent) => {
            // Validate to check that input is not empty
            if (!newContent.trim()) {
              swal.showValidationMessage("Content cannot be empty");
            }
            return newContent;
          },
        }).then((result) => {
          // Update request is sent when user confirms and input is valid
          if (result.isConfirmed && result.value) {
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
                  // Update the content to reflect edit change
                  setPosts((prevPosts) =>
                    prevPosts.map((p) =>
                      p.id === post.id ? { ...p, content: result.value } : p
                    )
                  );
                  swal.fire("Edited!", "Your post was updated", "success");
                } else {
                  throw new Error("Failed to edit post.");
                }
              })
              // Error handling for edit post request
              .catch((error) => {
                console.error("Error editing post:", error);
                swal.fire("Error", "Could not edit the post", "error");
              });
          }
        });
    };
    
    // Enables deletion of posts with sweetalert confirmation
    const deletePost = (postId) => {
        swal.fire({
          title: "Delete Post?",
          text: "This action cannot be undone",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          confirmButtonText: "Yes, delete it!",
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
                  swal.fire("Deleted!", "Your post was removed", "success");
                } else {
                  throw new Error("Failed to delete post");
                }
              })
              .catch((error) => {
                console.error("Error deleting post:", error);
                swal.fire("Error", "Could not delete the post", "error");
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
    // Enables editing of comment with sweetalert prompt
    const editComment = (postId, comment) => {
        swal.fire({
          title: "Edit your comment",
          input: "textarea",
          inputValue: comment.content,
          showCancelButton: true,
          confirmButtonText: "Save",
          preConfirm: (newContent) => {
            if (!newContent.trim()) {
              swal.showValidationMessage("Content cannot be empty");
            }
            return newContent;
          },
        }).then((result) => {
          if (result.isConfirmed && result.value) {
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
                  retrieveComments(postId); 
                  swal.fire("Edited!", "Comment successfully updated", "success");
                } else {
                  throw new Error("Failed to edit comment");
                }
              })
              .catch((error) => {
                console.error("Error editing comment:", error);
                swal.fire("Error", "Could not edit the comment", "error");
              });
          }
        });
    };
    // Applies same logic as deletePost but for comments
    const deleteComment = (postId, commentId) => {
        swal.fire({
          title: "Delete Comment?",
          text: "This action cannot be undone",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          confirmButtonText: "Yes, delete it!",
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
                  retrieveComments(postId);
                  swal.fire("Deleted!", "Comment removed successfully", "success");
                } else {
                  throw new Error("Failed to delete comment");
                }
              })
              .catch((error) => {
                console.error("Error deleting comment:", error);
                swal.fire("Error", "Could not delete the comment", "error");
              });
          }
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
            swal.fire('Reported!', 'Your report has been submitted', 'success');
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
        swal.fire('Error', 'Something went wrong', 'error');
    });
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
                  ? { ...post, downvote_count: 
                    data.downvote_count, 
                    downvoted_by_user: data.downvoted,
                    liked_by_user: false,
                    like_count: post.like_count > 0 ? post.like_count - 1 : 0 // 
                   }
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
                    like_count: comment.like_count > 0 ? comment.like_count - 1 : 0, }
                  : {
                      ...comment,
                      replies: comment.replies.map((reply) =>
                        reply.id === commentId
                          ? { ...reply, 
                            downvote_count: data.downvote_count, 
                            downvoted_by_user: data.downvoted,
                            liked_by_user: false,
                            like_count: reply.like_count > 0 ? reply.like_count - 1 : 0,  }
                          : reply
                      ),
                    }
              ),
            }));
          })
          .catch((error) => console.error("Error downvoting comment:", error));
      };

      // Search request to backend and results are displayed in popup
      const search = () => {
        // Empty input and whitespace validation
        if (!searchInput.trim()) 
          return;
        // Post search query to backend
        fetch("http://127.0.0.1:8000/api/api/search/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${userToken}`,
            },
            // User input is sent
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


    return (
        <div className="homeContainer">

            {/* Head nav bar with search bar and user profile */}
            <header className="headerBar">
                <h1 className="appLogo">AcademiQ&A</h1>
                <div className="middleContainer">
                   {/* Search bar for posts and discussion boards */}
                  <div className="searchContainer">
                    <input
                      type="text"
                      className="searchBox"
                      placeholder="Search Posts or Boards"
                      value={searchInput}
                      // Text is updated on input
                      onChange={(e) => setSearchInput(e.target.value)} 
                      // When enter key or search button is pressed, search is triggered
                      onKeyDown={(e) => e.key === "Enter" && search()}
                    />
                    <button className="searchBtn" onClick={search}>
                      <i className="fa fa-search"></i>
                    </button>
                  </div>
                </div>
                  {/* Profile dropdown for user profile and logout */}
                <ProfileDropdown />
              </header>

            
            {/* Layout for main section with sidebar and content */}
            <div className="mainSec">

                {/* Sidebar with links to navigate to other pages */}
                <aside className="sideNav">
                    <nav>
                    <ul>
                      <li>
                        <a href="/home">
                          <i className="fa-solid fa-house"></i>
                          Home
                        </a>
                      </li>
                      <li>
                        <a href="/joined-boards">
                          <i className="fa-solid fa-users" ></i>
                          Joined Boards
                        </a>
                      </li>
                      <li>
                        <a href="/discussion-boards">
                          <i className="fa-solid fa-comments" ></i>
                          Discussion Boards
                        </a>
                      </li>
                    </ul>

                    </nav>
                </aside>

                {/* Featured joined boards section*/}
                <div className="mainArea">
                  <h2 className="jBoards">Featured Joined Boards</h2>
                  <div className="scrollWrapperHome">
                    <div
                      className="boardContainerHome">
                      
                      {/* Displays only the boards the user joined */}
                      {boards
                        .filter(board => joinedBoards.includes(board.id))
                        .map((board) => (
                          <div
                            key={board.id}
                            className="boardBoxHome"
                            onClick={() => navigate(`/discussion-board-info/${board.id}`)}
                          >
                            <img
                              src={board.board_image}
                              alt={board.title}
                              className="boardImageHome"
                            />
                            <h3>{board.title}</h3>
                          </div>
                        ))}

                      {/* Notifies if the user has joined no boards */}
                      {boards.length > 0 &&
                        joinedBoards.length > 0 &&
                        boards.filter(board => joinedBoards.includes(board.id)).length === 0 && (
                          <p style={{ paddingLeft: "10px" }}>
                            You haven't joined any discussion boards.
                          </p>
                        )}
                    </div>
                  </div>
                  

                    
                    {/* Displaying the posts from joined boards */}
                    <section className="postContainer">
                      {/* Dropdown menu for sorting posts */}
                      <div className="sortContainer">
                        <button className="sortButtonHome">Sort by</button>
                        <div className="sortDropdown">
                          <div onClick={() => setSortOption("recent")}>Recent</div>
                          <div onClick={() => setSortOption("most_liked")}>Most Liked</div>
                          <div onClick={() => setSortOption("most_downvoted")}>Most Downvoted</div>
                        </div>
                      </div>
                        {/* Dynamically render list of posts*/}
                        {posts.length > 0 ? (
                            [...posts].sort((a, b) => {
                              // Sort logic depending on selected option
                              if (sortOption === "most_liked") {
                                return b.like_count - a.like_count;
                              } else if (sortOption === "most_downvoted") {
                                return b.downvote_count - a.downvote_count;
                              } else {
                                // The default is the most recent posts
                                return new Date(b.date_posted) - new Date(a.date_posted); 
                              }
                            }).map((post) => (
                                <div key={post.id} className="postTile">
                                  <h3>{post.board_title}</h3>
                                  {/* Post header including user information and dropdown options */}
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
                                        <div>
                                          <h3 className="postUserName">{post.username}</h3>
                                          <p className="timestamp">{new Date(post.date_posted).toLocaleString()}</p>
                                        </div>
                                      </div>
                                    </div>
                                    {/* Dropdown for edit, delete and report options */}
                                    <div className="postHeaderRight">
                                      <div className="postActionsDropdown">
                                        <button className="dropdownToggle">
                                          <i className="fa-solid fa-ellipsis"></i>
                                        </button>
                                        <div className="dropdownContent">
                                          {userProfile && (
                                            <>
                                              {post.username === userProfile.username ? (
                                                // // If user is the owner of the post, enables edit and delete
                                                <>
                                                  <button onClick={() => editPost(post)}>Edit</button>
                                                  <button onClick={() => deletePost(post.id)}>Delete</button>
                                                </>
                                              ) : post.board_creator === userProfile.id ? (
                                                // // If user is the board creator but not the owner of the post, enables edit, delete, report 
                                                <>
                                                  <button onClick={() => editPost(post)}>Edit</button>
                                                  <button onClick={() => deletePost(post.id)}>Delete</button>
                                                  <button onClick={() => reportPost(post.id)}>Report</button>
                                                </>
                                              ) : (
                                                 // If user is not the owner of the post or the board creator, only enables report
                                                <>
                                                  <button onClick={() => reportPost(post.id)}>Report</button>
                                                </>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Post content */}
                                  <p className="postDetails">{post.content}</p>
                              
                                   {/* Post buttons for like, downvote, comment, applies same functionality as comments with changing button appearance */}
                                  <div className="postButtons">
                                    <button
                                        className={`upvoteBtn ${post.liked_by_user ? "liked" : ""}`}
                                        onClick={() => likePost(post.id)}
                                    >
                                        <i className={post.liked_by_user ? "fas fa-heart" : "far fa-heart"}></i> {post.like_count > 0 && post.like_count}
                                    </button>

                                        <button
                                            className={`downvoteBtn ${post.downvoted_by_user ? "disliked" : ""}`}
                                            onClick={() => downvotePost(post.id)}
                                            >
                                            <i className={post.downvoted_by_user ? "fas fa-thumbs-down" : "far fa-thumbs-down"}></i>
                                            </button>

                                <button className="answerBtn" onClick={() => toggleReplyInput(post.id)}>
                                    <i className="fa-regular fa-comment-dots"></i>
                                </button>
                                </div>
                              
                                   {/* Comment input box when triggered */}
                                  {commentBox[`post-${post.id}`] && (
                                    <div className="commentSection">
                                      <textarea
                                        className="commentInput"
                                        placeholder="Write a comment..."
                                        value={newComments[`post-${post.id}`] || ""}
                                        onChange={(e) => setNewComments((prev) => ({ ...prev, [`post-${post.id}`]: e.target.value }))}
                                      />
                                      <button
                                        className="commentSubmit"
                                        onClick={() => submitComment(post.id)}
                                      >
                                        Comment
                                      </button>
                                    </div>
                                  )}
                              
                                  {/* Show comments and replies if existing */}
                                  <div className="commentsList">
                                    {comments[post.id] && comments[post.id].length > 0 && (
                                      <>
                                       {/* Toggle visibility for multiple comments */}
                                        {comments[post.id].length > 1 && (
                                          <button
                                            className="viewCommentsBtn"
                                            onClick={() => setExpandedComments((prev) => ({
                                              ...prev,
                                              [post.id]: !prev[post.id]
                                            }))}
                                          >
                                            {expandedComments[post.id] ? "Hide Comments" : `View Comments (${comments[post.id].length})`}
                                          </button>
                                        )}
                                         {/* Render visible comments */}
                                        {(expandedComments[post.id] || comments[post.id].length === 1) && (
                                          renderComments(post.id, comments[post.id])
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))
                        ) : (
                            <p>Join a discussion board to review questions!</p>
                        )}
                    </section>
                </div>
            </div>
            {/* If search was requested, popup is displayed with filtered results */}
            {isSearchOpen && (
              <SearchOverlay
                results={filteredResults} // Contains posts and boards that are matched
                onClose={() => setSearchOpen(false)} // Closes the search popup
                onNavigate={navigate}  // Navigate to selected post or board user has clicked
              />
            )}
        </div>
    );
}
//
export default Home;
