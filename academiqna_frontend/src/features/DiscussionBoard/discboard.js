// Importing react and hooks
import React, { useState, useEffect } from 'react';
// Import navigation function
import { useNavigate } from "react-router-dom";
// discboard.js style
import '../../css/discboard.css';
// Import profile and search components
import ProfileDropdown  from '../Profile/profiledropdown';
import CreateBoardModal from '../DiscussionBoard/createboardmodal';  
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import SearchOverlay from '../Search/searchcontent';

// Available discussion board page displaying all discussion boards 
function DiscBoard() {
    // State variables to store and update lists fetched from API

    // Discussion board and post state variables
    const [boards, setBoards] = useState([]);
    const [joinedBoards, setJoinedBoards] = useState([]);

    const [userToken, setUserToken] = useState(localStorage.getItem('authToken'));

    const navigate = useNavigate();

     // Determines if user is a lecturer
    const [isLecturer, setIsLecturer] = useState(false);
    // Board creation state variables
    const [showModal, setShowModal] = useState(false);
    const [newBoardTitle, setNewBoardTitle] = useState('');
    const [newBoardDescription, setNewBoardDescription] = useState('');
    const [newBoardImage, setNewBoardImage] = useState(null);

    // Sweetalert initialisation
    const swal = withReactContent(Swal);

    // Search functionality
    const [searchInput, setSearchInput] = useState("");
    const [filteredResults, setFilteredResults] = useState([]);
    const [isSearchOpen, setSearchOpen] = useState(false);


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
        fetch('http://127.0.0.1:8000/api/api/profile/', {
            headers: { Authorization: `Token ${userToken}` },
        })
        .then((response) => response.json())
        .then((data) => {
            setIsLecturer(data.is_lecturer);
        })
        .catch((error) => console.error('Error fetching user profile:', error));

        // Retrieves all discussion boards available from API
        fetch('http://127.0.0.1:8000/api/api/discussion-boards/', {
            headers: { Authorization: `Token ${userToken}` },
        })
            .then((response) => response.json())
            .then((data) => setBoards(data))
            .catch((error) => console.error('Error fetching discussion boards:', error));

        // Retrieves user's list of joined discussion boards
        fetch('http://127.0.0.1:8000/api/joined-boards/', {
            headers: { Authorization: `Token ${userToken}` },
        })
            .then((response) => response.json())
            .then((data) => setJoinedBoards(data.map(board => board.id))) 
            .catch((error) => console.error('Error fetching joined boards:', error));


        
    }, [userToken]);
     // Join baord function
    const joinBoard = (boardId) => {
        fetch(`http://127.0.0.1:8000/api/join-board/${boardId}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${userToken}`,
            },
        })
            .then((response) => response.json().then(data => ({ status: response.status, body: data })))
            .then(({ status, body }) => {
                if (status === 200) {
                    // Joined successfully
                    setJoinedBoards([...joinedBoards, boardId]); 
                    // Warning as user already joined
                } else if (status === 400 && body.statMsg === "Already joined this board") {
                    swal.fire('Already Joined', 'You are already a member of this discussion board', 'info');

                } else {
                    swal.fire('Error', 'Failed to join the discussion board', 'error');
                }
            })
            .catch((error) => {
                console.error("Error joining discussion board:", error);
                swal.fire('Error', 'Could not join discussion board', 'error');
            });
    };

    // naviagtes to specific discussion board info page
    const navBoard = (boardId) => {
        navigate(`/discussion-board-info/${boardId}`);
    };

    // New board creation strictly for lecturers
    const createBoard = () => {
        // Required fields validation
        if (!newBoardTitle || !newBoardDescription) {
            swal.fire('Missing Fields', 'Please fill in both title and description.', 'warning');

            return;
        }
        // Form for data for title, description, and optional image
        const formData = new FormData();
        formData.append('title', newBoardTitle);
        formData.append('description', newBoardDescription);

        if (newBoardImage) {
            formData.append('board_image', newBoardImage);  // Only add if image exists
        }
        // Backend submission of form
        fetch('http://127.0.0.1:8000/api/api/discussion-boards/', {
            method: "POST",
            headers: {
                Authorization: `Token ${userToken}`,
            },
            body: formData,
        })
        .then(async (response) => {
            const data = await response.json();
            if (!response.ok) {
                console.error('Server responded with error:', data);
                swal.fire('Failed to Create', JSON.stringify(data), 'error');

                return;
            }
             // Update board list if successful creation and form reset
            setShowModal(false);
            setBoards(prevBoards => [...prevBoards, data]);
            setNewBoardTitle('');
            setNewBoardDescription('');
            setNewBoardImage(null);
            swal.fire('Success!', 'Discussion Board Created!', 'success');
        })
        .catch(error => {
            console.error('Error creating board:', error);
            swal.fire('Error', 'Failed to create discussion board.', 'error');
        });
    };
    // Retrieves user's list of joined discussion boards
    const search = () => {
         // Empty input and whitespace validation
        if (!searchInput.trim()) return;
        fetch("http://127.0.0.1:8000/api/api/search/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${userToken}`,
          },
           // User input is sent
          body: JSON.stringify({ query: searchInput }),
        })
          .then((res) => res.json())
          .then((data) => {
            // Store the returned search results and response include posts and boards that match the query
            setFilteredResults(data); 
            // Opens the popup to display the results
            setSearchOpen(true);
          })
          .catch((err) => console.error("Search failed:", err));
      };

    return (
        <div className="discBoardContainer">
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

                {/* Lists of board  and create button */}
                <div className="mainArea">
                    <h2 className="sectionTitle">Available Discussion Boards</h2>
                    {/* Role based access as lecturers can only create new boards */}
                    {isLecturer && (
                            <div className="createBoardButtonWrapper">
                                <button onClick={() => setShowModal(true)} className="createBoardButton">
                                    Create New Discussion Board
                                </button>
                            </div>
                        )}

                     {/* Modal for creation of new discussionboard */}
                    <CreateBoardModal
                        show={showModal}
                        onClose={() => setShowModal(false)}
                        onCreate={createBoard}
                        title={newBoardTitle}
                        setTitle={setNewBoardTitle}
                        description={newBoardDescription}
                        setDescription={setNewBoardDescription}
                        image={newBoardImage}
                        setImage={setNewBoardImage}
                    />

                    {/* Display each board in a card format */}
                    <div className="boardGrid">
                        {boards.map((board) => (
                            <div key={board.id} className="boardCard">
                                <img src={board.board_image} alt={board.title} className="boardImage" />
                                <h3>{board.title}</h3>

                                {/* Button changes depending on join status */}
                                {joinedBoards.includes(board.id) ? (
                                    <button className="joinedButton" onClick={() => navBoard(board.id)}>Joined</button>
                                ) : (
                                    <button className="joinButton" onClick={() => joinBoard(board.id)}>Join</button>
                                )}
                            </div>
                        ))}
                    </div>
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

export default DiscBoard;
