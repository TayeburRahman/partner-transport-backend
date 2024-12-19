const express = require('express');  
const { ENUM_SOCKET_EVENT } = require('../utils/enums');
const {handleNotification} = require('../app/modules/notification/notification.service');
const { handlePartnerData } = require('../app/modules/partner/partner.socket');
const { handleMessageData } = require('../app/modules/message/message.socket');
const Admin = require('../app/modules/admin/admin.model');
   
 
// Set to keep track of online users
const onlineUsers = new Set();

const socket = async (io) => {
  io.on(ENUM_SOCKET_EVENT.CONNECT, async (socket) => {
    const currentUserId = socket.handshake.query.id;
    const role = socket.handshake.query.role;

    socket.join(currentUserId); 

    // Add the user to the online users set
    onlineUsers.add(currentUserId);

    // io.emit("onlineUser", Array.from(onlineUsers));
    console.log("A user connected======", onlineUsers);
    
    socket.on(ENUM_SOCKET_EVENT.ACTIVE_ADMIN, async (data) => {
      console.log("onlineUsers", onlineUsers)

      const activeAdmin = await Admin.find({_id: onlineUsers })
       
      io.emit(ENUM_SOCKET_EVENT.ACTIVE_ADMIN, Array.from(onlineUsers)); 
    })

    // Handle massage events
    await handleMessageData(currentUserId, role, socket, io, onlineUsers)

    // Handle partner events
    await handlePartnerData(currentUserId, role, socket, io)

    // Handle user disconnection
    socket.on("disconnect", () => {
      console.log("A user disconnected", currentUserId);
      // Remove user from online users
      onlineUsers.delete(currentUserId);  
      io.emit("onlineUser", Array.from(onlineUsers)); 
    });
  });
};

// Export the socket initialization function
module.exports = socket;
