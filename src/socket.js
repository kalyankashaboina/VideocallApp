// src/socket.js
import { io } from 'socket.io-client';

// Use the same URL your backend is running on
const socket = io('http://localhost:5000'); // Replace with your backend URL

export default socket;
