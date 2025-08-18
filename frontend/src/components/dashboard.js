import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // for example, "confirmed"
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
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
    const handleLogout = () => {
        // Remove the token from local storage
        localStorage.removeItem('token');

        // redirect the user to the login page
        navigate('/login');
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
                    <option value="cancelled">Cancelled</option>
                    {/* Add more statuses as needed */}
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
                <table border="1" cellPadding="10">
                    <thead>
                        <tr>
                            <th>User Name</th>
                            <th>Room</th>
                            <th>Check-In Date</th>
                            <th>Check-Out Date</th>
                            <th>Persons</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBookings.map((booking) => (
                            <tr key={booking._id}>
                                <td>{booking.user.name}</td>
                                <td>{booking.room && booking.room.name ? booking.room.name : booking.room}</td>
                                <td>{new Date(booking.checkInDate).toLocaleDateString()}</td>
                                <td>{new Date(booking.checkOutDate).toLocaleDateString()}</td>
                                <td>{booking.persons}</td>
                                <td>{booking.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default Dashboard;