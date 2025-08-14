import React, { useState, useEffect } from 'react';


export default function RoomBookingForm({ onResults, room, checkIn, checkOut, persons, onBookingComplete, isBooking, showModal }) {

    // State variable for room selection
    const [rooms, setRooms] = useState([]);
    // Form Fields
    const [formData, setFormData] = useState({       
        phone: '',
        email: '',
        name: '',
        room: room ? room._id : '',
        checkIn: checkIn || '',
        checkOut: checkOut || '',
        persons: persons || '',
    });

    useEffect(() => {
        if (room) setFormData(f => ({ ...f, room: room._id }));
        if (checkIn) setFormData(f => ({ ...f, checkIn }));
        if (checkOut) setFormData(f => ({ ...f, checkOut }));
        if (persons) setFormData(f => ({ ...f, persons }));
    }, [room, checkIn, checkOut, persons]);

    useEffect(() => {
        fetch('http://localhost:5000/rooms')
            .then(res => res.json())
            .then(data => setRooms(data));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isBooking) {
            // Booking mode: send booking data to backend
            try {
                const res = await fetch('http://localhost:5000/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });
                const result = await res.json();
                
                if (res.ok) {
                    showModal({
                        title: 'Booking Successful !',
                        message: `Your room has been booked successfully for ${formData.checkIn} to ${formData.checkOut}.`,
                        isSuccess: true
                    });
                    if (onBookingComplete) onBookingComplete();
                } else if (res.status === 409) {
                    showModal({
                        title: 'Booking Conflict',
                        message: 'This room is already booked for the selected dates. Please choose different dates or another room.',
                        isSuccess: false
                    });
                } else {
                    showModal({
                        title: 'Booking Failed',
                        message: result.error || 'Unable to complete your booking. Please try again.',
                        isSuccess: false
                    });
                }
            } catch (err) {
                showModal({
                    title: 'Error',
                    message: 'An unexpected error occurred. Please try again.',
                    isSuccess: false
                });
            }
        } else {
            // Search mode: search for available rooms
            const res = await fetch('http://localhost:5000/available-rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const availableRooms = await res.json();
            onResults(formData, availableRooms);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Booking mode: show user info fields and read-only booking details */}
            {isBooking ? (
                <>
                    <label>
                        Name:
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </label>
                    <label>
                        Email:
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </label>
                    <label>
                        Phone:
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </label>
                    <label>
                        Check-in Date:
                        <input type="date" value={formData.checkIn} readOnly />
                    </label>
                    <label>
                        Check-out Date:
                        <input type="date" value={formData.checkOut} readOnly />
                    </label>
                    <label>
                        Number of Persons:
                        <input type="number" value={formData.persons} readOnly />
                    </label>
                </>
            ) : (
                // Pre-booking mode: only show booking criteria fields
                <>
                    <label>
                        Check-in Date:
                        <input
                            type="date"
                            name="checkIn"
                            value={formData.checkIn}
                            onChange={e => setFormData({ ...formData, checkIn: e.target.value })}
                        />
                    </label>
                    <label>
                        Check-out Date:
                        <input
                            type="date"
                            name="checkOut"
                            value={formData.checkOut}
                            onChange={e => setFormData({ ...formData, checkOut: e.target.value })}
                        />
                    </label>
                    <label>
                        Number of Persons:
                        <select
                            name="persons"
                            value={formData.persons}
                            onChange={e => setFormData({ ...formData, persons: e.target.value })}
                        >
                            <option value="">--Select--</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                        </select>
                    </label>
                </>
            )}
            <button type="submit">{isBooking ? 'Book Now' : 'Search'}</button>
        </form>
    );
}
