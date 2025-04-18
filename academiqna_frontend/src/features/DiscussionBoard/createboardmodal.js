import React from 'react';
import '../../css/createboardmodal.css';

// Component for creating a new discussion board
function CreateBoardModal({ 
    show, 
    onClose, 
    onCreate, 
    title, 
    setTitle, 
    description, 
    setDescription, 
    image, 
    setImage 
}) {
    // If modal is not supposed to show, return null
    if (!show) return null;  
    return (
        <div className="modalOverlay"> {/* Dark background overlay */}
            <div className="modalContent">
                <span className="closeButton" onClick={onClose}>&times;</span>
                <h2>Create Discussion Board</h2>
                
                <input 
                    type="text"
                    placeholder="Board Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="modalInput"
                />

                <textarea 
                    placeholder="Board Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="modalTextarea"
                />

                <input 
                    type="file"
                    onChange={(e) => setImage(e.target.files[0])}
                    className="modalInput"
                />
                {/* Buttons to cancel or create the board */}
                <div className="modalButtonGroup">
                    <button onClick={onClose} className="cancelButton">Cancel</button>
                    <button onClick={onCreate} className="createButton">Create</button>
                </div>
            </div>
        </div>
    );
}

export default CreateBoardModal;
