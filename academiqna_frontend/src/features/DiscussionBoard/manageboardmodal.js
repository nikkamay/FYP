// Importing react and hooks
import React from 'react';
import '../../css/manageboardmodal.css';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// ManageBoardModal for discussion board management strictly for board creators
function ManageBoardModal({
  showManageModal,
  setShowManageModal,
  fetchMembers,
  setShowMembersList,
  showMembersList,
  setShowMembersListFalse,
  members,
  removeMember,
  board,
  userToken,
  fetchBoardDetails
}) {
  const MySwal = withReactContent(Swal);

  if (!showManageModal && !showMembersList) return null;

  const deleteBoard = async () => {
    const result = await MySwal.fire({
      title: 'Are you sure?',
      text: 'You are about to delete this board. This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });
  
    if (result.isConfirmed) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/api/discussion-boards/${board.id}/delete/`, {
          headers: {
            Authorization: `Token ${userToken}`
          }
        });
  
        await MySwal.fire('Deleted!', 'The board has been deleted.', 'success');
        window.location.href = '/discussion-boards';  // 
      } catch (error) {
        console.error('Error deleting board:', error);
        MySwal.fire('Error', 'Failed to delete board.', 'error');
      }
    }
  };
  
  const editBoard = async () => {
    const { value: formValues } = await MySwal.fire({
      title: 'Edit Board',
      html: `
        <label for="swal-input1" class="swal-label">Board Title</label>
        <input id="swal-input1" class="swal2-input" placeholder="Enter board title" value="${board.title}">

        <label for="swal-input2" class="swal-label">Board Description</label>
        <textarea id="swal-input2" class="swal2-textarea" placeholder="Enter board description">${board.description}</textarea>

        <label for="swal-input3" class="swal-label">Board Image</label>
        <input id="swal-input3" type="file" class="swal2-file">
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const title = document.getElementById('swal-input1').value;
        const description = document.getElementById('swal-input2').value;
        const fileInput = document.getElementById('swal-input3');
        const file = fileInput.files[0];
  
        if (!title || !description) {
          Swal.showValidationMessage('Please fill out Title and Description');
        }
        
        return { title, description, file };
      }
    });

    
    
  
    if (!formValues) return;
  
    const { title, description, file } = formValues;
  
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (file) {
      formData.append('board_image', file);
    }
  
    try {
      await axios.put(`http://127.0.0.1:8000/api/api/discussion-boards/${board.id}/`, formData, {
        headers: {
          Authorization: `Token ${userToken}`,
          "Content-Type": "multipart/form-data",
        },
      });
  
      await MySwal.fire('Success!', 'Board updated successfully!', 'success');
      setShowManageModal(false);
      fetchBoardDetails();
    } catch (error) {
      console.error('Error updating board:', error);
      MySwal.fire('Error', 'Failed to update board.', 'error');
    }
  };

  return (
    <>
      {showManageModal && (
        <div className="modalOverlay">
          <div className="modalContent">
            <h2>Manage Board</h2>
            <button onClick={() => { fetchMembers(); setShowMembersList(true); }}>
              View Members
            </button>
            <button onClick={editBoard}>
              Edit Board
            </button>
            <button onClick={deleteBoard}>
              Delete Board
            </button>


            <button onClick={() => setShowManageModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {showMembersList && (
        <div className="modalOverlay">
          <div className="modalContent">
            <h2>Members</h2>
            {members.length > 0 ? (
              members.map((member) => (
                <div key={member.id} className="memberRow">
                  <span>{member.username}</span>
                  <button
                    className="removeMemberBtn"
                    onClick={() => removeMember(member.id)}
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <p>No members found.</p>
            )}
            <button onClick={setShowMembersListFalse}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}

export default ManageBoardModal;
