// Importing react and hooks
import React, { useEffect, useState } from "react";
// Import navigation function
import { useNavigate } from "react-router-dom";
// JoinedBoards.js style
import '../../css/joinedboard.css';
// Import profile and search components
import ProfileDropdown  from '../Profile/profiledropdown';
import SearchOverlay from '../Search/searchcontent';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// Main function component for rendering joined discssion boards
function JoinedBoards() {

    // Discussion board state variable
    const [joinedBoards, setJoinedBoards] = useState([]);

    // Discussion board sorting state variable
    const [sortOption, setSortOption] = useState("latest"); 
    const userToken = localStorage.getItem("authToken");
    const navigate = useNavigate();

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
  
        // Retrieves user's list of joined discussion boards
        fetch("http://127.0.0.1:8000/api/joined-boards/", {
            headers: { Authorization: `Token ${userToken}` },
        })
        .then((response) => response.json())
        .then((data) => setJoinedBoards(data))
        .catch((error) => console.error("Error fetching joined boards:", error));
    }, []);

    // Sorting logic for joined boards
    const sortedBoards = [...joinedBoards].sort((a, b) => {
        if (sortOption === "alphabetical") { // Alphabetically sorting
            return a.title.localeCompare(b.title);
        } else if (sortOption === "latest") { // Latest joined sorting
            return new Date(b.date_joined) - new Date(a.date_joined);
        }
        return 0;
    });

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
        .then((response) => response.json())
        .then((data) => {
            // Store the returned search results and response include posts and boards that match the query
            setFilteredResults(data); 
            // Opens the popup to display the results
            setSearchOpen(true);
        })
        .catch((error) => {
            console.error("Search error:", error);
            swal.fire("Error", "Failed to fetch search results", "error");
        });
    };

    return (
        <div className="joinedBoardsContainer">
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
                            <li><a href="/home"><i className="fas fa-house"></i> Home</a></li>
                            <li><a href="/joined-boards"><i className="fa-solid fa-users"></i> Joined Boards</a></li>
                            <li><a href="/discussion-boards"><i className="fas fa-comments"></i> Discussion Boards</a></li>
                        </ul>
                    </nav>
                </aside>

                <div className="mainArea">
                  <h2 className="sectionTitle">Your Joined Boards</h2>

                    {/* Sorting dropdown */}
                  <div className="sortContainer">
                    <button className="sortButton">Sort</button>
                    <div className="sortDropdown">
                        <div onClick={() => setSortOption("latest")}>Latest Joined</div>
                        <div onClick={() => setSortOption("alphabetical")}>Alphabetical (A-Z)</div>
                    </div>
                    </div>

                  <section className="boardContainer">
                  {/* Checking if there are existing boards to display*/}
                      {sortedBoards.length > 0 ? (
                          sortedBoards.map((board) => (
                              <div 
                                  key={board.id} 
                                  className="boardBox" 
                                  // Navigates to the specific discussion board
                                  onClick={() => navigate(`/discussion-board-info/${board.id}`)}
                              >
                                  <img 
                                      src={board.board_image ? `http://127.0.0.1:8000${board.board_image}` : "default-image.png"} 
                                      alt={board.title} 
                                      className="boardImage" 
                                  />
                                  <h3>{board.title}</h3>
                              </div>
                          ))
                      ) : ( // Notifies user if no baords are joined
                          <p className="noBoardsMessage">You have not joined any discussion boards yet.</p>
                      )}
                  </section>
              </div>

            </div>

            {isSearchOpen && (
                <SearchOverlay
                    results={filteredResults}
                    onClose={() => setSearchOpen(false)}
                    onNavigate={(path) => {
                        setSearchOpen(false);
                        navigate(path);
                    }}
                />
            )}
        </div>
    );
}

export default JoinedBoards;
