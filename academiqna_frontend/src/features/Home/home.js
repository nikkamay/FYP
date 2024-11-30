import React, { useState, useEffect } from 'react'; 
import '../../css/home.css';
import userImg from '../../images/profile.png'; // User profile default icon


// Main homepage displaying easy access to joined discussion boards and posts
function Home() {

    // State variables to store and update lists fetched from API
    const [boards, updBoards] = useState([]); // Storing board topic
    const [posts, updPosts] = useState([]); // Storing posts

    // Fetching data when loaded into DOM
    useEffect(() => {
        // Fetches discussion boards from API
        fetch('http://127.0.0.1:8000/api/api/discussion-boards/')
            .then((response) => response.json()) // JSON conversion
            .then((data) => updBoards(data)) // Refreshes boards with retrieved data
            .catch((error) => console.error('Error fetching discussion boards:', error))

        // Fetches posts from API
        fetch('http://127.0.0.1:8000/api/api/posts/')
            .then((response) => response.json())  // JSON conversion
            .then((data) => updPosts(data)) // Refreshes posts with retrieved data
            .catch((error) => console.error('Error fetching posts:', error));
    }, []); // Empty dependency array to only fetch on inital render 

    return (
        <div className="homeContainer">

            {/* Head nav bar with search bar and user profile */}
            <header className="headerBar">
                <h1 className="appLogo">AcademiQ&A</h1>
                <input
                    type="text"
                    className="searchBox"
                    placeholder="Search Discussion Boards"
                />
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
                            <li><a href="/boards">Joined Boards</a></li>
                            <li><a href="/boards">Discussion Boards</a></li>
                        </ul>
                    </nav>
                </aside>

                {/* Featured joined boards section*/}
                <div className="mainArea">
                    <section className="boardContainer">
                        {/* Dynamically render list of boards*/}
                        {boards.map((board) => (
                            <div key={board.id} className="boardBox">
                                {/* Board image fetched from API*/}
                                <img
                                    src={board.board_image} 
                                    alt={board.title}
                                    className="boardImage" 
                                />

                                <h3>{board.title}</h3>
                            </div>
                        ))}
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
                                        <button className="answerBtn">💬</button>
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
