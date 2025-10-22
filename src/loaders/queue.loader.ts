// import { PaymentWebhookService } from '../services/customer-contract/payment-webhook.service';
// import { Logger } from '../utility/logger.util';

// export const initializeQueue = async (): Promise<void> => {
//   const logger = new Logger({ scope: 'QueueLoader' });

//   try {
//     // Initialize PaymentWebhookService (which includes queue)
//     const webhookService = PaymentWebhookService.getInstance();

//     logger.info('PaymentWebhookService with queue initialized successfully');

//     // Graceful shutdown
//     process.on('SIGTERM', async () => {
//       logger.info('SIGTERM received, closing PaymentWebhookService...');
//       await webhookService.close();
//       process.exit(0);
//     });

//     process.on('SIGINT', async () => {
//       logger.info('SIGINT received, closing PaymentWebhookService...');
//       await webhookService.close();
//       process.exit(0);
//     });

//   } catch (error) {
//     logger.error('Failed to initialize PaymentWebhookService', {
//       error: error instanceof Error ? error.message : String(error),
//     });
//     throw error;
//   }
// };
