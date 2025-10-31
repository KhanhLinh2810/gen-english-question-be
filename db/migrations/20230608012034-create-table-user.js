'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		return queryInterface.createTable('users', {
			id: {
				type: Sequelize.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			avatar_url: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
			username: {
				type: Sequelize.STRING(),
				allowNull: true,
				// unique: true,
			},
			email: {
				type: Sequelize.STRING(),
				allowNull: true,
				// unique: true,
			},
			password: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
			created_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.fn('NOW'),
			},
			updated_at: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.fn('NOW'),
			},
			deleted_at: {
				type: Sequelize.DATE,
				allowNull: true,
			},
		});
	},

	async down(queryInterface, Sequelize) {
		return queryInterface.dropTable('users');
	},
};
