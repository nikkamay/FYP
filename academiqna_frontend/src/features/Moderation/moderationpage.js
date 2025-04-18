import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "../../css/moderationpage.css"; 
import ProfileDropdown from "../Profile/profiledropdown";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import SearchOverlay from '../Search/searchcontent';


function ModerationPage() {
  const { boardId } = useParams();
  const [reportedPosts, setReportedPosts] = useState([]);
  const [reportedComments, setReportedComments] = useState([]);
  const [board, setBoard] = useState(null);
  const userToken = localStorage.getItem("authToken");
  const [flaggedPosts, setFlaggedPosts] = useState([]);
  const [flaggedComments, setFlaggedComments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const redirect = useNavigate(); 
  
  const MySwal = withReactContent(Swal);

  const fetchBoardDetails = useCallback(() => {
    fetch(`http://127.0.0.1:8000/api/api/discussion-boards/${boardId}/`, {
      headers: { Authorization: `Token ${userToken}` },
    })
      .then((response) => response.json())
      .then((data) => setBoard(data))
      .catch((error) => console.error("Error fetching discussion board:", error));
  }, [boardId, userToken]);

  const fetchModerationData = () => {
    fetch(`http://127.0.0.1:8000/api/api/moderation/${boardId}/`, {
      headers: { Authorization: `Token ${userToken}` },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unauthorized or error fetching moderation data.");
        }
        return response.json();
      })
      .then((data) => {
        setReportedPosts(data.reported_posts || []);
        setReportedComments(data.reported_comments || []);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };
  

  useEffect(() => {
    if (!boardId) return;

    fetchBoardDetails();

    fetch(`http://127.0.0.1:8000/api/api/moderation/${boardId}/`, {
      headers: { Authorization: `Token ${userToken}` },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unauthorized or error fetching moderation data.");
        }
        return response.json();
      })
      .then((data) => {
        setReportedPosts(data.reported_posts || []);
        setReportedComments(data.reported_comments || []);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }, [boardId, userToken, fetchBoardDetails]);

  const approvePost = (postId) => {
    fetch(`http://127.0.0.1:8000/api/api/posts/${postId}/approve/`, {
      method: "PUT",
      headers: {
        Authorization: `Token ${userToken}`,
      },
    })
      .then(response => {
        if (response.ok) {
          fetchModerationData(); // Refresh moderation list
          MySwal.fire('Approved!', 'The post has been approved.', 'success');
        } else {
          throw new Error('Failed to approve post.');
        }
      })
      .catch(error => {
        console.error('Error approving post:', error);
      });
  };
  
  const approveComment = (postId, commentId) => {
    fetch(`http://127.0.0.1:8000/api/api/posts/${postId}/comments/${commentId}/approve/`, {
      method: "PUT",
      headers: {
        Authorization: `Token ${userToken}`,
      },
    })
      .then(response => {
        if (response.ok) {
          fetchModerationData(); // Refresh moderation list
          MySwal.fire('Approved!', 'The comment has been approved.', 'success');
        } else {
          throw new Error('Failed to approve comment.');
        }
      })
      .catch(error => {
        console.error('Error approving comment:', error);
      });
  };

  const deletePost = (postId) => {
    fetch(`http://127.0.0.1:8000/api/api/posts/${postId}/delete/`, {
      method: "DELETE",
      headers: {
        Authorization: `Token ${userToken}`,
      },
    })
      .then(response => {
        if (response.ok) {
          fetchModerationData();
          MySwal.fire('Deleted!', 'The post has been deleted.', 'success');
        } else {
          throw new Error('Failed to delete post.');
        }
      })
      .catch(error => {
        console.error('Error deleting post:', error);
      });
  };
  
  const deleteComment = (postId, commentId) => {
    fetch(`http://127.0.0.1:8000/api/api/posts/${postId}/comments/${commentId}/delete/`, {
      method: "DELETE",
      headers: {
        Authorization: `Token ${userToken}`,
      },
    })
      .then(response => {
        if (response.ok) {
          fetchModerationData();
          MySwal.fire('Deleted!', 'The comment has been deleted.', 'success');
        } else {
          throw new Error('Failed to delete comment.');
        }
      })
      .catch(error => {
        console.error('Error deleting comment:', error);
      });
  };

  const fetchFlaggedData = () => {
    fetch(`http://127.0.0.1:8000/api/api/moderation/ai/${boardId}/`, {
      headers: { Authorization: `Token ${userToken}` },
    })
      .then(response => response.json())
      .then(data => {
        setFlaggedPosts(data.flagged_posts || []);
        setFlaggedComments(data.flagged_comments || []);
      })
      .catch(error => {
        console.error('Error fetching flagged data:', error);
      });
  };


  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    fetch("http://127.0.0.1:8000/api/api/search/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${userToken}`,
        },
        body: JSON.stringify({ query: searchQuery }),
    })
    .then(res => res.json())
    .then(data => {
        setSearchResults(data); // {posts: [], boards: []}
        setShowSearchPopup(true);
    })
    .catch(err => console.error("Search failed:", err));
};
  




  if (!board) return <p>Loading Moderation Page...</p>;

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
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <button className="searchBtn" onClick={handleSearch}>
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

        <div className="mainArea">
          <div className="boardHeader">
            {board.board_image ? (
              <img src={`http://127.0.0.1:8000${board.board_image}`} alt={board.title} className="boardImageHeader" />
            ) : (
              <div className="noImage">No Image Available</div>
            )}
            <h2 className="boardTitle">{board.title}: Moderation</h2>
          </div>

          <div className="postsContainer">
            <h3>Reported Posts</h3>
            {reportedPosts.length === 0 ? (
              <p>No reported posts.</p>
            ) : (
              reportedPosts.map((post) => (
                <div key={post.id} className="postTile">
                  <div className="postHeader">
                    <div className="postUser">
                      <h3 className="postUserName">{post.username}</h3>
                    </div>
                  </div>
                  <p className="timestamp">{new Date(post.date_posted).toLocaleString()}</p>
                  <p className="postContent">{post.content}</p>

                  <div className="moderationButtons">
                    <button onClick={() => approvePost(post.id)}>Approve</button>
                    <button onClick={() => deletePost(post.id)}>Delete</button>
                  </div>
                </div>
              ))
            )}

            <h3>Reported Comments</h3>
            {reportedComments.length === 0 ? (
              <p>No reported comments.</p>
            ) : (
              reportedComments.map((comment) => (
                <div key={comment.id} className="commentTile">
                  <div className="postHeader">
                    <div className="postUser">
                      <h3 className="postUserName">{comment.username}</h3>
                    </div>
                  </div>
                  <p className="timestamp">{new Date(comment.date_posted).toLocaleString()}</p>
                  <p className="postContent">{comment.content}</p>

                  
                <div className="moderationButtons">
                  <button onClick={() => approveComment(comment.post, comment.id)}>Approve</button>

                  <button onClick={() => deleteComment(comment.post, comment.id)}>Delete</button>
                </div>
                </div>
                


                
              ))
            )}
          </div>
        </div>
      </div>

      {showSearchPopup && (
              <SearchOverlay
                results={searchResults}
                onClose={() => setShowSearchPopup(false)}
                onNavigate={redirect}
              />
            )}
    </div>
  );
}

export default ModerationPage;
