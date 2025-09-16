import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VisitorsAreaChart } from './VisitorsAreaChart';
import { BookingStats } from './BookingStats';
import './Dashboard.css';

function Dashboard() {
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // for example, "confirmed"
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [updatingId, setUpdatingId] = useState(null); // Track which booking is being updated
    const navigate = useNavigate();
    const [notification, setNotification] = useState({ message: '', type: ''}); // Implementing a simple notification system


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

    // Show notification 
    const showNotification = (message, type = 'Success') => {
        setNotification({ message, type });

        // Auto-dismiss aftre 5 seconds
        setTimeout(() => {
            setNotification({ message: '', type: '' });
        }, 5000);
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

            // On success, show Notification
            showNotification(`Booking Status updated to ${newStatus}`);
            
        } catch (err) {
            console.error('Status update error:', err);
            setError(`Status update failed: ${err.message}`);
            showNotification(err.message, 'error');
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

    // Calculate dashboard metrics
    const calculateMetrics = () => {
        const totalBookings = bookings.length;
        
        // Current status counts for operational metrics
        const currentConfirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
        const checkedInBookings = bookings.filter(b => b.status === 'checked-in').length;
        const checkedOutBookings = bookings.filter(b => b.status === 'checked-out').length;
        const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
        const noShowBookings = bookings.filter(b => b.status === 'no-show').length;
        
        // Business metrics - confirmed bookings include all non-cancelled bookings
        // This counts bookings that were confirmed at some point, regardless of current status
        const confirmedBookings = totalBookings - cancelledBookings;
        
        // Calculate occupancy rate (checked-in divided by total non-cancelled bookings)
        const activeBookings = totalBookings - cancelledBookings - noShowBookings;
        const occupancyRate = activeBookings > 0 ? 
            Math.round((checkedInBookings / activeBookings) * 100) : 0;
        
        return { 
            totalBookings, 
            confirmedBookings,
            currentConfirmedBookings,
            checkedInBookings,
            checkedOutBookings,
            cancelledBookings,
            noShowBookings,
            occupancyRate
        };
    }

    

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1 className="dashboard-title">Bookings Dashboard</h1>
                <button 
                    onClick={handleLogout}
                    style={{
                        backgroundColor: '#f44336',
                        color: 'white',
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Logout
                </button>
            </div>
            
            {/* Analytics Section */}
            <div className="analytics-section">
                <h2 className="section-title">Analytics Overview</h2>
                <BookingStats />
            </div>
            
            <div className="analytics-section full-width" style={{ overflow: 'hidden' }}>
                <VisitorsAreaChart bookings={bookings} />
            </div>
            
            <h2 className="section-title">Booking Management</h2>

            {/* Notification display */}
            {notification.message && (
                <div className={`notification ${notification.type === 'Success' ? 'notification-success' : 'notification-error'}`}>
                    {notification.message}
                </div>
            )}            <div style={{
                backgroundColor: '#f5f5f5',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                alignItems: 'center'
            }}>
                {/* Search input with icon */}
                <div className="search-container">
                    <svg xmlns="http://www.w3.org/2000/svg" className="search-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <input 
                        type="text" 
                        placeholder="Search by user or room" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="filter-input search-input"
                        style={{
                            minWidth: '250px'
                        }}
                    />
                </div>
                {/* Status filter */}
                <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-input"
                >
                    <option value="">All Statuses</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked-in">Checked In</option>
                    <option value="checked-out">Checked Out</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no-show">No Show</option>
                </select>
                {/* Date range filter */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <label style={{ fontWeight: '500' }}>From:</label>
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        className="filter-input"
                    />
                    <label style={{ fontWeight: '500' }}>To:</label>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                        className="filter-input"
                    />
                </div>
            </div>

            {filteredBookings.length === 0 ? (
                <div style={{ 
                    padding: '30px', 
                    textAlign: 'center', 
                    backgroundColor: '#f9f9f9',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <p style={{ fontSize: '18px', color: '#666' }}>No bookings match your search criteria.</p>
                </div>
            ) : (
                <>
                    <div style={{ 
                        marginBottom: '20px', 
                        display: 'flex', 
                        flexWrap: 'wrap',
                        justifyContent: 'space-around', 
                        textAlign: 'center', 
                        backgroundColor: '#f9f9f9',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        gap: '15px'
                    }}>
                        {(() => {
                            const metrics = calculateMetrics();
                            return (
                                <>
                                    <div style={{ minWidth: '120px', flex: '1' }}>
                                        <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>Total Bookings</h3>
                                        <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#555' }}>{metrics.totalBookings}</p>
                                    </div>
                                    <div style={{ 
                                        minWidth: '140px', 
                                        flex: '1', 
                                        display: 'flex',
                                        flexDirection: 'column',
                                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                        borderRadius: '4px',
                                        padding: '8px 5px'
                                    }}>
                                        <h3 style={{ margin: '0 0 8px 0', color: '#4CAF50' }}>Confirmed Total</h3>
                                        <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#4CAF50' }}>{metrics.confirmedBookings}</p>
                                        <span style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                                            (Currently: {metrics.currentConfirmedBookings})
                                        </span>
                                    </div>
                                    <div style={{ minWidth: '120px', flex: '1' }}>
                                        <h3 style={{ margin: '0 0 8px 0', color: '#2196F3' }}>Checked In</h3>
                                        <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#2196F3' }}>{metrics.checkedInBookings}</p>
                                    </div>
                                    <div style={{ minWidth: '120px', flex: '1' }}>
                                        <h3 style={{ margin: '0 0 8px 0', color: '#9E9E9E' }}>Checked Out</h3>
                                        <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#9E9E9E' }}>{metrics.checkedOutBookings}</p>
                                    </div>
                                    <div style={{ minWidth: '120px', flex: '1' }}>
                                        <h3 style={{ margin: '0 0 8px 0', color: '#F44336' }}>Cancelled</h3>
                                        <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#F44336' }}>{metrics.cancelledBookings}</p>
                                    </div>
                                    <div style={{ 
                                        minWidth: '150px', 
                                        flex: '1',
                                        border: '2px dashed #BBDEFB',
                                        borderRadius: '4px',
                                        padding: '5px'
                                    }}>
                                        <h3 style={{ margin: '0 0 8px 0', color: '#1565C0' }}>Occupancy Rate</h3>
                                        <p style={{ 
                                            fontSize: '24px', 
                                            fontWeight: 'bold', 
                                            margin: '0', 
                                            color: '#1565C0'
                                        }}>
                                            {metrics.occupancyRate}%
                                        </p>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
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
                                                className="filter-input"
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
                </>
            )}
        </div>
    );
}

export default Dashboard;