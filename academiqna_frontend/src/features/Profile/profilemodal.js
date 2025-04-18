import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../css/profilemodal.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

function ProfileModal({ onClose }) {
  // Stores user's profile information
  const [userProfInfo, setUserProfInfo] = useState(null);

  // Stores the user profile image
  const [profPic, setProfPic] = useState(null);

  // Sweetalert initialisation
  const swal = withReactContent(Swal);

  // Cureent profile info is loaded when modal loads
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      axios.get("http://127.0.0.1:8000/api/api/profile/", {
        headers: { Authorization: `Token ${token}` }
      })
      // Saving user profile in state
      .then(response => setUserProfInfo(response.data))
      .catch(error => console.error("Error fetching profile:", error));
    }
  }, []);

  // Profile image upload triggered when user selects a file
  const uploadProfPic = (e) => {
    // Selected file is stored
    setProfPic(e.target.files[0]);
  };

  // Uploads the new profile pciture and refreshes the profile data
  const saveChanges = async () => {
    const token = localStorage.getItem("authToken");
    // Unable to upload if not logged in
    if (!token) return;

    // Form data created for file upload
    const formData = new FormData();
    if (profPic) {
      // Image is attached to form data
      formData.append('userImg', profPic);
    }

    try {
      // Sends the image to the profile backend
      await axios.put("http://127.0.0.1:8000/api/api/profile/", formData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        }
      });
      // Reloads the updated profile info after uploading successfully 
    const response = await axios.get("http://127.0.0.1:8000/api/api/profile/", {
      headers: { Authorization: `Token ${token}` }
    });
    setUserProfInfo(response.data); // Update profile info in state

      // Successful upload alert displayed to user
      swal.fire({
        icon: 'success',
        title: 'Profile Updated',
        text: 'Profile has been updated successfully',
        timer: 2000,
        showConfirmButton: false,
      });
      // Modal closes after 2 seconds
      setTimeout(onClose, 2000);
    } catch (error) {
      console.error(error);
      // Error displayed if update fails
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Something went wrong with updating your profile',
      });
    }
  };
  // Only show modal if profile data is loaded
  if (!userProfInfo) return null; 

  return (
    <div
      className="modalOverlay"
      onClick={(e) => {
        // Modal closes if user clicks outside overlay
        if (e.target.className === "modalOverlay") {
          onClose();
        }
      }}
    >
      <div 
        className="modalContent"
        // Prevents modal from closing on inner clicks
        onClick={(e) => e.stopPropagation()}
      >
        <span className="closeButton" onClick={onClose}>&times;</span>
        <h1>Your Profile</h1>

         {/* Profile image or fallback icon is displayed */}
        {userProfInfo.userImg ? (
          <img 
            src={`http://127.0.0.1:8000${userProfInfo.userImg}`} 
            alt="Profile"
            className="profilePic"
          />
        ) : (
          <i className="fa-solid fa-circle-user profileDefault"></i>
        )}

        {/* Display User information on profile */}
        <div className="inputContainer">
          <p><strong>Username:</strong> {userProfInfo.username}</p>
          <p><strong>First Name:</strong> {userProfInfo.first_name}</p>
          <p><strong>Last Name:</strong> {userProfInfo.last_name}</p>
          <p><strong>Email:</strong> {userProfInfo.email}</p>
        </div>

       {/* New profile picture file input */}
        <div className="inputContainer">
          <input type="file" onChange={uploadProfPic} />
        </div>

        {/* New profile image saving */}
        <button onClick={saveChanges}>Save Changes</button>


      </div>
    </div>
  );
}

export default ProfileModal;
