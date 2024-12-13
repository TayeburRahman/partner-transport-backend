const { default: axios } = require("axios");
const config = require("../../../config"); 
 

const sendNotificationOnesignal = async (playerIds, title, message, types, getId) => {   
  let router = "";

  switch (types) {
    case "service":
      router = "serviceDetails";
      break;
    case "none":
      router = "getNotification";
      break;
    case "notice":
      router = "notificationNotice";
      break;
    case "new-message":
      router = "getNewMassage";
      break;
    case "ongoing":
      router = "getOnGoing";
      break;
    case "complete-status":
      router = "getCompleteService";
      break;
    default:
      console.warn("Unknown notification type:", types);
  }
 
  const data = {
    app_id: config.onesignal.app_id,
    contents: { en: message },
    headings: { en: title },
    include_player_ids: playerIds,
    data: {
      route: router,
      getId: getId || "",

    }
  };

  const headers = {
    'Authorization': `Basic ${config.onesignal.api_key}`,
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios.post(
      'https://onesignal.com/api/v1/notifications',
      data,
      { headers }
    );
    console.log('Notification sent:', response.data);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

module.exports = { sendNotificationOnesignal };
