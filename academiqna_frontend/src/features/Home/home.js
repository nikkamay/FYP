import React, { useState, useEffect } from 'react'; 
import '../../css/home.css';
import userImg from '../../images/profile.png'; // User profile default icon
import board1 from '../../images/board1.jpg'; // Course board images
import board2 from '../../images/board2.jpg';
import board3 from '../../images/board3.jpg';

// Test db before PostgreSQL
const test = [
    { id: 1, title: 'Object Oriented Programming', image: board1 },
    { id: 2, title: 'Rich Web Applications', image: board2 },
    { id: 3, title: 'Forensics', image: board3 },
    { id: 4, title: 'Image Processing', image: board1 },
    { id: 5, title: 'Machine Learning', image: board2 },
    { id: 6, title: 'Test', image: board3 },
    { id: 7, title: 'Test', image: board1 },
];

function Home() {
    const [boards, updBoards] = useState([]); // Storing board topic


    useEffect(() => {
        // Fills in the boards from test_db
        updBoards(test);
    }, []);

    return (
        <div className="homeContainer">

            {/* Head nav bar with search bar and user profile */}
            <header className="headerBar">
                <h1 className="appLogo">AcademiQ&A?</h1>
                <input
                    type="text"
                    className="searchBox"
                    placeholder="Search Discussion Boards"
                />
                <img
                    src={userImg}
                    alt="Profile"
                    className="userImg"
                />
            </header>


            {/* Layout for main section with sidebar and content */}
            <div className="mainSec">


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
                        {boards.map((board) => (
                            <div key={board.id} className="boardBox">
                                <img src={board.image} alt={board.title} />
                                <h3>{board.title}</h3>
                            </div>
                        ))}
                    </section>


                     {/* Displaying the posts from joined boards */}
                    <section className="postContainer">
                        <div className="postTile">
                            <h3>Object Oriented Programming</h3>
                            <div className="userHeader">
                                <img src={userImg} alt="User" className="userImg" />
                                <p>Student Name</p>
                            </div>
                            <p className="postDetails">
                                Labore cupidatat dolore pariatur dolore consectetur commodo est ad laboris aliquip. Nulla amet pariatur adipisicing non qui elit Lorem sint. Lorem laboris officia non eiusmod ad Lorem non irure. Est aute non cillum aliquip aliquip eu magna exercitation sunt. Reprehenderit id ea incididunt nostrud minim qui.
                            </p>
                            <div className="postButtons">
                                <button className="upvoteBtn">❤️</button>
                                <button className="downvoteBtn">👎</button>
                                <button className="answerBtn">💬</button>
                            </div>
                        </div>

                 
                    </section>
                </div>
            </div>
        </div>
    );
}

export default Home;
