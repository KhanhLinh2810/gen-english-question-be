'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		const password = await bcrypt.hash(
			process.env.PASSWORD || '123456',
			Number(process.env.SALT_ROUNDS || 10),
		);

		const transaction = await queryInterface.sequelize.transaction();

		try {
			const [existingAdmin] = await queryInterface.sequelize.query(
				`SELECT * FROM users WHERE username = 'admin' OR email = 'admin@gmail.com'`,
				{ transaction },
			);

			if (existingAdmin.length === 0) {
				await queryInterface.bulkInsert(
					'users',
					[
						{
							username: 'admin',
							email: 'admin@gmail.com',
							password: password,
							created_at: new Date(),
							updated_at: new Date(),
						},
					],
					{ transaction },
				);
			} else {
				await queryInterface.bulkUpdate(
					'users',
					{ username: 'admin', email: 'admin@gmail.com', password: password },
					{ transaction },
				);
			}

			await transaction.commit();
		} catch (error) {
			await transaction.rollback();
			throw error;
		}
	},

	async down(queryInterface, Sequelize) {
		/**
		 * Add commands to revert seed here.
		 *
		 * Example:
		 * await queryInterface.bulkDelete('People', null, {});
		 */
	},
};
