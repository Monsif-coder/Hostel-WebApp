import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // for example, "confirmed"
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [updatingId, setUpdatingId] = useState(null); // Track which booking is being updated
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        
        fetch('http://localhost:5000/dashboard/bookings', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setBookings(data);
            })
            .catch(err => {
                setError(err.message);
            });
    }, []);

    // Logging current user out
    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');
            
            // Call the backend to invalidate the token
            await fetch('http://localhost:5000/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Remove the token from local storage
            localStorage.removeItem('token');
            
            // Redirect the user to the login page
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            // Even if server-side logout fails, remove token from localStorage and redirect
            localStorage.removeItem('token');
            navigate('/login');
        }
    };

    // Handle booking status change
    const handleStatusChange = async (bookingId, newStatus) => {
        try {
            setUpdatingId(bookingId); // Show updating indicator
            
            const token = localStorage.getItem('token');
            console.log(`Updating booking ${bookingId} to status: ${newStatus}`);
            console.log(`API URL: http://localhost:5000/bookings/${bookingId}/status`);
            
            const response = await fetch(`http://localhost:5000/bookings/${bookingId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            // Log the raw response for debugging
            const responseText = await response.text();
            console.log('Raw API Response:', responseText);
            
            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}: ${responseText}`);
            }
            
            // Parse the response as JSON
            let updatedBooking;
            try {
                updatedBooking = JSON.parse(responseText);
            } catch (parseError) {
                throw new Error(`Failed to parse response as JSON: ${responseText.substring(0, 100)}...`);
            }
            
            // Update the bookings array with the updated booking
            setBookings(bookings.map(booking => 
                booking._id === bookingId ? updatedBooking : booking
            ));
            
        } catch (err) {
            console.error('Status update error:', err);
            setError(`Status update failed: ${err.message}`);
        } finally {
            setUpdatingId(null); // Hide updating indicator
        }
    };

    // Filtering the bookings based on searchTerm and statusFilter.
    const filteredBookings = bookings.filter(booking => {
        // Check if the user name or room name includes the search term (case-insensitive)
        const matchesSearch = (booking.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (booking.room && booking.room.name && booking.room.name.toLowerCase().includes(searchTerm.toLowerCase())));
        // Check if status filter is set; if so, filter by booking.status
        const matchesStatus = statusFilter ? booking.status === statusFilter : true;

        // Check if the booking's date range overlaps with the selected date range
        const matchesDateRange = (!startDate || !endDate) || 
            (new Date(booking.checkInDate) <= new Date(endDate) && new Date(booking.checkOutDate) >= new Date(startDate));

        // Return booking if it matches all conditions
        return matchesSearch && matchesStatus && matchesDateRange;
    });

    if (error) {
        return <div>Error: {error}</div>;
    }

    // Helper function to get color based on booking status
    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return '#4CAF50'; // Green
            case 'checked-in': return '#2196F3'; // Blue
            case 'checked-out': return '#9E9E9E'; // Gray
            case 'cancelled': return '#F44336'; // Red
            case 'no-show': return '#FF9800'; // Orange
            default: return '#000000'; // Black
        }
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Bookings Dashboard</h1>
                <button 
                    onClick={handleLogout}
                    style={{
                        backgroundColor: '#f44336',
                        color: 'white',
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontFamily: 'Arial, sans-serif'
                    }}
                >
                    Logout
                </button>
            </div>
            
            <div>
                {/* Search input */}
                <input 
                    type="text" 
                    placeholder="Search by user or room" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
                {/* Status filter */}
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked-in">Checked In</option>
                    <option value="checked-out">Checked Out</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no-show">No Show</option>
                </select>
                {/* Date range filter */}
                <div>
                    <label>Start Date:</label>
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                    />
                    <label>End Date:</label>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                    />
                </div>
            </div>
            {filteredBookings.length === 0 ? (
                <p>No bookings available.</p>
            ) : (
                <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f2f2f2' }}>
                            <th>User Name</th>
                            <th>Room</th>
                            <th>Check-In Date</th>
                            <th>Check-Out Date</th>
                            <th>Persons</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBookings.map((booking) => (
                            <tr key={booking._id} style={{ 
                                borderBottom: '1px solid #ddd'
                            }}>
                                <td>{booking.user.name}</td>
                                <td>{booking.room && booking.room.name ? booking.room.name : booking.room}</td>
                                <td>{new Date(booking.checkInDate).toLocaleDateString()}</td>
                                <td>{new Date(booking.checkOutDate).toLocaleDateString()}</td>
                                <td>{booking.persons}</td>
                                <td style={{ 
                                    color: getStatusColor(booking.status),
                                    fontWeight: 'bold' 
                                }}>
                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </td>
                                <td>
                                    {updatingId === booking._id ? (
                                        <span style={{ color: '#2196F3', fontStyle: 'italic' }}>Updating...</span>
                                    ) : (
                                        <select 
                                            value={booking.status}
                                            onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                                            style={{
                                                padding: '6px',
                                                border: '1px solid #ccc',
                                                borderRadius: '4px',
                                                backgroundColor: '#f9f9f9'
                                            }}
                                        >
                                            <option value="confirmed">Confirmed</option>
                                            <option value="checked-in">Checked In</option>
                                            <option value="checked-out">Checked Out</option>
                                            <option value="cancelled">Cancelled</option>
                                            <option value="no-show">No Show</option>
                                        </select>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default Dashboard;