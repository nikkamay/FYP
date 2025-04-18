import React from 'react';
import '../../css/searchpopup.css'; 

// Provides a popup overlay with a search bar and a list of search results for all webpages
const SearchOverlay = ({ results, onClose, onNavigate }) => {
  // If no search results are passed in, does not render anything
  if (!results) return null;

  // Post and board results are extracted from the response and if missing, an empty array is returned
  const { posts = [], boards = [] } = results;

  return (
    // Background overlay and clicking it closes the popup
    <div className="searchBackdrop" onClick={onClose}>

    {/* The main popup for the search results and click events are prevented from closing overlay */}
    <div className="searchBody" onClick={(e) => e.stopPropagation()}>

     {/*Closes the popup with X button */}
    <div className="closeBox">
      <button className="closeBoxBtn" onClick={onClose}>X</button>
    </div>

        {/* Section showing the matched discussion boards */}
        <h3>Discussion Boards</h3>
        {boards.length > 0 ? (
          // Loops through each of the boards in the result to display
          boards.map(board => (
            // Navigates to the discussion board page
            <div key={board.id} className="boardResult" onClick={() => onNavigate(`/discussion-board-info/${board.id}`)}>
              <strong>{board.title}</strong>
              <p>{board.description}</p>
            </div>
          ))
        ) : (
           // If no board matches the search query
          <p>No boards found.</p>
        )}

        {/* Section showing the matched posts*/}
        <h3>Posts</h3>
        {posts.length > 0 ? (
          posts.map(post => (
            <div key={post.id} className="boardResult" onClick={() => onNavigate(`/discussion-board-info/${post.board}`)}>
              <p>{post.content}</p>
              <span className="search-meta">By {post.username} • {new Date(post.date_posted).toLocaleDateString()}</span>
            </div>
          ))
        ) : (
          // If no posts matches the search query
          <p>No posts found.</p>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;
