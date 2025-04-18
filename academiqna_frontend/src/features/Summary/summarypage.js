// C:\Users\omoni\Documents\FYP\FYP\academiqna_frontend\src\features\Summary\summarypage.js
import React, { useState} from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import "../../css/discboardinfo.css"; 
import html2pdf from "html2pdf.js";
import SearchOverlay from '../Search/searchcontent';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import ProfileDropdown  from '../Profile/profiledropdown';

function SummaryPage() {
    const location = useLocation();
    const redirect = useNavigate();
    const { summaryText, board } = location.state || {};  
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchPopup, setShowSearchPopup] = useState(false);
    const userToken = localStorage.getItem("authToken"); 
  
    if (!summaryText || !board) {
      return (
        <div className="discussionBoardContainer">
          <h2>No summary found!</h2>
        </div>
      );
    }

    const downloadPDF = () => {
        const element = document.getElementById('summaryToDownload');
        const opt = {
          margin:       0.5,
          filename:     `${board.title}_Summary.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2 },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
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
              {board.board_image ? (
                <img src={`http://127.0.0.1:8000${board.board_image}`} alt={board.title} className="boardImageHeader" />
              ) : (
                <div className="noImage">No Image Available</div>
              )}
              <h2 className="boardTitle">{board.title}</h2>
            </div>
              
            <div className="downloadBtnWrapper">
            <button className="downloadBtn" onClick={downloadPDF}>
                Download Summary as PDF
            </button>
            </div>

            <div id="summaryToDownload"  className="summaryWrapper">
                <div className="summarySection">
                <h3></h3>

      
                <div className="postContent" dangerouslySetInnerHTML={{ __html: summaryText }} />

                </div>
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
  
  export default SummaryPage;
