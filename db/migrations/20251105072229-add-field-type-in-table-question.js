'use strict';

const { DataTypes, Sequelize } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */

const TABLE = 'questions';
const NEW_COLUMNS = [
  {
    name: 'type',
    type: {
      type: DataTypes.SMALLINT,
      allowNull: false, 
      defaultValue: 1
    },
  },
];


module.exports = {
  async up(queryInterface) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			for (const newColumn of NEW_COLUMNS) {
				// Check if column already exists
				const [results] = await queryInterface.sequelize.query(
					`SELECT COLUMN_NAME 
					 FROM INFORMATION_SCHEMA.COLUMNS 
					 WHERE TABLE_SCHEMA = DATABASE() 
					 AND TABLE_NAME = '${TABLE}' 
					 AND COLUMN_NAME = '${newColumn.name}'`,
					{ transaction }
				);

				// Only add column if it doesn't exist
				if (results.length === 0) {
					await queryInterface.addColumn(
						TABLE,
						newColumn.name,
						newColumn.type,
						{ transaction },
					);
				}
			}
		});
	},

	async down(queryInterface) {
		await queryInterface.sequelize.transaction(async (transaction) => {
			for (const newColumn of NEW_COLUMNS) {
				await queryInterface.removeColumn(TABLE, newColumn.name, {
					transaction,
				});
			}
		});
	},
};
