// import { Range, RecurrenceRule, scheduleJob } from 'node-schedule';
// /**
//  * Schedules a job to send reminders to users based on a given rule
//  * @param rule The rule used to schedule the job
//  */

// export default () => {
//   const rule = new RecurrenceRule();
//   rule.second = 0; // Run at the start of every minute
//   rule.minute = new Range(0, 59, 10); // Run every 10 minutes

//   scheduleJob(rule, async () => {
//     try {
//       console.log('start cron');
//       await RepairService.changeStatusToExpired();
//       console.log('end cron');
//     } catch (error) {
//       console.error(`Error changing status orders: ${error}`);
//     }
//   });

//   changeSubmitImeiStatusToExpired();
// };

// function changeSubmitImeiStatusToExpired() {
//   scheduleJob('0 * * * *', async () => {
//     try {
//       console.log('start cron submit imei');
//       await SubmitImeiService.updateSubmitImeiStatusIfImeiExpired();
//       console.log('end cron submit imei');
//     } catch (e) {
//       console.error('Error changing status submit imei: ', e);
//     }
//   });
// }
