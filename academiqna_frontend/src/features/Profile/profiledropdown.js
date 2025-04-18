import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import '../../css/profiledropdown.css';
import ProfileModal from "../Profile/profilemodal"; // Modal to edit user profile information


function ProfileDropdown() {
  // Stores the user's profile information
  const [userProfInfo, setUserProfInfo] = useState(null);

  // Toggles the profile dropdown
  const [profileExpanded, setProfileExpanded] = useState(false);
  
  // Shows or hides the profile edit modal
  const [editProfile, setEditProfile] = useState(false);

  // Redirects user to other pages
  const navigate = useNavigate();

  // Retrieves user's profile information
  useEffect(() => {
    getProfileInfo ();
  }, []);

  // Clears auth token and redirects to login page to logout
  const logout = () => {
    localStorage.removeItem("authToken");
    navigate("/login"); 
  };

  // Retrieves user profile from backend
  const getProfileInfo  = () => {
    const token = localStorage.getItem("authToken");
    if (token) {
      axios.get("http://127.0.0.1:8000/api/api/profile/", {
        headers: { Authorization: `Token ${token}` }
      })
      // Stores retrieved profile info
      .then(response => setUserProfInfo(response.data))
      .catch(error => console.error("Error fetching user profile:", error));
    }
  };
  // Only show dropdown if profile data is loaded
  if (!userProfInfo) return null;  


  return (
    <div className="profileDropdown">
       {/* Show if user profile image is available, else use default icon */}
    {userProfInfo.userImg ? (
      <img 
        src={`http://127.0.0.1:8000${userProfInfo.userImg}`} 
        alt="Profile"
        className="userImg"
        // Toggle dropdown
        onClick={() => setProfileExpanded(!profileExpanded)}
        style={{ cursor: 'pointer' }}
      />
    ) : (
      <i 
        className="fa-solid fa-circle-user fa-2x fallbackIcon" 
        // Toggle dropdown
        onClick={() => setProfileExpanded(!profileExpanded)}
        style={{ cursor: 'pointer'}}
      ></i>
    )}

    {/* Show dropdown menu when profileExpanded is true */}
    {profileExpanded && (
      <div className="dropdownMenu">
        <p><strong>{userProfInfo.username}</strong></p>
        <button onClick={() => setEditProfile(true)}>Profile</button>
        <button onClick={logout}>Logout</button>
      </div>
    )}
      {/* Profile modal to enable editing user info */}
    {editProfile && <ProfileModal onClose={() => {
  setEditProfile(false); // Closes modal
  getProfileInfo (); // Reloads updated profile info
}} />}
  </div>
);
}

export default ProfileDropdown;