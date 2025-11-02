import { Router } from 'express';
import { getMessaging, sendTestNotification } from '../config/firebase.js';
import { BadRequestError, InternalServerError } from '../utils/errors.js';
import { logError, logInfo } from '../utils/logger.js';

const router = Router();

router.get('/ping', (_req, res) => {
  res.json({
    success: true,
    message: 'FCM test routes are working!',
    timestamp: new Date().toISOString(),
  });
});

router.get('/token', async (_req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Access token endpoint only available in development',
      });
    }

    const { GoogleAuth } = await import('google-auth-library');

    const auth = new GoogleAuth({
      credentials: {
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
      },
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });

    const accessToken = await auth.getAccessToken();

    res.json({
      success: true,
      data: {
        accessToken,
        projectId: process.env.FIREBASE_PROJECT_ID,
        expiresIn: '3600s',
      },
    });
  } catch (error) {
    logError('Failed to get FCM access token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get access token',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/validate', async (req, res) => {
  try {
    const { token, title, body, data } = req.body;

    if (!token) {
      throw new BadRequestError('Token is required');
    }

    const messaging = getMessaging();

    const message = {
      token,
      notification: {
        title: title || 'Test Notification',
        body: body || 'This is a test notification',
      },
      data: data || {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
    };

    const response = await messaging.send(message, true);

    logInfo('FCM message validation successful:', response);

    res.json({
      success: true,
      message: 'FCM message validation successful',
      data: {
        response,
        validated: true,
      },
    });
  } catch (error) {
    logError('FCM message validation failed:', error);
    res.status(400).json({
      success: false,
      message: 'FCM message validation failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/send', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new BadRequestError('Token is required');
    }

    const response = await sendTestNotification(token);

    if (response) {
      res.json({
        success: true,
        message: 'FCM message sent successfully',
        data: {
          sent: true,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      throw new InternalServerError('Failed to send FCM message');
    }
  } catch (error) {
    logError('FCM message send failed:', error);
    res.status(500).json({
      success: false,
      message: 'FCM message send failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/batch', async (req, res) => {
  try {
    const { tokens, title, body, data } = req.body;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      throw new BadRequestError('Tokens array is required');
    }

    const messaging = getMessaging();
    const results = [];

    for (const token of tokens) {
      try {
        const message = {
          token,
          notification: {
            title: title || 'Batch Test Notification',
            body: body || 'This is a batch test notification',
          },
          data: data || {
            type: 'batch_test',
            timestamp: new Date().toISOString(),
          },
        };

        const response = await messaging.send(message);
        results.push({ token, success: true, response });
      } catch (error) {
        results.push({
          token,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    res.json({
      success: true,
      message: `Batch FCM test completed: ${successCount} successful, ${failureCount} failed`,
      data: {
        total: tokens.length,
        successful: successCount,
        failed: failureCount,
        results,
      },
    });
  } catch (error) {
    logError('FCM batch test failed:', error);
    res.status(500).json({
      success: false,
      message: 'FCM batch test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
