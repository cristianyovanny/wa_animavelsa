import sendToWhatsApp from '../utils/sendToWhatsApp.js';

class whatsappService {

    async sendMessage(to, body, messageId) {
        try {
            const payload = {
                messaging_product: 'whatsapp',
                to,
                text: { body: body },
                //context: { message_id: messageId },
            };
            await sendToWhatsApp(payload);
            return { status: 'Message sent successfully' };
        } catch (error) {
            console.error('Error sending message to WhatsApp:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async markAsRead(messageId) {
        try {
            const payload = {
                messaging_product: 'whatsapp',
                status: 'read',
                message_id: messageId,
            };
            await sendToWhatsApp(payload);
            return { status: 'Message marked as read successfully' };
        } catch (error) {
            console.error('Error marking message as read:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async sendInteractiveButtons(to, BodyText, buttons) {
        try {
            const payload = {
                messaging_product: 'whatsapp',
                to: to,
                type: 'interactive',
                interactive: {
                    type: 'button',
                    body: {
                        text: BodyText
                    },
                    action: {
                        buttons: buttons
                    }
                }
            };

            await sendToWhatsApp(payload);
            return { status: 'Interactive buttons sent successfully' };

        } catch (error) {
            console.error('Error sending interactive buttons:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async sendInteractiveButtons(to, BodyText, buttons) {
        try {
            const payload = {
                messaging_product: 'whatsapp',
                to: to,
                type: 'interactive',
                interactive: {
                    type: 'button',
                    body: { 
                        text: BodyText 
                    },
                    action: {
                        buttons: buttons
                    }
                }
            };

            await sendToWhatsApp(payload);
            return { status: 'Interactive buttons sent successfully' };

        } catch (error) {
            console.error('Error sending interactive buttons:', error.response ? error.response.data : error.message);
            throw error;
        }
    } 

    async sendMediaMessage(to, type, mediaUrl, caption) {
      try {
          const mediaObject = {}

          switch (type) {
              case 'image':
                  mediaObject.image = { link: mediaUrl, caption: caption };
                  break;
              case 'audio':
                    mediaObject.audio = { link: mediaUrl };
                    break;
              case 'video':
                  mediaObject.video = { link: mediaUrl, caption: caption };
                  break;
              case 'document':
                  mediaObject.document = { link: mediaUrl, caption: caption, filename: 'medpet.pdf' };
                  break;
              default:
                  throw new Error('Unsupported media type');
          }
          const payload = {
              messaging_product: 'whatsapp',
              to: to,
              type: type,
              ...mediaObject
          };
          await sendToWhatsApp(payload);
          return { status: 'Media message sent successfully' };

      } catch (error) {
          console.error('Error sending media message:', error.response ? error.response.data : error.message);
          throw error;
      }
    }

    async sendContactMessage(to, contact) {
        try {
            const payload = {
                messaging_product: 'whatsapp',
                to: to,
                type: 'contacts',
                contacts: [ contact ]
            };

            await sendToWhatsApp(payload);
            return { status: 'Contact message sent successfully' };

        } catch (error) {
            console.error('Error sending contact message:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async sendLocationMessage(to, location) {
        const payload = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'location',
            location: {
                latitude: location.latitude,
                longitude: location.longitude,
                name: location.name,
                address: location.address
            }
        };

        await sendToWhatsApp(payload);
        return { status: 'Location message sent successfully' };
    }
}

export default new whatsappService();