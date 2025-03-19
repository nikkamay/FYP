// Importing react and hooks
import React, { useState, useEffect } from 'react';
// Import navigation function
import { useNavigate } from "react-router-dom";
// Home.js style
import '../../css/home.css';
// Default profile image
import userImg from '../../images/profile.png'; // User profile default icon

// Main homepage displaying easy access to joined discussion boards and posts
function Home() {

    // State variables to store and update lists fetched from API
    const [boards, updBoards] = useState([]); 
    const [joinedBoards, updJoinedBoards] = useState([]); 
    const [posts, updPosts] = useState([]); 
    const [comments, updComments] = useState({}); 
    const [newComments, updNewComments] = useState({}); 
    const [commentBox, updCommentBox] = useState({}); 
    const userToken = localStorage.getItem("authToken"); 
    const redirect = useNavigate(); 

    useEffect(() => {
        // Fetches discussion boards, joined boards and posts from API

        // Unauthorized access is prevented
        if (!userToken) {
            alert("Access denied. Login to continue.");
            return;
        }

        // Reteieves all discussion boards available from API
        fetch('http://127.0.0.1:8000/api/api/discussion-boards/', {
            headers: { Authorization: `Token ${userToken}` },
        })
        .then((response) => response.json()) // JSON conversion
        .then((data) => updBoards(data)) // Refreshes boards with retrieved data

        .catch((error) => console.error('Error fetching discussion boards:', error));

        // Retrieves user's list of joined discussion boards
        fetch('http://127.0.0.1:8000/api/joined-boards/', {
            headers: { Authorization: `Token ${userToken}` },
        })
        .then((response) => response.json())
        .then((data) => updJoinedBoards(data.map(board => board.id))) 
        .catch((error) => console.error('Error fetching joined boards:', error));

        // Fetches posts from API
        fetch('http://127.0.0.1:8000/api/api/posts/', {
            headers: { Authorization: `Token ${userToken}` },
        })
        .then((response) => response.json())  // JSON conversion
        .then((data) => {
            updPosts(data);  // Refreshes posts with retrieved data
            data.forEach((post) => retrieveComments(post.id));
        })
        .catch((error) => console.error('Error fetching posts:', error));
    }, []); // Empty dependency array to only fetch on inital render 

    // Function to retrieve comments from a specific post 
    const retrieveComments = (postId) => {
        fetch(`http://127.0.0.1:8000/api/api/posts/${postId}/comments/`, {
            headers: { Authorization: `Token ${userToken}` },
        })
        .then((response) => response.json())
        .then((data) => {
            updComments((prevComments) => ({
                ...prevComments,
                [postId]: data.map(comment => ({
                    ...comment,
                    replies: []  // Verifies each comment has an array of replies
                }))
            }));
        })
        .catch((error) => console.error("Error fetching comments:", error));
    };

    // Function to submit new entry of comment on a post or reply to another comment
    const submitComment = (postId, parentId = null) => {
        // Identifies whether it's a reply or direct comment
        const commentTarget = parentId || postId;
        // Block empty comments from being submitted
        if (!newComments[commentTarget]?.trim()) return;
    
        fetch(`http://127.0.0.1:8000/api/api/posts/${postId}/comments/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${userToken}`,
            },
            body: JSON.stringify({ 
                // Include comment text
                content: newComments[commentTarget], 
                // Set parent ID when it's a reply and mark as main comment otherwise
                parent: parentId || null  
            }),
        })
        .then((response) => response.json())
        .then((data) => {
            updComments((prevComments) => {
                const updatedComments = { ...prevComments };
    
                if (!updatedComments[postId]) {
                    updatedComments[postId] = [];
                }
    
                if (parentId) {
                    // Locates the main comment or its parent comment and inserts the new reply underneath
                    const parentIndex = updatedComments[postId].findIndex(c => c.id === parentId);
                    if (parentIndex !== -1) {
                        // Duplicate replies are prevented from being added
                        const dupCheck = updatedComments[postId].some(c => c.id === data.id);
                        if (!dupCheck) {
                            updatedComments[postId].splice(parentIndex + 1, 0, data);
                        }
                    }
                } else {
                    // Inserts top level comments and prevents duplication
                    if (!updatedComments[postId].some(c => c.id === data.id)) {
                        updatedComments[postId] = [data, ...updatedComments[postId]];
                    }
                }
                // Updated comment list returned
                return updatedComments;
            });
            // The input box is cleared and closed after comment submission
            updNewComments((prev) => ({ ...prev, [commentTarget]: "" }));
            updCommentBox((prev) => ({ ...prev, [commentTarget]: false }));
        })
        .catch((error) => console.error("Error posting comment:", error));
    };
    
    // Manages the comment box state of showing and hiding for the replies
    const toggleReply = (postId, parentId = null) => {
        updCommentBox((prev) => ({
            ...prev,
            // Toggle the visibility state
            [parentId || postId]: !prev[parentId || postId],
        }));
    };

    return (
        <div className="homeContainer">

            {/* Head nav bar with search bar and user profile */}
            <header className="headerBar">
                <h1 className="appLogo">AcademiQ&A</h1>
                <input type="text" className="searchBox" placeholder="Search Discussion Boards" />
                
               {/* User profile */}
                <img 
                src={userImg} 
                alt="Profile" 
                className="userImg" 
                />
            </header>

            
            {/* Layout for main section with sidebar and content */}
            <div className="mainSec">

                {/* Sidebar with links to navigate to other pages */}
                <aside className="sideNav">
                    <nav>
                        <ul>
                            <li><a href="/home">Home</a></li>
                            <li><a href="/joined-boards">Joined Boards</a></li>
                            <li><a href="/discussion-boards">Discussion Boards</a></li>
                        </ul>
                    </nav>
                </aside>

                {/* Featured joined boards section*/}
                <div className="mainArea">
                    <section className="boardContainer">
                        {/* Dynamically render list of boards*/}
                        {boards.filter(board => joinedBoards.includes(board.id)).length > 0 ? (
                            boards
                                .filter(board => joinedBoards.includes(board.id))
                                .map((board) => (
                                    <div key={board.id} className="boardBox" 
                                        onClick={() => redirect(`/discussion-board-info/${board.id}`)} 
                                    >  {/* Board image fetched from API*/}
                                        <img 
                                        src={board.board_image} 
                                        alt={board.title} 
                                        className="boardImage" 
                                        />
                                        <h3>{board.title}</h3>
                                    </div>
                                ))
                        ) : (
                            <p>You haven't joined any discussion boards.</p>
                        )}
                    </section>

                    
                    {/* Displaying the posts from joined boards */}
                    <section className="postContainer">
                         {/* Dynamically render list of posts*/}
                        {posts.length > 0 ? (
                            posts.map((post) => (
                                <div key={post.id} className="postTile">
                                    <h3>{post.board_title}</h3>
                                    <div className="userHeader">
                                        <img src={userImg} alt="User" className="userImg" />
                                        <p>{post.username}</p>
                                    </div>
                                    <p className="postDetails">{post.content}</p>
                                    {/* Interactivity buttons for upvote, downvote and answering questions */}
                                    <div className="postButtons">
                                        <button className="upvoteBtn">❤️</button>
                                        <button className="downvoteBtn">👎</button>
                                        <button className="answerBtn" onClick={() => toggleReply(post.id)}>💬 Reply</button>
                                    </div>

                                    {commentBox[post.id] && (
                                        <div className="commentSection">
                                            <textarea className="commentInput" placeholder="Write a comment..."
                                                value={newComments[post.id] || ""}
                                                onChange={(e) => updNewComments((prev) => ({ ...prev, [post.id]: e.target.value }))} />
                                            <button className="commentSubmit" onClick={() => submitComment(post.id)}>Reply</button>
                                        </div>
                                    )}

                                    <div className="commentsList">
                                        {comments[post.id]?.map((comment) => (
                                            <div key={comment.id} className="postTile commentTile">
                                                <div className="postUser">
                                                    <img src={userImg} alt="User" className="postUserImg" />
                                                    <h3 className="postUserName">{comment.username}</h3>
                                                </div>
                                                <p className="postContent">{comment.content}</p>
                                                <div className="postButtons">
                                                    <button className="likeBtn">❤️</button>
                                                    <button className="dislikeBtn">👎</button>
                                                    <button className="commentBtn" onClick={() => toggleReply(post.id, comment.id)}>💬 Reply</button>
                                                </div>

                                                {/* ✅ Render nested comment input box under each comment when clicked */}
                                                {commentBox[comment.id] && (
                                                    <div className="commentSection nestedComment">
                                                        <textarea className="commentInput" placeholder="Reply..."
                                                            value={newComments[comment.id] || ""}
                                                            onChange={(e) => updNewComments((prev) => ({ ...prev, [comment.id]: e.target.value }))} />
                                                        <button className="commentSubmit" onClick={() => submitComment(post.id, comment.id)}>Reply</button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                </div>
                            ))
                        ) : (
                            <p>Join a discussion board to review questions!</p>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
//
export default Home;
