// Green API Configuration
const ID_INSTANCE = "7105394320";
const API_TOKEN = "6184c77e6f374ddc8003957d0d3f4ccc7bc1581c600847d889";
const HOST = "https://7105.api.green-api.com";

export const sendWhatsAppMessage = async (phoneNumber: string, message: string) => {
  // Format phone number: remove non-digits. Green API expects format like "77001234567@c.us"
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const chatId = `${cleanPhone}@c.us`;

  const url = `${HOST}/waInstance${ID_INSTANCE}/SendMessage/${API_TOKEN}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chatId: chatId,
        message: message
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Green API Error:", error);
    throw new Error("Failed to send WhatsApp message");
  }
};

export const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};