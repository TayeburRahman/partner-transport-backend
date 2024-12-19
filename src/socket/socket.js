const express = require('express');
const { ENUM_SOCKET_EVENT } = require('../utils/enums');
const { handleNotification } = require('../app/modules/notification/notification.service');
const { handlePartnerData } = require('../app/modules/partner/partner.socket');
const { handleMessageData } = require('../app/modules/message/message.socket');
const Admin = require('../app/modules/admin/admin.model');
const { LogAdmin } = require('../app/modules/logs-dashboard/logsdashboard.model');


const onlineUsers = new Set();

const socket = async (io) => {
  const emitActiveAdmins = async () => {
    try { 
      const onlineAdminIds = Array.from(onlineUsers);
   
      const activeAdmins = await Admin.find({ _id: { $in: onlineAdminIds } });
   
      const today = new Date().toISOString().split('T')[0];
   
      const activeAdminsWithTasks = await Promise.all(
        activeAdmins.map(async (admin) => {
          const todayCompletedTasks = await LogAdmin.countDocuments({
            admin: admin._id, 
            date: today,     
            status: "Success",  
          });
  
          return {
            ...admin.toObject(),  
            todayCompletedTasks,
          };
        })
      );
   
      io.emit(ENUM_SOCKET_EVENT.ACTIVE_ADMIN, activeAdminsWithTasks);
    } catch (error) {
      console.error('Error fetching active admins or their completed tasks:', error.message);
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
