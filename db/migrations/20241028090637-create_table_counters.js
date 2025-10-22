'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('counters', {
			sequence_name: {
				type: Sequelize.STRING,
				allowNull: false,
				primaryKey: true,
			},
			value: {
				type: Sequelize.INTEGER,
				allowNull: true,
				defaultValue: 0,
			},
		});
	},

	async down(queryInterface, Sequelize) {
		/**
		 * Add reverting commands here.
		 *
		 * Example:
		 * await queryInterface.dropTable('users');
		 */
		return queryInterface.dropTable('counters');
	},
};
