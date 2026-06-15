import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const CRM_BASE_URL = process.env.CRM_BASE_URL || 'http://localhost:3000';

const delay = (min: number, max: number) => 
  new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min) * 1000));

const sendReceiptWithRetry = async (communicationId: string, status: string, attempt = 1): Promise<void> => {
  try {
    await axios.post(`${CRM_BASE_URL}/api/receipt`, {
      communicationId,
      status
    });
    console.log(`[Webhook] Sent status '${status}' for communication '${communicationId}' successfully.`);
  } catch (error: any) {
    console.error(`[Webhook Error] Failed to send status '${status}' for communication '${communicationId}' (Attempt ${attempt}/3). Error: ${error.message}`);
    if (attempt < 3) {
      const backoffDelay = Math.pow(2, attempt) * 1000;
      console.log(`[Webhook Retry] Retrying in ${backoffDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      return sendReceiptWithRetry(communicationId, status, attempt + 1);
    } else {
      console.error(`[Webhook Failed] Max retries reached for communication '${communicationId}'.`);
    }
  }
};

app.post('/send', (req, res) => {
  const { communicationId, customerId, channel, message, recipientName } = req.body;
  
  if (!communicationId) {
    return res.status(400).json({ error: 'communicationId is required' });
  }

  // 1. Immediately respond 200
  res.status(200).json({ success: true, communicationId });
  
  console.log(`[Send] Received send request for communication '${communicationId}' to '${recipientName}' via '${channel}'.`);

  // Fire-and-forget the async process
  (async () => {
    // 8% chance to fail entirely and skip delivery
    const isFailed = Math.random() < 0.08;

    // After 1–4 seconds random delay
    await delay(1, 4);

    if (isFailed) {
      await sendReceiptWithRetry(communicationId, 'FAILED');
      return; // Stop further processing
    }

    // Call back with DELIVERED
    await sendReceiptWithRetry(communicationId, 'DELIVERED');

    // After another 2–6 seconds
    await delay(2, 6);

    // 55% chance call back with OPENED
    const isOpened = Math.random() < 0.55;
    if (isOpened) {
      await sendReceiptWithRetry(communicationId, 'OPENED');
      
      // After another 1–3 seconds
      await delay(1, 3);
      
      // 20% chance call back with CLICKED (only if opened)
      // Actually, instructions say "20% chance" - could mean 20% of all, or 20% of opened. 
      // I'll assume 20% independent chance if it reached this point, or just 0.2 probability.
      const isClicked = Math.random() < 0.20;
      if (isClicked) {
        await sendReceiptWithRetry(communicationId, 'CLICKED');
      }
    }
  })();
});

app.listen(PORT, () => {
  console.log(`Channel Stub Service running on port ${PORT}`);
  console.log(`CRM Webhook URL configured as: ${CRM_BASE_URL}/api/receipt`);
});
