import React, { useState } from 'react';
import axios from 'axios';
import '../../css/login.css';
import { useNavigate } from "react-router-dom"; 



function Login() {
  // Set state variables for user input and current state of app tracking
    const [username, updateUsername] = useState(""); // Storing inputted username
    const [password, updatePassword] = useState(""); // Storing inputted password
    const [statMsg, updStatMsg] = useState(""); // Storing error or success verification messages
    const [loading, updLoading] = useState(false); // Shows if login request is processing
  
    // React Router hook to navigate to other routes or pages
    const navigating = useNavigate(); 
  
    // Function to manage the form for logging in
    const loginUser = async (e) => {
      e.preventDefault();
  
      // Validating that input fields are not empty
      if (!username || !password) {
        updStatMsg("Username and password are required.");
        return;
      }
  
      // Activating loading statte to indicate login process has started
      updLoading(true);
      // Clears previous status message to display relevant messages
      updStatMsg("");
  
      try {
        // Send the inputted credentials to backend as login request
        const response = await axios.post("http://127.0.0.1:8000/api/login/", {
          username,
          password,
        });
  
        // Backend response checking
        if (response.status === 200 && response.data.statMsg === "Login successful!") {
          // Input fields clearing
          updateUsername("");
          updatePassword("");
          // When login is successful, it navigates user to homepage
          navigating("/home");
        } else {
          // Error message displayed when login is unsuccessful 
          updStatMsg("Invalid username or password");
        }
        // Handling more errors
      } catch (error) {
        if (error.response) {
          // Error in backend
          updStatMsg(error.response.data.error || "Invalid username or password");
        } else if (error.request) {
          // Server did not give any responses
          updStatMsg("Try again, failed to connect to the server");
        } else {
          updStatMsg("ERROR");
        }
      } finally {
        updLoading(false);
      }
    };
  
    // Login page layout render
    return (
      <div className="loginContainer">
        
        <div className="loginImg"></div>
        {/* Form for entering login credentials */}
        <div className="loginForm">
          <h1>AcademiQ&A?</h1>
          <form onSubmit={loginUser}>
            <div className="inputContainer">
              <input
                type="text"
                placeholder="Username"
                value={username} // Links the username value to username state variablle for syncing
                onChange={(e) => updateUsername(e.target.value)} // Updating username state when input is modified
                required 
              />
            </div>
            <div className="inputContainer">
              <input
                type="password"
                placeholder="Password"
                value={password} // Links the password value to password state variablle for syncing
                onChange={(e) => updatePassword(e.target.value)} // Updating password state when input is modified
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {/*Loading state is displayed */}
              {loading ? "Logging in" : "Login"} 
            </button>
          </form>
          {/* Feedback message to show status and error messages*/}
          {statMsg && <p className="msg">{statMsg}</p>}
          <p className="signingUp">
            Don't have an account? <a href="/signup">Sign up</a>
          </p>
        </div>
      </div>
    );
  }
  //
  export default Login;