const express = require('express');
const { ENUM_SOCKET_EVENT } = require('../utils/enums');
const { handleNotification } = require('../app/modules/notification/notification.service');
const { handlePartnerData } = require('../app/modules/partner/partner.socket');
const { handleMessageData } = require('../app/modules/message/message.socket');
const Admin = require('../app/modules/admin/admin.model');

 
const onlineUsers = new Set();

const socket = async (io) => {
  const emitActiveAdmins = async () => {
    try {
      // Fetch active admin details
      const activeAdmins = await Admin.find({ _id: { $in: Array.from(onlineUsers) } });
      // Emit the updated list of active admins
      io.emit(ENUM_SOCKET_EVENT.ACTIVE_ADMIN, activeAdmins);
    } catch (error) {
      console.error('Error fetching active admins:', error.message);
    }
  };

  io.on(ENUM_SOCKET_EVENT.CONNECT, async (socket) => {
    const currentUserId = socket.handshake.query.id;
    const role = socket.handshake.query.role;

    socket.join(currentUserId);

    // Add the user to the online users set
    onlineUsers.add(currentUserId);

    console.log('A user connected', currentUserId);

    // Automatically emit active admins when a user connects
    await emitActiveAdmins();

    // Handle message events
    await handleMessageData(currentUserId, role, socket, io, onlineUsers);

    // Handle partner events
    await handlePartnerData(currentUserId, role, socket, io);

    // Handle user disconnection
    socket.on('disconnect', async () => {
      console.log('A user disconnected', currentUserId);

      // Remove user from online users
      onlineUsers.delete(currentUserId);

      // Automatically emit active admins when a user disconnects
      await emitActiveAdmins();
    });
  });
};

module.exports = socket;
