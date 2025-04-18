import React, { useState } from 'react';
import axios from 'axios';
import '../../css/login.css';
import '../../css/signupmodal.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';


function SignupModal({ onClose }) {
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [isLecturer, setIsLecturer] = useState(false);
    const [loading, setLoading] = useState(false);
    const sweetAl = withReactContent(Swal);
  
    const signupUser = async (e) => {
        e.preventDefault();
      
        if (!username || !firstName || !lastName || !email || !password || !confirmPwd) {
          sweetAl.fire({
            icon: 'warning',
            title: 'Incomplete Form',
            text: 'Please fill in all fields.',
          });
          return;
        }
      
        if (password !== confirmPwd) {
          sweetAl.fire({
            icon: 'error',
            title: 'Password Mismatch',
          });
          return;
        }
      

        if (!email.endsWith('@mytudublin.ie') && !email.endsWith('@tudublin.ie')) {
          sweetAl.fire({
            icon: 'error',
            title: 'Invalid Email',
            text: 'Email must end with @mytudublin.ie or @tudublin.ie.',
          });
          return;
        }
      
        setLoading(true);

        try {
          const response = await axios.post("http://127.0.0.1:8000/api/api/register/", {
            username,
            first_name: firstName,
            last_name: lastName,
            email,
            password,
            is_lecturer: isLecturer
          });
      
          if (response.status === 201) {
            sweetAl.fire({
              icon: 'success',
              title: 'Account Created',
              text: 'You can now log in.',
              showConfirmButton: false,
              timer: 2000,
            });
            setTimeout(onClose, 2000);
          }
        } catch (error) {
          sweetAl.fire({
            icon: 'error',
            title: 'Signup Failed',
            text: 'Username may already exist or something went wrong.',
          });
        } finally {
          setLoading(false);
        }
      };
  
    return (
      <div className="signupBG" onClick={onClose}>
        <div className="signupContent" onClick={(e) => e.stopPropagation()}>
          <span className="closeBtn" onClick={onClose}>&times;</span>
          <h1>Sign Up</h1>
          <form onSubmit={signupUser}>
            <div className="signupField">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="signupField">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="signupField">
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className="signupField">
              <input
                type="email"
                placeholder="University Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="signupField">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="signupField">
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                required
              />
            </div>
            <div className="signupField">
            <label>
                <input
                type="checkbox"
                checked={isLecturer}
                onChange={() => setIsLecturer(!isLecturer)}
                />
                I am a lecturer
            </label>
            </div>
            <button type="submit" disabled={loading}>
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </form>
        
        </div>
      </div>
    );
  }
  
  export default SignupModal;