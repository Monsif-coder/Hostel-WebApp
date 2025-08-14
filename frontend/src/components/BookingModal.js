import React from 'react';

const BookingModal = ({ isOpen, onClose, title, message, isSuccess }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        }}>

            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                maxWidth: '400px',
                width: '90%',
            }}>

                <h2 style={{ color: isSuccess ? '#2ecc71' : '#e74c3c' }}>{title}</h2>
                <p>{message}</p>
                <button
                    onClick={onClose}
                    style={{
                        marginTop: '16px',
                        padding: '8px 16px',
                        backgroundColor: isSuccess ? '#2ecc71' : '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}

                    >
                        Close
                    </button>
            </div>
        </div>
    );
};

export default BookingModal;