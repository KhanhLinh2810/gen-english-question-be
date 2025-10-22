// 'use strict';

// const { DataTypes, Sequelize } = require('sequelize');

// /** @type {import('sequelize-cli').Migration} */

// const tableName = 'positions'
// const NEW_COLUMNS = [
//   {
//     name: 'agency_id',
//     type: {
//       type: DataTypes.INTEGER,
//       allowNull: true,
//       references: {
//         model: 'agencies',
//         key: 'id',
//       },
//       onUpdate: 'CASCADE',
//       onDelete: 'CASCADE',
//     },
//   },
// ];

// module.exports = {
//   async up(queryInterface) {
//     await queryInterface.sequelize.transaction(async (transaction) => {
//       for (const newColumn of NEW_COLUMNS) {
//         await queryInterface.addColumn(
//           tableName,
//           newColumn.name,
//           newColumn.type,
//           { transaction },
//         );
//       }
//     });
//   },

//   async down(queryInterface) {
//     await queryInterface.sequelize.transaction(async (transaction) => {
//       for (const newColumn of NEW_COLUMNS) {
//         await queryInterface.removeColumn(tableName, newColumn.name, {
//           transaction,
//         });
//       }
//     });
//   },
// };
