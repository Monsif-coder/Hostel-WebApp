import React, {useEffect, useState } from 'react';


import RoomBookingForm from './components/RoomBookingForm';

import BookingModal from './components/BookingModal';


function HomePage() {
    const [availableRooms, setAvailableRooms] = useState([]);
    const [dinner, setDinner] = useState(null);
    const [tours, setTours] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [searchCriteria, setSearchCriteria] = useState(null);

    const [modalState, setModalState] = useState({
        isOpen: false,
        title: '',
        message: '',
        isSuccess: false,
    });

    const handleSearch = (criteria, availableRooms) => {
        setSearchCriteria(criteria);
        setAvailableRooms(availableRooms);
        setSelectedRoom(null);
    };

    const handleShowModal = (modalConfig) => setModalState({ ...modalConfig, isOpen: true });



    useEffect (() => {
        // Fetch dinner of the day
        fetch('http://localhost:5000/dinner')
        .then(res => res.json())
        .then(data => setDinner(data));

        // Fetch tours
        fetch('http://localhost:5000/tours')
            .then(res => res.json())
            .then(data => setTours(data));

    }, []);


    return (
        <div>
            <h1> Welcome To Moroccan Friends House</h1>

            <RoomBookingForm onResults={handleSearch} showModal={handleShowModal} />

            <h2>available Rooms</h2>
            <ul>
                {availableRooms.map( room => (
                    <li key={room._id}>
                        {room.name} (Capacity: {room.capacity})
                        <button onClick={() => setSelectedRoom(room)}>Book</button>

                    </li>
                ))}

                
            </ul>

            {/* Show Booking form next to available room */}

            {selectedRoom && searchCriteria && (
                <RoomBookingForm 
                room={selectedRoom}
                checkIn={searchCriteria.checkIn}
                checkOut={searchCriteria.checkOut}
                persons={searchCriteria.persons}
                onBookingComplete={ () => setSelectedRoom(null)}
                isBooking
                showModal={handleShowModal}
                />
            )}



            <h2> Dinner of the day</h2>
            {dinner ? (
                <div>
                    <strong>{dinner.name}</strong> ({dinner.weekday}) - Price {dinner.price}
                    <br />
                    Vegetarian Option: {dinner.vegetarianOption ? 'Yes' : 'No'}
                    <br />
                    Allergens: {dinner.allergens.join(',')}
                    </div>

            ) : (
                <div> Chef is on strike :( </div>
            )}

            <h2> Tours</h2>
            <ul>
        {tours.map(tour => (
          <li key={tour._id}>
            {tour.name} - Price: {tour.price} - {tour.Description}
          </li>
        ))}
      </ul>

      <BookingModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ ...modalState, isOpen: false })}
                title={modalState.title}
                message={modalState.message}
                isSuccess={modalState.isSuccess}
            />
        </div>
    );
}


export default HomePage;